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
};

type PropertyFormProps = PropertyFormCreateProps | PropertyFormEditProps;

function parseNumericField(value: string): number {
  if (value.trim() === "") {
    return 0;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function PropertyForm(props: PropertyFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const isEdit = props.mode === "edit";

  const form = useForm<CreatePropertyFormValues>({
    resolver: zodResolver(createPropertyFormSchema),
    defaultValues: isEdit
      ? props.defaultValues
      : createPropertyFormDefaultValues,
  });

  function onSubmit(values: CreatePropertyFormValues) {
    startTransition(async () => {
      try {
        if (isEdit) {
          const updated = await updateProperty(
            props.propertyId,
            toUpdatePropertyPayload(values as UpdatePropertyFormValues),
          );

          await queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });

          toast.success("Imóvel atualizado com sucesso.");

          setTimeout(() => {
            router.push(`/properties/${updated.id}`);
            router.refresh();
          }, 400);

          return;
        }

        const created = await createProperty(toCreatePropertyPayload(values));

        await queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });

        toast.success("Imóvel cadastrado com sucesso.");

        setTimeout(() => {
          router.push("/properties");
          router.refresh();
        }, 400);
      } catch (error) {
        toast.error(
          getPropertyFormErrorMessage(
            error,
            isEdit
              ? "Não foi possível atualizar o imóvel. Tente novamente."
              : "Não foi possível cadastrar o imóvel. Tente novamente.",
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
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Informações básicas
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Título, tipo e finalidade do anúncio.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Casa com vista para o lago"
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
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full rounded-xl">
                        <SelectValue placeholder="Selecione o tipo" />
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
                  <FormLabel>Finalidade</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full rounded-xl">
                        <SelectValue placeholder="Venda ou aluguel" />
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
                        <SelectValue placeholder="Selecione o status" />
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
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Destaques do imóvel"
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
          <h2 className="text-lg font-semibold text-foreground">Endereço</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Localização do imóvel para listagem e busca.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Endereço</FormLabel>
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
                  <FormLabel>Complemento (opcional)</FormLabel>
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
                  <FormLabel>Cidade</FormLabel>
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
                  <FormLabel>Estado</FormLabel>
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
                  <FormLabel>CEP / ZIP</FormLabel>
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
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Detalhes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Metragem, quartos, banheiros e preço em dólares (USD).
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="sqFt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área (sq ft)</FormLabel>
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
                  <FormLabel>Preço (USD)</FormLabel>
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
                  <FormLabel>Quartos</FormLabel>
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
                  <FormLabel>Banheiros</FormLabel>
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
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            className="rounded-xl"
            disabled={isPending}
          >
            {isPending
              ? isEdit
                ? "Salvando…"
                : "Cadastrando…"
              : isEdit
                ? "Salvar alterações"
                : "Cadastrar imóvel"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={isPending}
            render={<Link href={isEdit ? `/properties/${props.propertyId}` : "/properties"} />}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
