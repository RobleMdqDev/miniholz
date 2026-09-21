import type { MetadataRoute } from "next";
import { getCategories, getSitemapProducts } from "@/lib/catalog";
import { absoluteUrl, siteUrl } from "@/lib/site";

/**
 * `sitemap.ts` es un Route Handler que Next cachea por defecto: sin esto se
 * generaría una sola vez en el build y un producto nuevo no aparecería hasta el
 * próximo deploy. El catálogo lo edita el admin, no el repositorio, así que se
 * revalida cada hora.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [categories, products] = await Promise.all([getCategories(), getSitemapProducts()]);

  // Solo van rutas que existen. Las páginas de contenido (/quienes-somos,
  // /como-comprar, /contacto, /ayuda, /novedades y la de cambios y
  // devoluciones) todavía responden 404 y se suman acá recién cuando existan:
  // un sitemap que declara 404 es peor que no tenerlo.
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/productos`, changeFrequency: "weekly", priority: 0.9 },
  ];

  // Las categorías todavía son un parámetro (`?categoria=`) y no una ruta
  // propia. Se listan igual porque hoy es la única URL que tienen y cada una
  // muestra contenido distinto; cuando existan las rutas reales (fase 3 del
  // plan) se reemplazan acá y en la canónica del listado.
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${base}/productos?categoria=${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${base}/productos/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
    // El sitemap de imágenes exige URLs absolutas; las del catálogo pueden
    // venir relativas si se subieron a disco o vienen del seed.
    ...(product.images[0] ? { images: [absoluteUrl(product.images[0].url)] } : {}),
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
