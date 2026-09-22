import type { MetadataRoute } from "next";
import { getCategories, getSitemapProducts } from "@/lib/catalog";
import { getPublishedPostRoutes } from "@/lib/posts";
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
  const [categories, products, posts] = await Promise.all([
    getCategories(),
    getSitemapProducts(),
    getPublishedPostRoutes(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/productos`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/novedades`, changeFrequency: "weekly", priority: 0.8 },
    // Las páginas de contenido cambian poco, pero son las que explican cómo
    // comprar y qué pasa con un cambio: conviene que estén indexadas.
    { url: `${base}/quienes-somos`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/como-comprar`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/ayuda`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/cambios-y-devoluciones`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/contacto`, changeFrequency: "yearly", priority: 0.5 },
  ];

  // Solo las publicadas: `getPublishedPostRoutes` ya filtra borradores y notas
  // con fecha futura.
  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${base}/novedades/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Las rutas reales de categoría. La versión con parámetro (`?categoria=`)
  // sigue respondiendo para no romper enlaces viejos, pero no va acá: canoniza
  // hacia estas, y un sitemap que declara URLs canonizadas a otro lado manda
  // señales contradictorias.
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${base}/productos/categoria/${category.slug}`,
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

  return [...staticPages, ...categoryPages, ...productPages, ...postPages];
}
