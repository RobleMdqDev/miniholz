import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug, getProducts } from "@/lib/catalog";
import { categoryIntro } from "@/lib/category-copy";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import { SITE_NAME, metaDescription, socialMetadata } from "@/lib/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { CategoryFilters } from "@/components/product/CategoryFilters";
import { ProductGrid } from "@/components/product/ProductGrid";

/**
 * La URL propia de cada categoría.
 *
 * Antes las categorías solo existían como filtro (`/productos?categoria=x`), y
 * los buscadores tratan mal los parámetros: los indexan a desgana y los leen
 * como variantes de una misma página en vez de como cinco páginas distintas.
 * Con ruta propia, cada categoría tiene su `h1`, su texto y su metadata, que es
 * lo que se puede posicionar.
 *
 * El parámetro sigue funcionando para no romper enlaces viejos, pero canoniza
 * hacia acá (ver `/productos`).
 */

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata(
  props: PageProps<"/productos/categoria/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Categoría no encontrada", robots: { index: false } };

  const intro = categoryIntro(category.slug);
  // La descripción sale del mismo texto que ve el visitante: lo que promete el
  // resultado de búsqueda es exactamente lo que va a encontrar al entrar.
  const description = intro
    ? metaDescription(intro)
    : `${category.name} de madera hechos a mano en ${SITE_NAME}, con opción de grabado de nombre.`;
  const canonical = `/productos/categoria/${category.slug}`;

  return {
    title: category.name,
    description,
    alternates: { canonical },
    ...socialMetadata({ title: category.name, description, url: canonical }),
  };
}

export default async function CategoryPage(props: PageProps<"/productos/categoria/[slug]">) {
  const { slug } = await props.params;

  const [category, categories] = await Promise.all([getCategoryBySlug(slug), getCategories()]);
  if (!category) notFound();

  const products = await getProducts({ categorySlug: category.slug });
  const intro = categoryIntro(category.slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Tienda", path: "/productos" },
          { name: category.name, path: `/productos/categoria/${category.slug}` },
        ])}
      />

      <nav className="mb-4 text-xs text-brand-600" aria-label="Migas de pan">
        <Link href="/productos" className="hover:text-gold-700">
          Tienda
        </Link>
        {" / "}
        <span className="text-brand-900">{category.name}</span>
      </nav>

      <h1 className="mb-1 text-2xl font-extrabold text-brand-900">{category.name}</h1>
      <p className="mb-4 text-sm text-brand-600">
        {products.length === 1 ? "1 producto" : `${products.length} productos`}
      </p>

      {intro && <p className="mb-8 max-w-2xl text-sm leading-relaxed text-brand-700">{intro}</p>}

      <CategoryFilters categories={categories} activeSlug={category.slug} />

      <ProductGrid products={products} />
    </div>
  );
}
