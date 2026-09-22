import Link from "next/link";

/**
 * Los chips para saltar de una categoría a otra.
 *
 * Apuntan a las rutas reales (`/productos/categoria/<slug>`) y no al parámetro
 * `?categoria=`, que es lo que hace que los enlaces internos del sitio empujen
 * todos hacia la misma URL. Una categoría que se enlaza de dos formas reparte
 * su propio peso entre las dos.
 */
export function CategoryFilters({
  categories,
  activeSlug,
}: {
  categories: { name: string; slug: string }[];
  activeSlug?: string;
}) {
  return (
    <nav className="mb-8 flex flex-wrap gap-2" aria-label="Filtrar por categoría">
      <FilterChip href="/productos" label="Todos" active={!activeSlug} />
      {categories.map((category) => (
        <FilterChip
          key={category.slug}
          href={`/productos/categoria/${category.slug}`}
          label={category.name}
          active={category.slug === activeSlug}
        />
      ))}
    </nav>
  );
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white"
          : "rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 transition hover:border-gold-400 hover:text-gold-700"
      }
    >
      {label}
    </Link>
  );
}
