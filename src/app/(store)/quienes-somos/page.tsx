import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCTION_DAYS } from "@/lib/store-facts";
import { SITE_NAME, socialMetadata } from "@/lib/site";
import { ContentPage, P, Section, TextoProvisorio } from "@/components/content/ContentPage";

const TITLE = "Quiénes somos";
const DESCRIPTION = `${SITE_NAME} es un taller que hace mesas, sillas y accesorios de madera para el cuarto de los chicos, uno por uno y con el nombre grabado.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/quienes-somos" },
  ...socialMetadata({ title: TITLE, description: DESCRIPTION, url: "/quienes-somos" }),
};

export default function QuienesSomosPage() {
  return (
    <ContentPage title={TITLE} lead={DESCRIPTION}>
      <TextoProvisorio detalle="Escribí esta página a partir de lo que vende la tienda, pero la historia del taller, los años que llevan y quiénes están detrás son datos que solo tienen ustedes. Reemplacen el texto por el suyo antes de publicarla." />

      <Section title="Pequeñas creaciones, grandes alegrías">
        <P>
          {SITE_NAME} nació de una idea simple: que los muebles y accesorios del cuarto de un chico
          puedan ser suyos de verdad. No un objeto más que se compra hecho, sino una pieza con su
          nombre, pensada para su altura y para el uso que le va a dar.
        </P>
        <P>
          Hacemos mesas y sillas a escala infantil, percheros, baúles, organizadores y piezas de
          decoración. Todo en madera, todo de a una pieza por vez.
        </P>
      </Section>

      <Section title="Cómo trabajamos">
        <P>
          Nada se fabrica de antemano. Cuando entra un pedido, se corta, se arma, se lija a mano y
          recién al final se graba el nombre. Ese proceso lleva entre {PRODUCTION_DAYS} días
          hábiles, y es la razón por la que no encontrás dos piezas exactamente iguales.
        </P>
        <P>
          Trabajamos con madera maciza. Es un material vivo: cada tabla tiene su veta, su tono y sus
          nudos, y esas diferencias viajan con la pieza. También es la razón por la que una mesa se
          puede lijar y recuperar dentro de unos años, en vez de terminar en la basura.
        </P>
      </Section>

      <Section title="El grabado">
        <P>
          El nombre no es un adorno que agregamos al final: es el motivo por el que existe casi todo
          lo que hacemos. Un perchero con el nombre es el primer lugar de la casa que un chico
          reconoce como propio, y una mesa con su nombre deja de ser un mueble prestado.
        </P>
        <P>
          Por eso el grabado no tiene costo adicional en ninguno de nuestros productos.
        </P>
      </Section>

      <Section title="¿Te gustaría algo distinto?">
        <P>
          Si buscás una medida, un color o una pieza que no está en el catálogo, escribinos: muchas
          de las cosas que hoy vendemos empezaron siendo el pedido especial de alguien.{" "}
          <Link href="/contacto" className="font-semibold text-gold-700 hover:underline">
            Contanos qué necesitás
          </Link>{" "}
          o mirá{" "}
          <Link href="/productos" className="font-semibold text-gold-700 hover:underline">
            todo lo que hacemos
          </Link>
          .
        </P>
      </Section>
    </ContentPage>
  );
}
