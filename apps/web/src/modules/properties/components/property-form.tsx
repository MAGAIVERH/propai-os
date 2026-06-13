"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  RENT_OR_SALE_VALUES,
} from "@propai/shared";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EstimatePriceWidget } from "@/modules/properties/components/estimate-price-widget";
import { PROPERTIES_QUERY_KEY } from "@/modules/properties/hooks/use-properties";
import {
  getPropertyStatusLabel,
  getPropertyTypeLabel,
  getRentOrSaleLabel,
} from "@/modules/properties/lib/format-property";
import { getPropertyFormErrorMessage } from "@/modules/properties/lib/property-form-error";
import { createProperty } from "@/modules/properties/queries/create-property";
import { updateProperty } from "@/modules/properties/queries/update-property";
import {
  createPropertyFormDefaultValues,
  createPropertyFormSchema,
  toCreatePropertyPayload,
  type CreatePropertyFormValues,
} from "@/modules/properties/schemas/create-property";
import {
  toUpdatePropertyPayload,
  type UpdatePropertyFormValues,
} from "@/modules/properties/schemas/update-property";

type PropertyFormCreateProps = {
  mode: "create";
};

type PropertyFormEditProps = {
  mode: "edit";
  propertyId: string;
  defaultValues: CreatePropertyFormValues;
  aiPrefill?: Partial<CreatePropertyFormValues>;
};

type PropertyFormProps = PropertyFormCreateProps | PropertyFormEditProps;

const AI_DISCLAIMER =
  "AI-generated content — please review before publishing.";

function mergeFormValues(
  base: CreatePropertyFormValues,
  patch?: Partial<CreatePropertyFormValues>,
): CreatePropertyFormValues {
  if (!patch) {
    return base;
  }

  return { ...base, ...patch };
}

function parseNumericField(value: string): number {
  if (value.trim() === "") {
    return 0;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function parseOptionalNumericField(value: string): number | undefined {
  if (value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

export function PropertyForm(props: PropertyFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const isEdit = props.mode === "edit";
  const aiPrefill = isEdit ? props.aiPrefill : undefined;
  const hasAiPrefill = Boolean(aiPrefill && Object.keys(aiPrefill).length > 0);

  const form = useForm<CreatePropertyFormValues>({
    resolver: zodResolver(createPropertyFormSchema),
    defaultValues: isEdit
      ? mergeFormValues(props.defaultValues, aiPrefill)
      : createPropertyFormDefaultValues,
  });

  const [watchedCity, watchedState, watchedType, watchedBedrooms, watchedSqFt, watchedRentOrSale] =
    form.watch(["city", "state", "type", "bedrooms", "sqFt", "rentOrSale"]);

  const canEstimatePrice =
    Boolean(watchedCity?.trim()) &&
    Boolean(watchedState?.trim()) &&
    watchedSqFt > 0;

  function onSubmit(values: CreatePropertyFormValues) {
    startTransition(async () => {
      try {
        if (isEdit) {
          const updated = await updateProperty(
            props.propertyId,
            toUpdatePropertyPayload(values as UpdatePropertyFormValues),
          );

          await queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });

          toast.success("Property updated successfully.");

          setTimeout(() => {
            router.push(`/properties/${updated.id}`);
            router.refresh();
          }, 400);

          return;
        }

        const created = await createProperty(toCreatePropertyPayload(values));

        await queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });

        toast.success("Property created successfully.");

        setTimeout(() => {
          router.push(`/properties/${created.id}`);
          router.refresh();
        }, 400);
      } catch (error) {
        toast.error(
          getPropertyFormErrorMessage(
            error,
            isEdit
              ? "Unable to update the property. Please try again."
              : "Unable to create the property. Please try again.",
          ),
        );
      }
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        {hasAiPrefill ? (
          <Alert className="rounded-xl border-primary/30 bg-primary/5">
            <AlertTitle className="text-foreground">
              AI-suggested fields applied
            </AlertTitle>
            <AlertDescription>{AI_DISCLAIMER}</AlertDescription>
          </Alert>
        ) : null}

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Basic information
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Title, type, and listing purpose.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Lakeview ranch home"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full rounded-xl">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROPERTY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getPropertyTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rentOrSale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full rounded-xl">
                        <SelectValue placeholder="Sale or rent" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RENT_OR_SALE_VALUES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {getRentOrSaleLabel(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full rounded-xl">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROPERTY_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {getPropertyStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Property highlights"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Address</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Property location for search and map display.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Street address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123 Main St"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Unit / suite (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Apt 4B"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Austin"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="TX"
                      maxLength={2}
                      className="rounded-xl uppercase"
                      {...field}
                      onChange={(event) => {
                        field.onChange(event.target.value.toUpperCase());
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="78701"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      placeholder="30.2672"
                      className="rounded-xl"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value ?? ""}
                      onChange={(event) => {
                        field.onChange(
                          parseOptionalNumericField(event.target.value),
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      placeholder="-97.7431"
                      className="rounded-xl"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value ?? ""}
                      onChange={(event) => {
                        field.onChange(
                          parseOptionalNumericField(event.target.value),
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Square footage, beds, baths, and price in US dollars.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="sqFt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Square feet</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      placeholder="1800"
                      className="rounded-xl"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value === 0 ? "" : field.value}
                      onChange={(event) => {
                        field.onChange(parseNumericField(event.target.value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priceUsd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      step="0.01"
                      inputMode="decimal"
                      placeholder="450000"
                      className="rounded-xl"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value === 0 ? "" : field.value}
                      onChange={(event) => {
                        field.onChange(parseNumericField(event.target.value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bedrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bedrooms</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      className="rounded-xl"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value}
                      onChange={(event) => {
                        field.onChange(parseNumericField(event.target.value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bathrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bathrooms</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="2.5"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <EstimatePriceWidget
            params={{
              city: watchedCity ?? "",
              state: watchedState ?? "",
              type: watchedType,
              bedrooms: watchedBedrooms ?? 0,
              sqFt: watchedSqFt ?? 0,
              rentOrSale: watchedRentOrSale,
              excludePropertyId: isEdit ? props.propertyId : undefined,
            }}
            canEstimate={canEstimatePrice}
            onApplyPrice={(usd) => form.setValue("priceUsd", usd)}
          />
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            className="rounded-xl"
            disabled={isPending}
          >
            {isPending
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save changes"
                : "Create property"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={isPending}
            render={<Link href={isEdit ? `/properties/${props.propertyId}` : "/properties"} />}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
