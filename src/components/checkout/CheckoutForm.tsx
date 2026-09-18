"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createOrder } from "@/actions/order.actions";
import { formatCurrencyFromCents } from "@/lib/format";
import { transferDiscountPercent, transferPriceCents } from "@/lib/pricing";
import { useCartStore } from "@/store/cart-store";
import { useCartLines } from "@/components/cart/useCartLines";
import { FieldError, FormError, inputClassName, labelClassName } from "@/components/ui/form";
import { PaymentMethodSelector, type CheckoutPaymentMethod } from "./PaymentMethodSelector";

type Prefill = { name: string; email: string; phone: string };

/** Página de confirmación a la que lleva cada método una vez creado el pedido. */
const CONFIRMATION_ROUTE: Record<CheckoutPaymentMethod, string> = {
  MERCADOPAGO: "mercadopago",
  TRANSFER: "transferencia",
  WHATSAPP: "whatsapp",
};

export function CheckoutForm({
  prefill,
  mercadoPagoEnabled,
}: {
  prefill: Prefill;
  mercadoPagoEnabled: boolean;
}) {
  const router = useRouter();
  const { cart, loading } = useCartLines();
  const clearCart = useCartStore((state) => state.clear);
  const items = useCartStore((state) => state.items);

  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>(
    mercadoPagoEnabled ? "MERCADOPAGO" : "TRANSFER",
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      setError(null);
      setFieldErrors({});

      const result = await createOrder(
        {
          fullName: String(formData.get("fullName") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          email: String(formData.get("email") ?? ""),
          street: String(formData.get("street") ?? ""),
          number: String(formData.get("number") ?? ""),
          city: String(formData.get("city") ?? ""),
          province: String(formData.get("province") ?? ""),
          postalCode: String(formData.get("postalCode") ?? ""),
          notes: String(formData.get("notes") ?? ""),
          paymentMethod,
        },
        items,
      );

      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      clearCart();
      router.push(`/checkout/${CONFIRMATION_ROUTE[result.paymentMethod]}/${result.orderId}`);
    });
  }

  if (loading && cart.lines.length === 0) {
    return <p className="py-10 text-sm text-brand-600">Cargando tu carrito…</p>;
  }

  if (cart.lines.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-white p-10 text-center">
        <p className="mb-4 text-brand-700">No hay productos para comprar.</p>
        <Link
          href="/productos"
          className="inline-block rounded-full bg-gold-700 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gold-800"
        >
          Ver la tienda
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
      {/* En el móvil el resumen queda al final de un formulario largo: esta
          línea muestra el total antes de empezar a completar. */}
      <div className="flex items-center justify-between rounded-2xl border border-brand-200 bg-white px-4 py-3 lg:hidden">
        <span className="text-sm text-brand-700">
          {cart.itemCount === 1 ? "1 producto" : `${cart.itemCount} productos`}
        </span>
        <span className="text-lg font-extrabold text-brand-900">
          {formatCurrencyFromCents(cart.subtotal)}
        </span>
      </div>

      <div className="space-y-6 lg:space-y-8">
        <fieldset className="space-y-4 rounded-2xl border border-brand-200 bg-white p-5">
          <legend className="text-lg font-bold text-brand-900">Datos de contacto</legend>

          <Field
            name="fullName"
            label="Nombre y apellido"
            defaultValue={prefill.name}
            autoComplete="name"
            errors={fieldErrors.fullName}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="email"
              label="Email"
              type="email"
              defaultValue={prefill.email}
              autoComplete="email"
              errors={fieldErrors.email}
            />
            <Field
              name="phone"
              label="Teléfono"
              type="tel"
              defaultValue={prefill.phone}
              autoComplete="tel"
              errors={fieldErrors.phone}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-brand-200 bg-white p-5">
          <legend className="text-lg font-bold text-brand-900">Dirección de envío</legend>

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field
              name="street"
              label="Calle"
              autoComplete="address-line1"
              errors={fieldErrors.street}
            />
            <Field name="number" label="Altura" errors={fieldErrors.number} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="city"
              label="Localidad"
              autoComplete="address-level2"
              errors={fieldErrors.city}
            />
            <Field
              name="province"
              label="Provincia"
              autoComplete="address-level1"
              errors={fieldErrors.province}
            />
          </div>
          <Field
            name="postalCode"
            label="Código postal"
            autoComplete="postal-code"
            inputMode="numeric"
            errors={fieldErrors.postalCode}
          />

          <div>
            <label htmlFor="notes" className={labelClassName}>
              Notas para el pedido <span className="font-normal text-brand-600">(opcional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className={inputClassName}
              placeholder="Entre calles, horarios de entrega, aclaraciones del grabado…"
            />
            <FieldError messages={fieldErrors.notes} />
          </div>

          <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-600">
            El costo de envío no se cobra ahora: lo cotizamos según tu dirección y lo coordinamos
            con vos antes de despachar.
          </p>
        </fieldset>

        <div className="rounded-2xl border border-brand-200 bg-white p-5">
          <PaymentMethodSelector
            value={paymentMethod}
            onChange={setPaymentMethod}
            mercadoPagoEnabled={mercadoPagoEnabled}
          />
        </div>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-brand-200 bg-white p-5">
        <h2 className="font-bold text-brand-900">Tu pedido</h2>

        <ul className="space-y-2 text-sm">
          {cart.lines.map((line) => (
            <li
              key={`${line.variantId}-${line.personalizationText}`}
              className="flex justify-between gap-3"
            >
              <span className="text-brand-700">
                {line.quantity}× {line.productName}
                {line.showVariantName && (
                  <span className="block text-xs text-brand-600">{line.variantName}</span>
                )}
                {line.personalizationText && (
                  <span className="block text-xs text-brand-600">
                    Grabado: {line.personalizationText}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-semibold text-brand-800">
                {formatCurrencyFromCents(line.subtotal)}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t border-brand-100 pt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-brand-600">Total</span>
            <span className="text-lg font-extrabold text-brand-900">
              {formatCurrencyFromCents(cart.subtotal)}
            </span>
          </div>
          {paymentMethod === "TRANSFER" && (
            <p className="text-sm font-bold text-accent-600">
              {formatCurrencyFromCents(transferPriceCents(cart.subtotal))} con transferencia (
              {transferDiscountPercent}% off)
            </p>
          )}
          <p className="mt-1 text-xs text-brand-600">Envío a coordinar, no incluido.</p>
        </div>

        <FormError message={error ?? undefined} />

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-gold-700 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gold-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? "Confirmando…"
            : paymentMethod === "MERCADOPAGO"
              ? "Continuar al pago"
              : "Confirmar pedido"}
        </button>

        <Link
          href="/carrito"
          className="block text-center text-sm font-semibold text-gold-700 hover:underline"
        >
          Volver al carrito
        </Link>
      </aside>
    </form>
  );
}

function Field({
  name,
  label,
  errors,
  ...inputProps
}: {
  name: string;
  label: string;
  errors?: string[];
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className={labelClassName}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        required
        aria-invalid={Boolean(errors?.length)}
        className={inputClassName}
        {...inputProps}
      />
      <FieldError messages={errors} />
    </div>
  );
}
