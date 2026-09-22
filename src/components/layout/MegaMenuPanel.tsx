import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { ProductCardData } from "@/lib/catalog";
import { formatCurrencyFromCents } from "@/lib/format";

export type MenuPromo = {
  title: string;
  subtitle: string | null;
  href: string;
};

/**
 * El contenido del mega-menú de "Tienda Online".
 *
 * Es un componente de servidor: el envoltorio (`NavDropdown`) se ocupa solo de
 * abrir y cerrar. Por eso acá se pueden mostrar productos con imagen y precio
 * sin mandar el catálogo al navegador.
 *
 * Las categorías van en una sola columna, sin agrupar. Con cinco categorías,
 * partirlas en grupos sería inventar una jerarquía que el catálogo todavía no
 * tiene; el panel gana contenido por otro lado (accesos, promo y destacados).
 * Cuando el catálogo crezca, el lugar a tocar es `Category` con un `parentId`.
 */
export function MegaMenuPanel({
  categories,
  featured,
  promo,
}: {
  categories: { href: string; label: string }[];
  featured: ProductCardData[];
  promo: MenuPromo | null;
}) {
  return (
    <div className="mx-auto grid max-w-7xl gap-x-8 gap-y-6 px-4 lg:grid-cols-[auto_auto_1fr]">
      <Column title="Categorías">
        {categories.map((category) => (
          <PanelLink key={category.href} href={category.href}>
            {category.label}
          </PanelLink>
        ))}
      </Column>

      <Column title="Accesos">
        <PanelLink href="/productos">Ver todos los productos</PanelLink>
        <PanelLink href="/novedades">Novedades</PanelLink>
        <PanelLink href="/como-comprar">Cómo comprar</PanelLink>
        <PanelLink href="/cambios-y-devoluciones">Cambios y devoluciones</PanelLink>
        <PanelLink href="/ayuda">Ayuda</PanelLink>
      </Column>

      <div className="space-y-4">
        {promo && (
          <Link
            href={promo.href}
            className="flex items-start gap-3 rounded-2xl border border-gold-300 bg-gold-50 p-4 transition hover:border-gold-500"
          >
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold-700" aria-hidden />
            <span>
              <span className="block text-sm font-bold uppercase tracking-wide text-gold-800">
                {promo.title}
              </span>
              {promo.subtitle && (
                <span className="block text-xs text-brand-700">{promo.subtitle}</span>
              )}
            </span>
          </Link>
        )}

        {featured.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[1px] text-brand-600">
              Lo último
            </p>
            {/* Además de vender, estos enlaces le dan al buscador caminos hacia
                fichas de producto desde todas las páginas del sitio. */}
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {featured.map((product) => (
                <li key={product.id}>
                  <Link href={`/productos/${product.slug}`} className="group block">
                    <div className="relative mb-1.5 aspect-square overflow-hidden rounded-xl bg-white">
                      {product.image ? (
                        <Image
                          src={product.image.url}
                          alt={product.image.alt ?? ""}
                          fill
                          sizes="160px"
                          className="object-cover transition duration-300 group-hover:scale-[1.04]"
                        />
                      ) : null}
                    </div>
                    <p className="text-xs font-semibold leading-snug text-brand-900 group-hover:text-gold-700">
                      {product.name}
                    </p>
                    <p className="text-xs text-brand-600">
                      {formatCurrencyFromCents(product.basePrice)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-40">
      <p className="mb-3 text-xs font-bold uppercase tracking-[1px] text-brand-600">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-semibold uppercase tracking-[1px] hover:text-gold-700"
    >
      {children}
    </Link>
  );
}
