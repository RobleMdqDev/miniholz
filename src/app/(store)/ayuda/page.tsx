import type { Metadata } from "next";
import Link from "next/link";
import { FAQ_ENTRIES } from "@/lib/faq";
import { faqPageJsonLd } from "@/lib/json-ld";
import { SITE_NAME, socialMetadata } from "@/lib/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { ContentPage, P, Section } from "@/components/content/ContentPage";

const TITLE = "Ayuda";
const DESCRIPTION = `Preguntas frecuentes de ${SITE_NAME}: medios de pago, plazos, envíos, personalización y seguimiento del pedido.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/ayuda" },
  ...socialMetadata({ title: TITLE, description: DESCRIPTION, url: "/ayuda" }),
};

export default function AyudaPage() {
  return (
    <ContentPage title={TITLE} lead={DESCRIPTION}>
      {/* Las mismas preguntas que se ven abajo: si se escribieran dos veces,
          Google leería una versión y el visitante otra. */}
      <JsonLd data={faqPageJsonLd(FAQ_ENTRIES)} />

      <Section title="Preguntas frecuentes">
        <dl className="divide-y divide-brand-100 border-y border-brand-100">
          {FAQ_ENTRIES.map((entry) => (
            <div key={entry.question} className="py-4">
              <dt className="mb-1.5 font-semibold text-brand-900">{entry.question}</dt>
              <dd className="text-sm leading-relaxed text-brand-700">{entry.answer}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="¿No encontraste lo que buscabas?">
        <P>
          Escribinos y te respondemos.{" "}
          <Link href="/contacto" className="font-semibold text-gold-700 hover:underline">
            Estos son nuestros canales de contacto
          </Link>
          . Si tu duda es sobre un cambio o una devolución, está todo en la{" "}
          <Link
            href="/cambios-y-devoluciones"
            className="font-semibold text-gold-700 hover:underline"
          >
            política de cambios y devoluciones
          </Link>
          .
        </P>
      </Section>
    </ContentPage>
  );
}
