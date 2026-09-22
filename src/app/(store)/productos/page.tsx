import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getProducts } from "@/lib/catalog";
import { SITE_NAME, socialMetadata } from "@/lib/site";
import { CategoryFilters } from "@/components/product/CategoryFilters";
import { ProductGrid } from "@/components/product/ProductGrid";

/**
 * El listado completo, y de paso el destino de los enlaces viejos con
 * `?categoria=`.
 *
 * Ese parámetro ya no lo usa ningún enlace interno —todos apuntan a
 * `/productos/categoria/<slug>`—, pero sigue filtrando para no romper lo que
 * quedó afuera: URLs compartidas, favoritos y lo que los buscadores ya
 * indexaron. Lo que sí cambia es la canónica: apunta a la ruta limpia, así el
 * peso se consolida ahí y las dos URLs dejan de competir.
 */
export async function generateMetadata(props: PageProps<"/productos">): Promise<Metadata> {
  const { categoria } = await props.searchParams;
  const categorySlug = typeof categoria === "string" ? categoria : undefined;
  const category = categorySlug
    ? (await getCategories()).find((item) => item.slug === categorySlug)
    : undefined;

  // Un filtro que no existe (`?categoria=cualquiera`) se comporta como el
  // listado completo, así que un parámetro inventado no genera una URL nueva.
  if (!category) {
    const description = `Toda la tienda de ${SITE_NAME}: accesorios de madera y mesas infantiles personalizadas, con grabado de nombre. Envíos a todo el país.`;
    return {
      title: "Tienda online",
      description,
      alternates: { canonical: "/productos" },
      ...socialMetadata({ title: "Tienda online", description, url: "/productos" }),
    };
  }

  // Con categoría, la página es un duplicado de la ruta real: se canoniza allá
  // y no se declara nada más. El marcado de migas de pan y la metadata social
  // propios viven en la ruta limpia, que es la que se quiere posicionar.
  return {
    title: category.name,
    alternates: { canonical: `/productos/categoria/${category.slug}` },
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
      {activeCategory && (
        <nav className="mb-4 text-xs text-brand-600" aria-label="Migas de pan">
          <Link href="/productos" className="hover:text-gold-700">
            Tienda
          </Link>
          {" / "}
          <span className="text-brand-900">{activeCategory.name}</span>
        </nav>
      )}

      <h1 className="mb-1 text-2xl font-extrabold text-brand-900">
        {activeCategory ? activeCategory.name : "Tienda online"}
      </h1>
      <p className="mb-6 text-sm text-brand-600">
        {products.length === 1 ? "1 producto" : `${products.length} productos`}
      </p>

      <CategoryFilters categories={categories} activeSlug={activeCategory?.slug} />

      <ProductGrid products={products} />
    </div>
  );
}
