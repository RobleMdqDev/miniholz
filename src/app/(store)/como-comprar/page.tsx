import type { Metadata } from "next";
import Link from "next/link";
import { getStoreSettings } from "@/lib/orders";
import { installmentsCount, transferDiscountPercent } from "@/lib/pricing";
import { PRODUCTION_DAYS } from "@/lib/store-facts";
import { SITE_NAME, socialMetadata } from "@/lib/site";
import { ContentPage, List, P, Section, Steps } from "@/components/content/ContentPage";

const TITLE = "Cómo comprar";
const DESCRIPTION = `Cómo es comprar en ${SITE_NAME}: los pasos, los medios de pago, los plazos de producción y cómo funciona el envío.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/como-comprar" },
  ...socialMetadata({ title: TITLE, description: DESCRIPTION, url: "/como-comprar" }),
};

export default async function ComoComprarPage() {
  const settings = await getStoreSettings();

  return (
    <ContentPage title={TITLE} lead={DESCRIPTION}>
      <Section title="Los pasos">
        <Steps
          items={[
            {
              title: "Elegí tu producto",
              detail: (
                <>
                  Entrá a la{" "}
                  <Link href="/productos" className="font-semibold text-gold-700 hover:underline">
                    tienda
                  </Link>{" "}
                  y abrí la ficha del producto. Si tiene opciones —color, medida— elegí la que
                  quieras, y si se personaliza, escribí ahí mismo el nombre a grabar.
                </>
              ),
            },
            {
              title: "Sumalo al carrito",
              detail:
                "Podés seguir agregando productos. El carrito queda guardado, así que si volvés más tarde lo vas a encontrar como lo dejaste.",
            },
            {
              title: "Completá tus datos",
              detail:
                "No hace falta crear una cuenta: se puede comprar como invitado dejando tu mail y la dirección de envío. Si preferís tener tus pedidos a mano, podés registrarte.",
            },
            {
              title: "Elegí cómo pagar",
              detail:
                "Tarjeta a través de Mercado Pago, transferencia bancaria o coordinar por WhatsApp. Abajo está el detalle de cada uno.",
            },
            {
              title: "Nosotros lo hacemos",
              detail: `Cada pieza se hace a pedido. La producción lleva entre ${PRODUCTION_DAYS} días hábiles desde que se acredita el pago.`,
            },
            {
              title: "Coordinamos el envío",
              detail:
                "Te pasamos el costo del envío antes de despachar, y cuando el paquete sale del taller te damos el seguimiento.",
            },
          ]}
        />
      </Section>

      <Section title="Medios de pago">
        <List
          items={[
            <>
              <strong className="font-semibold text-brand-900">Tarjeta o Mercado Pago.</strong> Con
              crédito, débito, dinero en cuenta o efectivo, en hasta {installmentsCount} cuotas sin
              interés según tu banco. El pago se completa dentro del sitio de Mercado Pago: los
              datos de tu tarjeta nunca pasan por acá.
            </>,
            <>
              <strong className="font-semibold text-brand-900">Transferencia bancaria.</strong> Tiene{" "}
              {transferDiscountPercent}% de descuento adicional. Al terminar la compra te mostramos
              los datos para transferir y podés subir el comprobante desde la misma página del
              pedido.
            </>,
            <>
              <strong className="font-semibold text-brand-900">WhatsApp.</strong> Registramos el
              pedido y seguimos la conversación por ahí, por si preferís coordinar todo hablando.
            </>,
          ]}
        />
      </Section>

      <Section title="Envíos">
        <P>
          Enviamos a todo el país por correo. El costo <strong>no</strong> está incluido en el total
          que ves al finalizar la compra: lo cotizamos después, según el tamaño del pedido y tu
          código postal, y te lo pasamos antes de despachar. Nunca se cobra nada sin avisarte
          primero.
        </P>
        <P>
          Lo hacemos así porque los productos son de madera y varían mucho de tamaño: una percha y
          una mesa no pagan lo mismo, y preferimos cotizar cada pedido en vez de cobrar un promedio
          que a algunos les sale caro de más.
        </P>
      </Section>

      <Section title="Personalización">
        <P>
          El grabado del nombre no tiene costo adicional. En la ficha de cada producto que se
          personaliza vas a ver el campo para escribirlo y el máximo de caracteres que entra en esa
          pieza.
        </P>
        <P>
          Revisá bien el texto antes de confirmar: como cada pieza se graba especialmente para tu
          pedido, un nombre mal escrito no se puede deshacer.
        </P>
      </Section>

      <Section title="¿Dudas antes de comprar?">
        <P>
          Escribinos y te ayudamos a elegir.{" "}
          <Link href="/contacto" className="font-semibold text-gold-700 hover:underline">
            Estos son nuestros canales
          </Link>
          {settings?.whatsappNumber ? ", incluido WhatsApp" : ""}. También podés mirar las{" "}
          <Link href="/ayuda" className="font-semibold text-gold-700 hover:underline">
            preguntas frecuentes
          </Link>
          .
        </P>
      </Section>
    </ContentPage>
  );
}
