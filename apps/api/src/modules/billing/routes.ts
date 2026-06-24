import { getDb, tenantSettings } from "@propai/db";
import { TenantContextRequiredError } from "@propai/db";
import { billingStatusSchema, checkoutResponseSchema, portalResponseSchema } from "@propai/shared";
import { eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { apiError } from "../../lib/api-error.js";
import {
  getBillingReturnBaseUrl,
  getStripeClient,
  getStripeProPriceId,
} from "../../lib/stripe-client.js";
import { createRequirePermissionHook } from "../../plugins/require-member-role.js";
import { getBillingStatus, getTenantBilling, getUserEmail } from "./queries/billing-status.js";

function requireTenantId(request: FastifyRequest): string {
  if (!request.tenantId) {
    throw new TenantContextRequiredError();
  }
  return request.tenantId;
}

export async function registerBillingRoutes(app: FastifyInstance): Promise<void> {
  const zodApp = app.withTypeProvider<ZodTypeProvider>();
  const requireBilling = createRequirePermissionHook("billing:manage");

  zodApp.get(
    "/billing",
    {
      schema: { response: { 200: billingStatusSchema } },
      preHandler: requireBilling,
    },
    async (request, reply: FastifyReply) => {
      const status = await getBillingStatus(requireTenantId(request));
      return reply.status(200).send(status);
    },
  );

  zodApp.post(
    "/billing/checkout",
    {
      schema: { response: { 200: checkoutResponseSchema } },
      preHandler: requireBilling,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const stripe = getStripeClient();
      const priceId = getStripeProPriceId();

      if (!stripe || !priceId) {
        return reply
          .status(503)
          .send(
            apiError(
              "Service Unavailable",
              "Billing is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID.",
            ),
          );
      }

      const billing = await getTenantBilling(tenantId);
      const baseUrl = getBillingReturnBaseUrl();
      const userId = request.session?.user.id;
      const email = userId ? await getUserEmail(userId) : undefined;

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: tenantId,
        ...(billing.stripeCustomerId
          ? { customer: billing.stripeCustomerId }
          : email
            ? { customer_email: email }
            : {}),
        subscription_data: { metadata: { tenantId } },
        success_url: `${baseUrl}/settings/billing?status=success`,
        cancel_url: `${baseUrl}/settings/billing?status=cancelled`,
      });

      if (!session.url) {
        return reply
          .status(502)
          .send(apiError("Bad Gateway", "Stripe did not return a checkout URL."));
      }

      return reply.status(200).send({ url: session.url });
    },
  );

  zodApp.post(
    "/billing/portal",
    {
      schema: { response: { 200: portalResponseSchema } },
      preHandler: requireBilling,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const stripe = getStripeClient();

      if (!stripe) {
        return reply
          .status(503)
          .send(apiError("Service Unavailable", "Billing is not configured."));
      }

      const billing = await getTenantBilling(tenantId);
      let customerId = billing.stripeCustomerId;

      // Lazily create a Stripe customer so the portal is reachable even before
      // the first checkout completes.
      if (!customerId) {
        const userId = request.session?.user.id;
        const email = userId ? await getUserEmail(userId) : undefined;
        const customer = await stripe.customers.create({
          email,
          metadata: { tenantId },
        });
        await getDb()
          .update(tenantSettings)
          .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
          .where(eq(tenantSettings.organizationId, tenantId));
        customerId = customer.id;
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${getBillingReturnBaseUrl()}/settings/billing`,
      });

      return reply.status(200).send({ url: session.url });
    },
  );
}
