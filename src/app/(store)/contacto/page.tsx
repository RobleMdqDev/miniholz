import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { getStoreSettings } from "@/lib/orders";
import { REGRET_DAYS } from "@/lib/store-facts";
import { SITE_EMAIL, SITE_NAME, socialMetadata } from "@/lib/site";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContentPage, P, Section, TextoProvisorio } from "@/components/content/ContentPage";

const TITLE = "Contacto";
const DESCRIPTION = `Escribinos a ${SITE_NAME} por WhatsApp o por mail: consultas, estado de pedidos y pedidos especiales.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/contacto" },
  ...socialMetadata({ title: TITLE, description: DESCRIPTION, url: "/contacto" }),
};

export default async function ContactoPage() {
  const settings = await getStoreSettings();
  const whatsappNumber = settings?.whatsappNumber ?? "";

  return (
    <ContentPage title={TITLE} lead={DESCRIPTION}>
      <TextoProvisorio detalle="Faltan los horarios de atención y los enlaces a las redes, que hoy apuntan a “#” en el pie. Completalos y borrá este aviso." />

      <Section title="Cómo encontrarnos">
        <ul className="space-y-3 text-sm text-brand-700">
          {whatsappNumber && (
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0 text-gold-600" aria-hidden />
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gold-700 hover:underline"
              >
                WhatsApp
              </a>
              <span className="text-brand-600">— la vía más rápida</span>
            </li>
          )}
          <li className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-gold-600" aria-hidden />
            <a href={`mailto:${SITE_EMAIL}`} className="font-semibold text-gold-700 hover:underline">
              {SITE_EMAIL}
            </a>
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-gold-600" aria-hidden />
            Buenos Aires, Argentina
          </li>
        </ul>
        <P>
          Si tu consulta es sobre un pedido que ya hiciste, tené a mano el número: está en el mail
          de confirmación y en{" "}
          <Link href="/cuenta/pedidos" className="font-semibold text-gold-700 hover:underline">
            Mis pedidos
          </Link>
          .
        </P>
      </Section>

      {whatsappNumber && (
        <Section title="Escribinos">
          <ContactForm whatsappNumber={whatsappNumber} />
        </Section>
      )}

      {/* El ancla la usa el enlace del pie y el de la política de cambios: la ley
          pide que el botón de arrepentimiento sea fácil de encontrar. */}
      <section id="arrepentimiento" className="scroll-mt-24 space-y-3">
        <h2 className="text-lg font-bold text-brand-900">Botón de arrepentimiento</h2>
        <P>
          Si comprás a distancia tenés {REGRET_DAYS} días corridos desde que recibís el producto
          para arrepentirte de la compra, sin costo y sin tener que dar explicaciones (Ley 24.240).
          Los productos personalizados quedan fuera: el detalle está en la{" "}
          <Link
            href="/cambios-y-devoluciones"
            className="font-semibold text-gold-700 hover:underline"
          >
            política de cambios y devoluciones
          </Link>
          .
        </P>
        <P>
          Para ejercerlo, escribinos por cualquiera de los canales de arriba —eligiendo{" "}
          <strong>Arrepentimiento de compra</strong> en el formulario— con tu número de pedido.
          Damos de baja la operación y te devolvemos el importe por el mismo medio de pago.
        </P>
      </section>
    </ContentPage>
  );
}
