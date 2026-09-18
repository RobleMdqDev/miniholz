import { formatCurrencyFromCents } from "@/lib/format";

export type WhatsAppOrderLine = {
  productName: string;
  variantName: string | null;
  personalizationText: string;
  quantity: number;
  subtotal: number;
};

export type WhatsAppOrder = {
  orderNumber: number;
  customerName: string;
  lines: WhatsAppOrderLine[];
  total: number;
};

/** Deja solo dígitos: wa.me no acepta `+`, espacios ni guiones. */
export function normalizeWhatsAppNumber(rawNumber: string): string {
  return rawNumber.replace(/\D/g, "");
}

export function buildWhatsAppOrderMessage(order: WhatsAppOrder): string {
  const lines = order.lines.map((line) => {
    const details = [line.variantName, line.personalizationText && `grabado: ${line.personalizationText}`]
      .filter(Boolean)
      .join(", ");
    return `• ${line.quantity}x ${line.productName}${details ? ` (${details})` : ""} — ${formatCurrencyFromCents(line.subtotal)}`;
  });

  return [
    `¡Hola! Quiero confirmar mi pedido #${order.orderNumber}.`,
    "",
    ...lines,
    "",
    `Total: ${formatCurrencyFromCents(order.total)}`,
    `A nombre de: ${order.customerName}`,
    "",
    "Quedo a la espera para coordinar el pago y el envío.",
  ].join("\n");
}

export function buildWhatsAppOrderLink(whatsappNumber: string, order: WhatsAppOrder): string {
  const number = normalizeWhatsAppNumber(whatsappNumber);
  const text = encodeURIComponent(buildWhatsAppOrderMessage(order));
  return `https://wa.me/${number}?text=${text}`;
}
