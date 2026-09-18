import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { getAdminProducts } from "@/lib/admin-queries";
import { formatCurrencyFromCents } from "@/lib/format";

export const metadata: Metadata = {
  title: "Productos",
};

type AdminProduct = Awaited<ReturnType<typeof getAdminProducts>>[number];

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-brand-900">Productos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="flex items-center gap-2 rounded-full bg-gold-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gold-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo producto
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="rounded-2xl border border-brand-200 bg-white p-8 text-center text-sm text-brand-600">
          Todavía no cargaste ningún producto.
        </p>
      ) : (
        <>
          {/* Móvil: tarjetas. Una tabla de 5 columnas obliga a scrollear de costado. */}
          <ul className="space-y-3 md:hidden">
            {products.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/admin/productos/${product.id}`}
                  className="flex gap-3 rounded-2xl border border-brand-200 bg-white p-3"
                >
                  <Thumb product={product} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug text-brand-900">{product.name}</p>
                    <p className="text-xs text-brand-600">
                      {product.category?.name ?? "Sin categoría"} ·{" "}
                      {product.variantCount === 1 ? "1 opción" : `${product.variantCount} opciones`}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-bold text-brand-900">
                        {formatCurrencyFromCents(product.basePrice)}
                      </span>
                      <StockLabel total={product.totalStock} />
                      <StatusBadge isActive={product.isActive} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-2xl border border-brand-200 bg-white md:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-brand-100 text-left text-xs uppercase tracking-wide text-brand-600">
                <tr>
                  <th className="p-3 font-semibold">Producto</th>
                  <th className="p-3 font-semibold">Categoría</th>
                  <th className="p-3 font-semibold">Precio</th>
                  <th className="p-3 font-semibold">Stock</th>
                  <th className="p-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-brand-50">
                    <td className="p-3">
                      <Link
                        href={`/admin/productos/${product.id}`}
                        className="flex items-center gap-3"
                      >
                        <Thumb product={product} small />
                        <span>
                          <span className="block font-semibold text-brand-900">{product.name}</span>
                          <span className="block text-xs text-brand-600">
                            {product.variantCount === 1
                              ? "1 opción"
                              : `${product.variantCount} opciones`}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="p-3 text-brand-700">{product.category?.name ?? "—"}</td>
                    <td className="p-3 text-brand-700">
                      {formatCurrencyFromCents(product.basePrice)}
                    </td>
                    <td className="p-3">
                      <StockLabel total={product.totalStock} />
                    </td>
                    <td className="p-3">
                      <StatusBadge isActive={product.isActive} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Thumb({ product, small }: { product: AdminProduct; small?: boolean }) {
  return (
    <span
      className={`relative shrink-0 overflow-hidden rounded-lg bg-brand-50 ${
        small ? "h-11 w-11" : "h-16 w-16"
      }`}
    >
      {product.images[0] && (
        <Image
          src={product.images[0].url}
          alt={product.images[0].alt ?? product.name}
          fill
          sizes="64px"
          className="object-cover"
        />
      )}
    </span>
  );
}

function StockLabel({ total }: { total: number }) {
  return (
    <span className={total === 0 ? "font-bold text-danger-600" : "text-brand-700"}>{total} u.</span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={
        isActive
          ? "rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800"
          : "rounded-full bg-brand-200 px-2.5 py-1 text-xs font-bold text-brand-600"
      }
    >
      {isActive ? "Publicado" : "Desactivado"}
    </span>
  );
}
