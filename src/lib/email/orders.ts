import { formatCurrencyFromCents } from "@/lib/format";
import { parseShippingAddress, formatShippingAddress } from "@/lib/orders";
import { siteUrl } from "@/lib/site";
import { PRODUCTION_DAYS } from "@/lib/store-facts";
import { esc, renderEmail, renderOrderTable } from "./layout";
import { sendAdminEmail, sendEmail, type SendResult } from "./send";

/**
 * Los correos que dispara el ciclo de vida de un pedido.
 *
 * Todos reciben el pedido ya leído de la base; acá no se consulta nada. Y todos
 * devuelven sin lanzar: si el correo falla, el pedido igual se creó.
 */

export type OrderEmailData = {
  id: string;
  orderNumber: number;
  guestEmail: string | null;
  guestName: string | null;
  shippingAddress: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  user: { name: string; email: string } | null;
  items: {
    productName: string;
    variantName: string | null;
    personalizationText: string;
    quantity: number;
    subtotal: number;
  }[];
};

/** A dónde se le escribe al comprador: su cuenta si la tiene, si no el mail del checkout. */
function customerEmail(order: OrderEmailData): string {
  return order.user?.email ?? order.guestEmail ?? "";
}

function customerName(order: OrderEmailData): string {
  const full = order.user?.name ?? order.guestName ?? "";
  return full.trim().split(/\s+/)[0] || "Hola";
}

function orderUrl(order: OrderEmailData): string {
  return `${siteUrl()}/cuenta/pedidos/${order.id}`;
}

function orderTable(order: OrderEmailData): string {
  return renderOrderTable({
    items: order.items.map((item) => ({
      ...item,
      subtotal: formatCurrencyFromCents(item.subtotal),
    })),
    subtotal: formatCurrencyFromCents(order.subtotal),
    shippingCost: order.shippingCost > 0 ? formatCurrencyFromCents(order.shippingCost) : null,
    total: formatCurrencyFromCents(order.total),
  });
}

function plainOrderLines(order: OrderEmailData): string {
  return order.items
    .map((i) => `- ${i.quantity} x ${i.productName} — ${formatCurrencyFromCents(i.subtotal)}`)
    .join("\n");
}

/** 1. El comprador acaba de hacer el pedido. */
export async function sendOrderConfirmation(order: OrderEmailData): Promise<SendResult> {
  const to = customerEmail(order);
  const url = orderUrl(order);

  return sendEmail({
    to,
    subject: `Recibimos tu pedido #${order.orderNumber}`,
    idempotencyKey: `pedido-confirmado/${order.id}`,
    html: renderEmail({
      heading: `${esc(customerName(order))}, recibimos tu pedido`,
      body: [
        `Tu pedido <strong>#${order.orderNumber}</strong> quedó registrado. Cada pieza se hace a pedido, así que la producción lleva entre ${PRODUCTION_DAYS} días hábiles desde que se acredita el pago.`,
        "El costo del envío no está incluido todavía: lo cotizamos según el tamaño del pedido y tu código postal, y te lo avisamos antes de despachar.",
      ],
      button: { label: "Ver mi pedido", href: url },
      blocks: [orderTable(order)],
      // Para quien compró sin cuenta, este enlace es el único acceso al pedido.
      footnote: order.user
        ? "Podés seguir tu pedido desde Mi cuenta cuando quieras."
        : `Guardá este correo: como comprás sin cuenta, el enlace de arriba es la forma de volver a tu pedido.`,
    }),
    text: [
      `${customerName(order)}, recibimos tu pedido #${order.orderNumber}.`,
      "",
      plainOrderLines(order),
      "",
      `Total: ${formatCurrencyFromCents(order.total)}`,
      `El envío se cotiza aparte y te lo avisamos antes de despachar.`,
      "",
      `Ver tu pedido: ${url}`,
    ].join("\n"),
  });
}

/** 2. El admin cargó el costo del envío. Es el aviso que hoy no existe. */
export async function sendShippingQuoted(order: OrderEmailData): Promise<SendResult> {
  const address = parseShippingAddress(order.shippingAddress);
  const url = orderUrl(order);

  return sendEmail({
    to: customerEmail(order),
    subject: `El envío de tu pedido #${order.orderNumber}: ${formatCurrencyFromCents(order.shippingCost)}`,
    // El costo entra en la clave: si el admin lo corrige, se manda el aviso nuevo.
    idempotencyKey: `envio-cotizado/${order.id}-${order.shippingCost}`,
    html: renderEmail({
      heading: "Ya tenemos el costo de tu envío",
      body: [
        `Cotizamos el envío de tu pedido <strong>#${order.orderNumber}</strong>: <strong>${formatCurrencyFromCents(order.shippingCost)}</strong>.`,
        address
          ? `Lo enviamos a ${esc(formatShippingAddress(address))}.`
          : "Lo enviamos a la dirección que cargaste en la compra.",
      ],
      button: { label: "Ver el detalle", href: url },
      blocks: [orderTable(order)],
      footnote:
        "Si algo no cierra, escribinos por WhatsApp antes de abonar y lo revisamos juntos.",
    }),
    text: [
      `Cotizamos el envío de tu pedido #${order.orderNumber}: ${formatCurrencyFromCents(order.shippingCost)}.`,
      "",
      `Nuevo total: ${formatCurrencyFromCents(order.total)}`,
      "",
      `Ver el detalle: ${url}`,
    ].join("\n"),
  });
}

/** 3. Se acreditó el pago. */
export async function sendPaymentApproved(order: OrderEmailData): Promise<SendResult> {
  const url = orderUrl(order);

  return sendEmail({
    to: customerEmail(order),
    subject: `Recibimos el pago de tu pedido #${order.orderNumber}`,
    idempotencyKey: `pago-acreditado/${order.id}`,
    html: renderEmail({
      heading: "Tu pago está acreditado",
      body: [
        `Confirmamos el pago de <strong>${formatCurrencyFromCents(order.total)}</strong> por el pedido <strong>#${order.orderNumber}</strong>.`,
        `Ya lo pasamos a producción. Te avisamos de nuevo cuando salga del taller.`,
      ],
      button: { label: "Ver mi pedido", href: url },
    }),
    text: [
      `Recibimos el pago de ${formatCurrencyFromCents(order.total)} por el pedido #${order.orderNumber}.`,
      "Ya lo pasamos a producción.",
      "",
      `Ver tu pedido: ${url}`,
    ].join("\n"),
  });
}

/** 4. El pedido salió del taller. */
export async function sendOrderShipped(order: OrderEmailData): Promise<SendResult> {
  const address = parseShippingAddress(order.shippingAddress);
  const url = orderUrl(order);

  return sendEmail({
    to: customerEmail(order),
    subject: `Tu pedido #${order.orderNumber} está en camino`,
    idempotencyKey: `pedido-despachado/${order.id}`,
    html: renderEmail({
      heading: "Tu pedido salió del taller",
      body: [
        `El pedido <strong>#${order.orderNumber}</strong> ya está despachado.`,
        address
          ? `Va hacia ${esc(formatShippingAddress(address))}.`
          : "Va hacia la dirección que cargaste en la compra.",
        "Te pasamos el código de seguimiento por WhatsApp apenas lo tengamos.",
      ],
      button: { label: "Ver mi pedido", href: url },
    }),
    text: [
      `Tu pedido #${order.orderNumber} está en camino.`,
      "Te pasamos el seguimiento por WhatsApp apenas lo tengamos.",
      "",
      `Ver tu pedido: ${url}`,
    ].join("\n"),
  });
}

/** 5. Aviso interno: entró un pedido. */
export async function sendAdminNewOrder(order: OrderEmailData): Promise<SendResult> {
  const address = parseShippingAddress(order.shippingAddress);
  const adminUrl = `${siteUrl()}/admin/pedidos/${order.id}`;
  const comprador = order.user?.name ?? order.guestName ?? "sin nombre";
  const contacto = customerEmail(order) || "sin mail";

  return sendAdminEmail({
    subject: `Pedido #${order.orderNumber} — ${formatCurrencyFromCents(order.total)} — ${order.paymentMethod}`,
    idempotencyKey: `admin-pedido-nuevo/${order.id}`,
    html: renderEmail({
      heading: `Pedido #${order.orderNumber}`,
      body: [
        `<strong>${esc(comprador)}</strong> (${esc(contacto)}) · pago por <strong>${esc(order.paymentMethod)}</strong>.`,
        address ? esc(formatShippingAddress(address)) : "Sin dirección interpretable.",
        "Falta cotizar el envío y cargarlo en el pedido.",
      ],
      button: { label: "Abrir en el panel", href: adminUrl },
      blocks: [orderTable(order)],
    }),
    text: [
      `Pedido #${order.orderNumber} — ${formatCurrencyFromCents(order.total)} — ${order.paymentMethod}`,
      `${comprador} (${contacto})`,
      address ? formatShippingAddress(address) : "",
      "",
      plainOrderLines(order),
      "",
      `Panel: ${adminUrl}`,
    ].join("\n"),
  });
}

/** 6. Aviso interno: subieron un comprobante de transferencia para verificar. */
export async function sendAdminReceiptUploaded(input: {
  orderId: string;
  orderNumber: number;
  total: number;
  receiptUrl: string;
}): Promise<SendResult> {
  const adminUrl = `${siteUrl()}/admin/pedidos/${input.orderId}`;

  return sendAdminEmail({
    subject: `Comprobante subido — pedido #${input.orderNumber}`,
    // El comprobante se puede reemplazar: la url entra en la clave.
    idempotencyKey: `admin-comprobante/${input.orderId}-${input.receiptUrl.slice(-24)}`,
    html: renderEmail({
      heading: `Comprobante del pedido #${input.orderNumber}`,
      body: [
        `Subieron el comprobante de la transferencia por <strong>${formatCurrencyFromCents(input.total)}</strong>.`,
        "Hay que verificarlo y marcar el pedido como pagado.",
      ],
      button: { label: "Revisar en el panel", href: adminUrl },
    }),
    text: [
      `Comprobante subido para el pedido #${input.orderNumber} (${formatCurrencyFromCents(input.total)}).`,
      `Revisar: ${adminUrl}`,
    ].join("\n"),
  });
}
