import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { canViewOrder, getOrderById, getStoreSettings, parseShippingAddress } from "@/lib/orders";
import { buildWhatsAppOrderLink } from "@/lib/whatsapp";
import { OrderSummaryCard } from "@/components/checkout/OrderSummaryCard";

export const metadata: Metadata = {
  title: "Coordinar por WhatsApp",
};

export default async function WhatsAppCheckoutPage(
  props: PageProps<"/checkout/whatsapp/[orderId]">,
) {
  const { orderId } = await props.params;
  const [order, settings, session] = await Promise.all([
    getOrderById(orderId),
    getStoreSettings(),
    auth(),
  ]);

  if (!order) notFound();
  if (!canViewOrder(order, session?.user ?? null)) notFound();

  const address = parseShippingAddress(order.shippingAddress);
  const whatsappLink = settings?.whatsappNumber
    ? buildWhatsAppOrderLink(settings.whatsappNumber, {
        orderNumber: order.orderNumber,
        customerName: address?.fullName ?? order.guestName ?? order.user?.name ?? "",
        total: order.total,
        lines: order.items.map((item) => ({
          productName: item.productName,
          variantName: item.variantName,
          personalizationText: item.personalizationText,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
      })
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gold-700">
        <CheckCircle2 className="h-5 w-5" aria-hidden />
        Pedido #{order.orderNumber} registrado
      </p>
      <h1 className="mb-1 text-2xl font-extrabold text-brand-900">Coordinemos por WhatsApp</h1>
      <p className="mb-8 text-sm text-brand-600">
        Tu pedido ya quedó guardado. Abrí el chat para confirmarlo: el mensaje va armado con el
        detalle, solo tenés que enviarlo.
      </p>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-brand-200 bg-white p-5">
            {whatsappLink ? (
              <>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-700 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gold-800"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  Abrir WhatsApp
                </a>
                <p className="mt-3 text-xs text-brand-600">
                  Si no se abre solo, escribinos al {settings?.whatsappNumber} mencionando el
                  pedido #{order.orderNumber}.
                </p>
              </>
            ) : (
              <p className="rounded-xl bg-danger-50 p-4 text-sm text-danger-700">
                Todavía no cargamos el número de WhatsApp de la tienda. Tu pedido #
                {order.orderNumber} quedó registrado igual y nos vamos a contactar.
              </p>
            )}
          </section>

          <p className="text-sm text-brand-600">
            {order.userId ? (
              <>
                Podés volver a este pedido desde{" "}
                <Link href="/cuenta/pedidos" className="font-bold text-gold-700 hover:underline">
                  Mis pedidos
                </Link>
                .
              </>
            ) : (
              <>Guardá este link: como comprás sin cuenta, es la única forma de volver al pedido.</>
            )}
          </p>
        </div>

        <aside>
          <h2 className="mb-3 font-bold text-brand-900">Tu pedido</h2>
          <OrderSummaryCard order={order} />
        </aside>
      </div>
    </div>
  );
}
