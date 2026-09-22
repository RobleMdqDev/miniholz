import Link from "next/link";
import { AlertTriangle } from "lucide-react";

/**
 * El molde de las páginas de contenido (Quiénes somos, Cómo comprar, Ayuda,
 * Contacto, Cambios y devoluciones). Todas comparten migas de pan, encabezado y
 * ancho de lectura; así ninguna se va por su lado cuando se agregue la próxima.
 */
export function ContentPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-4 text-xs text-brand-600" aria-label="Migas de pan">
        <Link href="/" className="hover:text-gold-700">
          Inicio
        </Link>
        {" / "}
        <span className="text-brand-900">{title}</span>
      </nav>

      <h1 className="mb-3 text-2xl font-extrabold text-brand-900 sm:text-3xl">{title}</h1>
      {lead && <p className="mb-8 text-base leading-relaxed text-brand-600">{lead}</p>}

      <div className="space-y-8">{children}</div>
    </div>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-brand-900">{title}</h2>
      {children}
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-brand-700">{children}</p>;
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-brand-700">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export function Steps({ items }: { items: { title: string; detail: React.ReactNode }[] }) {
  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li key={item.title} className="flex gap-3">
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-700 text-sm font-bold text-white"
          >
            {index + 1}
          </span>
          <div className="space-y-1">
            <p className="font-semibold text-brand-900">{item.title}</p>
            <p className="text-sm leading-relaxed text-brand-700">{item.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * Marca un texto que todavía no revisó nadie de la marca.
 *
 * Está a la vista y no escondido en un comentario a propósito: el riesgo real
 * de una página de relleno no es que quede fea, es que se publique y alguien la
 * lea como si fuera información de la empresa. Cuando el texto esté aprobado se
 * borra esta línea de la página, que es todo lo que hay que hacer.
 */
export function TextoProvisorio({ detalle }: { detalle: string }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-gold-300 bg-gold-50 p-4 text-sm text-brand-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" aria-hidden />
      <span>
        <strong className="font-bold">Texto provisorio.</strong> {detalle}
      </span>
    </p>
  );
}
