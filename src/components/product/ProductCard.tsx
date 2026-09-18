import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { discountPercent } from "@/lib/pricing";
import { PriceDisplay } from "./PriceDisplay";

export function ProductCard({ product }: { product: ProductCardData }) {
  const discount = discountPercent(product.basePrice, product.compareAtPrice);

  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-brand-100 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-square bg-brand-50">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : null}

        {discount && (
          <span className="absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-gold-700 text-center text-xs font-bold leading-tight text-white">
            {discount}%
            <br />
            OFF
          </span>
        )}

        {!product.inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-brand-900/80 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-white">
            Sin stock
          </span>
        )}
      </div>

      <div className="space-y-2 p-4">
        {product.categoryName && (
          <p className="text-xs uppercase tracking-wide text-brand-600">{product.categoryName}</p>
        )}
        <h3 className="font-semibold text-brand-900 group-hover:text-gold-700">{product.name}</h3>
        <PriceDisplay
          basePriceCents={product.basePrice}
          compareAtPriceCents={product.compareAtPrice}
        />
      </div>
    </Link>
  );
}
