import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { SITE_NAME, socialMetadata } from "@/lib/site";

/**
 * Antes las cinco categorías compartían título y descripción con el listado
 * completo: cinco páginas distintas compitiendo entre sí por el mismo término.
 * Cada filtro conocido tiene ahora los suyos y se canoniza a sí mismo; uno
 * inventado (`?categoria=cualquiera`) cae en el listado completo, así que un
 * parámetro al azar no inventa una URL indexable nueva.
 */
export async function generateMetadata(props: PageProps<"/productos">): Promise<Metadata> {
  const { categoria } = await props.searchParams;
  const categorySlug = typeof categoria === "string" ? categoria : undefined;
  const category = categorySlug
    ? (await getCategories()).find((item) => item.slug === categorySlug)
    : undefined;

  const title = category ? category.name : "Tienda online";
  const description = category
    ? `${category.name} de madera hechos a mano en ${SITE_NAME}, con opción de grabado de nombre. Envíos a todo el país.`
    : `Toda la tienda de ${SITE_NAME}: accesorios de madera y mesas infantiles personalizadas, con grabado de nombre. Envíos a todo el país.`;
  const canonical = category ? `/productos?categoria=${category.slug}` : "/productos";

  return {
    title,
    description,
    alternates: { canonical },
    ...socialMetadata({ title, description, url: canonical }),
  };
}

export default async function ProductsPage(props: PageProps<"/productos">) {
  const { categoria } = await props.searchParams;
  const categorySlug = typeof categoria === "string" ? categoria : undefined;

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug }),
  ]);

  const activeCategory = categories.find((category) => category.slug === categorySlug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-extrabold text-brand-900">
        {activeCategory ? activeCategory.name : "Tienda online"}
      </h1>
      <p className="mb-6 text-sm text-brand-600">
        {products.length === 1 ? "1 producto" : `${products.length} productos`}
      </p>

      <nav className="mb-8 flex flex-wrap gap-2" aria-label="Filtrar por categoría">
        <FilterChip href="/productos" label="Todos" active={!categorySlug} />
        {categories.map((category) => (
          <FilterChip
            key={category.slug}
            href={`/productos?categoria=${category.slug}`}
            label={category.name}
            active={category.slug === categorySlug}
          />
        ))}
      </nav>

      {products.length === 0 ? (
        <p className="rounded-2xl border border-brand-200 bg-white p-8 text-center text-sm text-brand-600">
          Todavía no hay productos en esta categoría.{" "}
          <Link href="/productos" className="font-bold text-gold-700 hover:underline">
            Ver todos
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
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
