import { SITE_NAME, siteUrl } from "@/lib/site";

/**
 * El molde HTML de los correos.
 *
 * Es HTML escrito a mano, con estilos en línea y una sola columna centrada. No
 * es descuido: los clientes de correo no soportan hojas de estilo externas, y
 * varios —Outlook, sobre todo— ignoran buena parte de CSS moderno. Una tabla
 * centrada con estilos en el atributo `style` es lo que se ve igual en todos.
 *
 * Cada correo se manda además en **texto plano**. No es un adorno: hay clientes
 * que muestran solo esa versión, y los filtros de spam desconfían de un mensaje
 * que solo trae HTML.
 */

const BRAND = "#6b4f2a";
const TEXT = "#3f3a34";
const MUTED = "#7a736a";
const BORDER = "#e7e1d8";
const BG = "#faf7f2";

/** Escapa lo que venga de la base: nombres de producto y textos de grabado los
 *  escribe una persona, y un `<` suelto rompe el HTML del correo. */
export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type EmailButton = { label: string; href: string };

export function renderEmail(input: {
  /** Título grande arriba del todo. */
  heading: string;
  /** Párrafos del cuerpo, ya escapados si vienen de la base. */
  body: string[];
  button?: EmailButton;
  /** Bloques extra ya renderizados (por ejemplo, el detalle del pedido). */
  blocks?: string[];
  /** Cierre en letra chica. */
  footnote?: string;
}): string {
  const base = siteUrl();

  const paragraphs = input.body
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${TEXT}">${p}</p>`,
    )
    .join("");

  const button = input.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0"><tr><td style="border-radius:999px;background:${BRAND}">
         <a href="${input.button.href}" style="display:inline-block;padding:12px 26px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none">${esc(input.button.label)}</a>
       </td></tr></table>`
    : "";

  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BORDER};border-radius:16px">
        <tr><td style="padding:26px 28px 0">
          <a href="${base}" style="font-size:18px;font-weight:bold;color:${BRAND};text-decoration:none">${SITE_NAME}</a>
        </td></tr>
        <tr><td style="padding:18px 28px 28px">
          <h1 style="margin:0 0 14px;font-size:21px;line-height:1.3;color:#2f2a24">${esc(input.heading)}</h1>
          ${paragraphs}
          ${button}
          ${(input.blocks ?? []).join("")}
          ${input.footnote ? `<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:${MUTED}">${input.footnote}</p>` : ""}
        </td></tr>
      </table>

      <p style="max-width:560px;margin:16px auto 0;font-size:12px;line-height:1.6;color:${MUTED};text-align:center">
        Este correo se envía de forma automática y no se responde desde esta casilla.<br>
        Si necesitás algo, escribinos por WhatsApp o desde
        <a href="${base}/contacto" style="color:${BRAND}">${base.replace(/^https?:\/\//, "")}/contacto</a>.
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Tabla con los ítems del pedido y los totales. */
export function renderOrderTable(input: {
  items: { productName: string; variantName: string | null; personalizationText: string; quantity: number; subtotal: string }[];
  subtotal: string;
  shippingCost: string | null;
  total: string;
}): string {
  const rows = input.items
    .map((item) => {
      const detalle = [
        item.variantName,
        item.personalizationText ? `grabado: ${item.personalizationText}` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${TEXT}">
          ${item.quantity} × ${esc(item.productName)}
          ${detalle ? `<br><span style="font-size:12px;color:${MUTED}">${esc(detalle)}</span>` : ""}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${TEXT};text-align:right;white-space:nowrap">${item.subtotal}</td>
      </tr>`;
    })
    .join("");

  const linea = (label: string, value: string, bold = false) =>
    `<tr>
      <td style="padding:6px 0;font-size:${bold ? "15" : "14"}px;color:${TEXT};${bold ? "font-weight:bold" : ""}">${label}</td>
      <td style="padding:6px 0;font-size:${bold ? "15" : "14"}px;color:${TEXT};text-align:right;${bold ? "font-weight:bold" : ""}">${value}</td>
    </tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;border-top:1px solid ${BORDER}">
    ${rows}
    ${linea("Subtotal", input.subtotal)}
    ${input.shippingCost ? linea("Envío", input.shippingCost) : `<tr><td colspan="2" style="padding:6px 0;font-size:13px;color:${MUTED}">El envío se cotiza aparte y te lo avisamos antes de despachar.</td></tr>`}
    ${linea("Total", input.total, true)}
  </table>`;
}
