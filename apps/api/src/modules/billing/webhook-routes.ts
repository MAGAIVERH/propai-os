import { getDb, stripeEvents, tenantSettings } from "@propai/db";
import { eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type Stripe from "stripe";

import { apiError } from "../../lib/api-error.js";
import { getStripeClient, getStripeWebhookSecret } from "../../lib/stripe-client.js";

/** Maps a Stripe subscription status to our plan + status columns. */
function planForStatus(status: string): "free" | "pro" {
  return status === "active" || status === "trialing" ? "pro" : "free";
}

async function updateTenantBilling(
  tenantId: string,
  values: Partial<{
    plan: "free" | "pro";
    subscriptionStatus: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string | null;
  }>,
): Promise<void> {
  await getDb()
    .update(tenantSettings)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(tenantSettings.organizationId, tenantId));
}

async function resolveTenantId(
  customerId: string | null,
  metadataTenantId: string | undefined,
): Promise<string | null> {
  if (metadataTenantId) return metadataTenantId;
  if (!customerId) return null;
  const rows = await getDb()
    .select({ id: tenantSettings.organizationId })
    .from(tenantSettings)
    .where(eq(tenantSettings.stripeCustomerId, customerId))
    .limit(1);
  return rows[0]?.id ?? null;
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId =
        session.client_reference_id ??
        (await resolveTenantId(
          typeof session.customer === "string" ? session.customer : null,
          undefined,
        ));
      if (!tenantId) return;
      await updateTenantBilling(tenantId, {
        plan: "pro",
        subscriptionStatus: "active",
        ...(typeof session.customer === "string" ? { stripeCustomerId: session.customer } : {}),
        ...(typeof session.subscription === "string"
          ? { stripeSubscriptionId: session.subscription }
          : {}),
      });
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const tenantId = await resolveTenantId(
        typeof sub.customer === "string" ? sub.customer : null,
        sub.metadata?.tenantId,
      );
      if (!tenantId) return;
      await updateTenantBilling(tenantId, {
        plan: planForStatus(sub.status),
        subscriptionStatus: sub.status,
        stripeSubscriptionId: sub.id,
      });
      return;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const tenantId = await resolveTenantId(
        typeof sub.customer === "string" ? sub.customer : null,
        sub.metadata?.tenantId,
      );
      if (!tenantId) return;
      await updateTenantBilling(tenantId, {
        plan: "free",
        subscriptionStatus: "canceled",
        stripeSubscriptionId: null,
      });
      return;
    }
    default:
      // Unhandled event types are acknowledged but ignored.
      return;
  }
}

/**
 * Registers `POST /webhooks/stripe` with a raw-body parser (required for
 * signature verification). Public + idempotent via the `stripe_events` table.
 */
export async function registerStripeWebhook(app: FastifyInstance): Promise<void> {
  await app.register(async (instance) => {
    // Stripe signature verification needs the exact raw payload.
    instance.addContentTypeParser("application/json", { parseAs: "buffer" }, (_req, body, done) =>
      done(null, body),
    );

    instance.post("/webhooks/stripe", async (request: FastifyRequest, reply: FastifyReply) => {
      const stripe = getStripeClient();
      const secret = getStripeWebhookSecret();

      if (!stripe || !secret) {
        return reply
          .status(503)
          .send(apiError("Service Unavailable", "Stripe webhook not configured."));
      }

      const signature = request.headers["stripe-signature"];
      if (typeof signature !== "string") {
        return reply.status(400).send(apiError("Bad Request", "Missing Stripe signature."));
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(request.body as Buffer, signature, secret);
      } catch {
        return reply.status(400).send(apiError("Bad Request", "Invalid Stripe signature."));
      }

      // Idempotency — record the event id; skip if we've seen it.
      const inserted = await getDb()
        .insert(stripeEvents)
        .values({ id: event.id, type: event.type })
        .onConflictDoNothing()
        .returning({ id: stripeEvents.id });

      if (inserted.length === 0) {
        return reply.status(200).send({ received: true, duplicate: true });
      }

      try {
        await handleEvent(event);
      } catch (error) {
        request.log.error({ err: error }, "Stripe webhook handler failed");
        return reply
          .status(500)
          .send(apiError("Internal Server Error", "Webhook processing failed."));
      }

      return reply.status(200).send({ received: true });
    });
  });
}
