import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { PaymentStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { canViewOrder, getOrderById } from "@/lib/orders";
import { syncMercadoPagoPayment } from "@/lib/mercadopago-orders";
import { formatCurrencyFromCents } from "@/lib/format";
import { OrderSummaryCard } from "./OrderSummaryCard";

/**
 * Pantalla a la que vuelve el comprador desde Mercado Pago.
 *
 * Los parámetros de la URL los controla el navegador, así que no se usan como
 * verdad: solo sirven para saber qué pago consultar. El estado que se muestra
 * sale de `syncMercadoPagoPayment`, que lo pregunta a la API de MP.
 *
 * Sincronizar acá además es lo que hace probable el flujo en desarrollo: MP no
 * puede llamar a `localhost`, así que el webhook nunca llega y este es el único
 * momento en que el pedido se entera del resultado.
 */

export type ReturnOutcome = "success" | "pending" | "failure";

type SearchParams = Record<string, string | string[] | undefined>;

const OUTCOME_FALLBACK: Record<ReturnOutcome, ResultKind> = {
  success: "approved",
  pending: "pending",
  failure: "rejected",
};

type ResultKind = "approved" | "pending" | "rejected";

const COPY: Record<ResultKind, { title: string; description: string }> = {
  approved: {
    title: "¡Listo! Tu pago fue aprobado",
    description:
      "Ya estamos preparando tu pedido. Te escribimos para coordinar el envío y su costo.",
  },
  pending: {
    title: "Tu pago está pendiente",
    description:
      "Mercado Pago todavía no lo acreditó. Si pagaste con efectivo o cupón, puede tardar hasta 3 días hábiles; te avisamos apenas se confirme.",
  },
  rejected: {
    title: "No pudimos procesar tu pago",
    description:
      "Mercado Pago rechazó la operación. Podés intentarlo de nuevo con otro medio de pago: tu pedido sigue guardado.",
  },
};

const ICONS: Record<ResultKind, typeof CheckCircle2> = {
  approved: CheckCircle2,
  pending: Clock,
  rejected: XCircle,
};

const ICON_STYLES: Record<ResultKind, string> = {
  approved: "text-accent-600",
  pending: "text-gold-700",
  rejected: "text-danger-600",
};

export async function MercadoPagoReturn({
  outcome,
  searchParams,
}: {
  outcome: ReturnOutcome;
  searchParams: SearchParams;
}) {
  // `collection_id` es el nombre viejo del mismo dato; MP manda uno u otro
  // según el flujo desde el que vuelva el comprador.
  const paymentId = first(searchParams.payment_id) ?? first(searchParams.collection_id);
  const externalReference = first(searchParams.external_reference);

  let kind: ResultKind = OUTCOME_FALLBACK[outcome];
  let orderId = externalReference ?? null;

  if (paymentId && paymentId !== "null") {
    try {
      const synced = await syncMercadoPagoPayment(paymentId);
      if (synced.ok) {
        orderId = synced.orderId;
        kind = resultKindFor(synced.paymentStatus);
      }
    } catch (error) {
      // Si MP no responde, se muestra lo que dice la URL de retorno y el
      // webhook termina de acomodar el pedido cuando llegue.
      console.error("[mercadopago] no se pudo consultar el pago al volver del checkout", error);
    }
  }

  const order = orderId ? await getOrderById(orderId) : null;
  const session = await auth();
  const visibleOrder = order && canViewOrder(order, session?.user ?? null) ? order : null;

  const Icon = ICONS[kind];
  const { title, description } = COPY[kind];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className={`mb-2 flex items-center gap-2 text-sm font-semibold ${ICON_STYLES[kind]}`}>
        <Icon className="h-5 w-5" aria-hidden />
        {visibleOrder ? `Pedido #${visibleOrder.orderNumber}` : "Pago con Mercado Pago"}
      </p>
      <h1 className="mb-1 text-2xl font-extrabold text-brand-900">{title}</h1>
      <p className="mb-8 text-sm text-brand-600">{description}</p>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="space-y-3 rounded-2xl border border-brand-200 bg-white p-5">
            {visibleOrder ? (
              <>
                <p className="text-sm text-brand-600">Total del pedido</p>
                <p className="text-2xl font-extrabold text-brand-900">
                  {formatCurrencyFromCents(visibleOrder.total)}
                </p>

                {kind === "rejected" && (
                  <Link
                    href={`/checkout/mercadopago/${visibleOrder.id}`}
                    className="inline-block rounded-full bg-gold-700 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gold-800"
                  >
                    Reintentar el pago
                  </Link>
                )}

                <p className="text-sm text-brand-600">
                  {visibleOrder.userId ? (
                    <>
                      Seguí el estado desde{" "}
                      <Link
                        href="/cuenta/pedidos"
                        className="font-bold text-gold-700 hover:underline"
                      >
                        Mis pedidos
                      </Link>
                      .
                    </>
                  ) : (
                    <>
                      Guardá este link: como comprás sin cuenta, es la única forma de volver al
                      pedido.
                    </>
                  )}
                </p>
              </>
            ) : (
              <p className="text-sm text-brand-600">
                No encontramos el pedido asociado a este pago. Si te cobraron, escribinos con el
                comprobante de Mercado Pago y lo resolvemos.
              </p>
            )}
          </section>

          <Link
            href="/productos"
            className="inline-block text-sm font-bold text-gold-700 hover:underline"
          >
            Seguir comprando
          </Link>
        </div>

        {visibleOrder && (
          <aside>
            <h2 className="mb-3 font-bold text-brand-900">Tu pedido</h2>
            <OrderSummaryCard order={visibleOrder} />
          </aside>
        )}
      </div>
    </div>
  );
}

function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function resultKindFor(status: PaymentStatus): ResultKind {
  switch (status) {
    case "APPROVED":
      return "approved";
    case "REJECTED":
    case "REFUNDED":
      return "rejected";
    default:
      return "pending";
  }
}
