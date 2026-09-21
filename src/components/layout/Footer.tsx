import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { SITE_EMAIL } from "@/lib/site";

const FOOTER_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Tienda Online" },
  { href: "/quienes-somos", label: "Quiénes Somos" },
  { href: "/como-comprar", label: "Cómo Comprar" },
  { href: "/cambios-y-devoluciones", label: "Política de cambios y devoluciones" },
  { href: "/contacto", label: "Contacto" },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-brand-800 text-brand-100">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3">
        <nav className="flex flex-col gap-2 text-sm">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="text-sm">
          <h3 className="mb-3 text-base font-bold">Contactános</h3>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4" aria-hidden />
            {SITE_EMAIL}
          </p>
          <p className="mt-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" aria-hidden />
            Buenos Aires, Argentina.
          </p>
        </div>

        <div className="text-sm">
          <h3 className="mb-3 text-base font-bold">Nuestras redes</h3>
          <div className="flex gap-3">
            <a
              href="#"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-300 text-xs font-bold text-brand-800"
            >
              IG
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-300 text-xs font-bold text-brand-800"
            >
              FB
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-100/20 px-4 py-4 text-center text-xs">
        <p className="mb-1 font-medium italic">Pequeñas creaciones, grandes alegrías</p>
        <p>Copyright MiniHolz - {new Date().getFullYear()}. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
