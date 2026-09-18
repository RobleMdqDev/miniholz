import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getAdminCategories, getAdminProduct } from "@/lib/admin-queries";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductImageManager } from "@/components/admin/ProductImageManager";

export const metadata: Metadata = {
  title: "Editar producto",
};

export default async function EditProductPage(props: PageProps<"/admin/productos/[id]">) {
  const { id } = await props.params;
  const [product, categories] = await Promise.all([getAdminProduct(id), getAdminCategories()]);
  if (!product) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-brand-900">{product.name}</h1>
        <Link
          href={`/productos/${product.slug}`}
          target="_blank"
          className="flex items-center gap-1.5 text-sm font-semibold text-gold-700 hover:underline"
        >
          Ver en la tienda
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <section className="space-y-4 rounded-2xl border border-brand-200 bg-white p-5">
        <h2 className="font-bold text-brand-900">Imágenes</h2>
        <ProductImageManager productId={product.id} images={product.images} />
      </section>

      <ProductForm
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          basePrice: product.basePrice,
          compareAtPrice: product.compareAtPrice,
          isActive: product.isActive,
          categoryId: product.categoryId,
          personalizationLabel: product.personalizationLabel,
          personalizationMaxLength: product.personalizationMaxLength,
          personalizationRequired: product.personalizationRequired,
          variants: product.variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            sku: variant.sku,
            priceOverride: variant.priceOverride,
            stock: variant.stock,
            orderItemCount: variant._count.orderItems,
          })),
        }}
      />
    </div>
  );
}
