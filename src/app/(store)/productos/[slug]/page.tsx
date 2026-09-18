import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck, CreditCard, Percent } from "lucide-react";
import { getActiveProductSlugs, getProductBySlug } from "@/lib/catalog";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";

export async function generateStaticParams() {
  const slugs = await getActiveProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/productos/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };

  return {
    title: product.name,
    description: product.description.slice(0, 160),
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
