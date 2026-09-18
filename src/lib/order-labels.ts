import type {
  OrderEventType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/enums";

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

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendiente",
  IN_PROCESS: "En proceso",
  APPROVED: "Acreditado",
  REJECTED: "Rechazado",
  REFUNDED: "Devuelto",
};

/** Qué provocó el asiento, en la bitácora de `/admin/pedidos/[id]`. */
export const ORDER_EVENT_TYPE_LABELS: Record<OrderEventType, string> = {
  CREATED: "Pedido creado",
  PAYMENT_SYNCED: "Pago sincronizado",
  STATUS_CHANGED: "Estado cambiado",
  CANCELLED_WITH_RESTOCK: "Cancelado con reposición de stock",
  SHIPPING_COST_SET: "Costo de envío",
};

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

// La bitácora necesita la hora: dos cambios del mismo día se leen al revés sin
// ella, y el orden es justo lo que se va a mirar cuando haya un reclamo.
const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatOrderDateTime(date: Date): string {
  return dateTimeFormatter.format(date);
}
