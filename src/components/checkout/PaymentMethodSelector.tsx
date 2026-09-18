"use client";

import { Banknote, CreditCard, MessageCircle } from "lucide-react";
import { installmentsCount, transferDiscountPercent } from "@/lib/pricing";
import type { CheckoutPaymentMethod } from "@/lib/validations/checkout";

export type { CheckoutPaymentMethod };

const METHODS = [
  {
    value: "MERCADOPAGO" as const,
    icon: CreditCard,
    title: "Tarjeta o Mercado Pago",
    description: `Pagás en el sitio de Mercado Pago con tarjeta, dinero en cuenta o efectivo. Hasta ${installmentsCount} cuotas según tu banco.`,
  },
  {
    value: "TRANSFER" as const,
    icon: Banknote,
    title: "Transferencia bancaria",
    description: `Te mostramos los datos para transferir y subís el comprobante. ${transferDiscountPercent}% de descuento.`,
  },
  {
    value: "WHATSAPP" as const,
    icon: MessageCircle,
    title: "Coordinar por WhatsApp",
    description: "Registramos el pedido y seguimos la conversación por WhatsApp.",
  },
];

export function PaymentMethodSelector({
  value,
  onChange,
  mercadoPagoEnabled,
}: {
  value: CheckoutPaymentMethod;
  onChange: (value: CheckoutPaymentMethod) => void;
  mercadoPagoEnabled: boolean;
}) {
  // Sin credenciales cargadas, ofrecer el pago con tarjeta solo lleva a un
  // error: se esconde la opción en vez de prometerla.
  const methods = mercadoPagoEnabled
    ? METHODS
    : METHODS.filter((method) => method.value !== "MERCADOPAGO");

  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-lg font-bold text-brand-900">Cómo querés pagar</legend>

      {methods.map(({ value: methodValue, icon: Icon, title, description }) => {
        const selected = value === methodValue;
        return (
          <label
            key={methodValue}
            className={
              selected
                ? "flex cursor-pointer gap-3 rounded-2xl border-2 border-gold-500 bg-gold-50 p-4"
                : "flex cursor-pointer gap-3 rounded-2xl border border-brand-200 bg-white p-4 transition hover:border-gold-300"
            }
          >
            <input
              type="radio"
              name="paymentMethod"
              value={methodValue}
              checked={selected}
              onChange={() => onChange(methodValue)}
              className="mt-1 accent-gold-600"
            />
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" aria-hidden />
            <span>
              <span className="block font-semibold text-brand-900">{title}</span>
              <span className="block text-sm text-brand-600">{description}</span>
            </span>
          </label>
        );
      })}

      {!mercadoPagoEnabled && (
        <p className="text-xs text-brand-600">
          El pago con tarjeta por Mercado Pago se habilita más adelante.
        </p>
      )}
    </fieldset>
  );
}
