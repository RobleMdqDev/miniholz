import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

/**
 * La grilla del catálogo y su estado vacío. Vive en un componente porque la
 * comparten el listado completo (`/productos`) y cada página de categoría
 * (`/productos/categoria/[slug]`), y una grilla duplicada es una que se
 * arregla en un solo lado.
 */
export function ProductGrid({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-brand-200 bg-white p-8 text-center text-sm text-brand-600">
        Todavía no hay productos en esta categoría.{" "}
        <Link href="/productos" className="font-bold text-gold-700 hover:underline">
          Ver todos
        </Link>
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
