import type { Metadata } from "next";
import Link from "next/link";
import { EXCHANGE_DAYS, REGRET_DAYS } from "@/lib/store-facts";
import { SITE_NAME, socialMetadata } from "@/lib/site";
import { ContentPage, List, P, Section, TextoProvisorio } from "@/components/content/ContentPage";

const TITLE = "Política de cambios y devoluciones";
const DESCRIPTION = `Cómo pedir un cambio o una devolución en ${SITE_NAME}: plazos, condiciones, qué pasa con los productos personalizados y cómo ejercer el derecho de arrepentimiento.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/cambios-y-devoluciones" },
  ...socialMetadata({ title: TITLE, description: DESCRIPTION, url: "/cambios-y-devoluciones" }),
};

export default function CambiosYDevolucionesPage() {
  return (
    <ContentPage title={TITLE} lead={DESCRIPTION}>
      <TextoProvisorio detalle="Esta página tiene efectos legales. Los plazos y condiciones de abajo son un punto de partida razonable y respetan la Ley 24.240, pero antes de publicarla conviene que la revise alguien con criterio legal y que confirmen que refleja cómo trabajan." />

      <Section title="Derecho de arrepentimiento">
        <P>
          Si comprás a distancia, la Ley 24.240 de Defensa del Consumidor te da{" "}
          <strong>{REGRET_DAYS} días corridos</strong> desde que recibís el producto para
          arrepentirte de la compra, sin tener que dar explicaciones. La devolución del importe no
          tiene costo para vos.
        </P>
        <P>
          Para ejercerlo, escribinos desde el{" "}
          <Link
            href="/contacto#arrepentimiento"
            className="font-semibold text-gold-700 hover:underline"
          >
            botón de arrepentimiento
          </Link>{" "}
          indicando el número de pedido. El producto tiene que estar sin uso y en las mismas
          condiciones en que llegó.
        </P>
        <P>
          La única excepción que contempla la ley, y que acá aplica, son los productos hechos a
          medida o personalizados: ver más abajo.
        </P>
      </Section>

      <Section title="Cambios">
        <P>
          Tenés <strong>{EXCHANGE_DAYS} días corridos</strong> desde que recibís el pedido para
          pedir un cambio, siempre que el producto esté sin uso, completo y en su empaque original.
        </P>
        <List
          items={[
            "Los cambios se hacen por otro producto del catálogo. Si el nuevo vale más, se abona la diferencia; si vale menos, se acredita a favor para una próxima compra.",
            "El costo del envío de un cambio corre por tu cuenta, salvo que el producto haya llegado fallado o que nos hayamos equivocado nosotros: en ese caso lo cubrimos íntegramente.",
          ]}
        />
      </Section>

      <Section title="Productos personalizados">
        <P>
          Las piezas con nombre grabado se fabrican especialmente para cada pedido y no se pueden
          volver a vender, así que <strong>no se cambian ni se devuelven por arrepentimiento</strong>
          . Es la excepción que la ley prevé para bienes confeccionados a medida.
        </P>
        <P>
          Esto no te deja sin respaldo: si la pieza llega fallada, se daña en el envío o el grabado
          no coincide con lo que pediste, la reponemos sin cargo. Por eso pedimos revisar bien el
          texto antes de confirmar la compra.
        </P>
      </Section>

      <Section title="Productos con fallas">
        <P>
          Si el producto llega con un defecto de fabricación o dañado por el transporte, avisanos
          dentro de las 48 horas de recibirlo y mandanos fotos. Nos hacemos cargo del envío en los
          dos sentidos y lo reponemos o te devolvemos el importe, como prefieras.
        </P>
        <P>
          La madera es un material vivo: las vetas, los tonos y los nudos cambian de pieza a pieza.
          Esas diferencias son parte de un producto hecho a mano y no se consideran fallas.
        </P>
      </Section>

      <Section title="Cómo iniciar un cambio o una devolución">
        <List
          items={[
            <>
              Escribinos por cualquiera de{" "}
              <Link href="/contacto" className="font-semibold text-gold-700 hover:underline">
                nuestros canales
              </Link>{" "}
              con el número de pedido y el motivo.
            </>,
            "Te confirmamos si corresponde y cómo enviarnos el producto.",
            "Cuando lo recibimos y verificamos su estado, coordinamos el cambio o el reintegro.",
          ]}
        />
        <P>
          Los reintegros se hacen por el mismo medio de pago con el que compraste. Si pagaste por
          transferencia, se devuelve a la cuenta desde la que se hizo el pago.
        </P>
      </Section>
    </ContentPage>
  );
}
