import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck, CreditCard, Percent } from "lucide-react";
import { getActiveProductSlugs, getProductBySlug } from "@/lib/catalog";
import { metaDescription, socialMetadata } from "@/lib/site";
import { breadcrumbJsonLd, productJsonLd, type BreadcrumbStep } from "@/lib/json-ld";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";

export async function generateStaticParams() {
  const slugs = await getActiveProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/productos/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  // Un slug que no existe termina en 404: que no se indexe ni se comparta.
  if (!product) return { title: "Producto no encontrado", robots: { index: false } };

  const description = metaDescription(product.description);
  const image = product.images[0];
  const canonical = `/productos/${product.slug}`;

  return {
    title: product.name,
    description,
    alternates: { canonical },
    // La foto del producto dice mucho más que el logo al compartir el link.
    // Puede ser relativa o del Blob store: `metadataBase` resuelve la primera y
    // deja pasar la segunda.
    ...socialMetadata({ title: product.name, description, url: canonical, image }),
  };
}

export default async function ProductDetailPage(props: PageProps<"/productos/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();


  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="mb-6 text-xs text-brand-600" aria-label="Migas de pan">
        <Link href="/productos" className="hover:text-gold-700">
          Tienda
        </Link>
        {product.category && (
          <>
            {" / "}
            <Link
              href={`/productos?categoria=${product.category.slug}`}
              className="hover:text-gold-700"
            >
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div>
          <h1 className="mb-4 text-2xl font-extrabold text-brand-900 sm:text-3xl">
            {product.name}
          </h1>

          <ProductPurchasePanel product={product} />

          <div className="mt-8 space-y-2 border-t border-brand-100 pt-6 text-sm text-brand-700">
            <p className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-gold-600" aria-hidden />
              Enviamos a todo el país: coordinamos el costo con vos
            </p>
            <p className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-gold-600" aria-hidden />
              10% de descuento adicional pagando con transferencia
            </p>
            <p className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gold-600" aria-hidden />
              Hasta 3 cuotas sin interés con las principales tarjetas
            </p>
          </div>
        </div>
      </div>

      <section className="mt-12 max-w-3xl">
        <h2 className="mb-3 text-lg font-bold text-brand-900">Descripción</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-brand-700">
          {product.description}
        </p>
      </section>
    </div>
  );
}
