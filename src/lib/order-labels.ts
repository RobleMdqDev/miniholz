import type { OrderStatus, PaymentMethod } from "@/generated/prisma/enums";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pendiente de pago",
  PAID: "Pago acreditado",
  PROCESSING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

/** Clases del badge por estado, en la paleta de la tienda. */
export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-gold-100 text-gold-800",
  PAID: "bg-brand-100 text-brand-800",
  PROCESSING: "bg-brand-100 text-brand-800",
  SHIPPED: "bg-accent-100 text-accent-700",
  DELIVERED: "bg-accent-100 text-accent-700",
  CANCELLED: "bg-brand-200 text-brand-600",
};

/**
 * Estados que el admin puede elegir a mano. `CANCELLED` queda afuera a propósito:
 * cancelar además repone stock, así que va por su propia acción.
 */
export const MANUAL_ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
] as const;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  MERCADOPAGO: "Mercado Pago",
  TRANSFER: "Transferencia bancaria",
  WHATSAPP: "Coordinado por WhatsApp",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatOrderDate(date: Date): string {
  return dateFormatter.format(date);
}
