import { Truck, CreditCard, Percent, ShieldCheck } from "lucide-react";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import { getProducts } from "@/lib/catalog";

const FEATURES = [
  { icon: Truck, title: "Envíos a todo el país", description: "Coordinamos el costo con vos" },
  { icon: CreditCard, title: "Hasta 3 cuotas sin interés", description: "Con las principales tarjetas" },
  { icon: Percent, title: "10% de descuento adicional", description: "Pagando con transferencia" },
  { icon: ShieldCheck, title: "Sitio 100% seguro", description: "Tus datos siempre protegidos" },
];

export default async function HomePage() {
  const products = await getProducts({ take: 8 });

  return (
    <>
      <HeroCarousel />

      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-center gap-2 text-center">
              <Icon className="h-8 w-8 text-gold-600" aria-hidden />
              <p className="text-sm font-bold text-slate-700">{title}</p>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="text-2xl font-bold text-brand-900">Novedades</h2>
          <Link href="/productos" className="text-sm font-bold text-gold-700 hover:underline">
            Ver toda la tienda
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </>
  );
}
