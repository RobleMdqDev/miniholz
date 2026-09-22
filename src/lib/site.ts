import type { Metadata } from "next";

/**
 * Identidad pública del sitio en un solo lugar: la URL base, el nombre, la
 * descripción y los valores de OpenGraph que comparten la metadata, el sitemap
 * y el robots.
 */

export const SITE_NAME = "MiniHolz";

export const SITE_DESCRIPTION =
  "Pequeñas creaciones, grandes alegrías: accesorios de madera y mesas infantiles personalizadas, con grabado de nombre.";

/** Lo muestra el pie y lo declara el JSON-LD de la organización: un solo lugar. */
export const SITE_EMAIL = "info@miniholz.com.ar";

/**
 * Imagen por defecto al compartir en redes. Hoy es el logo, que es cuadrado;
 * las redes prefieren 1200×630 y recortan lo que no entra. Cuando exista una
 * pieza diseñada en esa proporción se cambia acá y se arrastra a todo el sitio.
 */
export const SITE_OG_IMAGE = {
  url: "/images/logo.png",
  width: 1254,
  height: 1254,
  alt: SITE_NAME,
};

/**
 * OpenGraph y Twitter, siempre juntos y siempre completos.
 *
 * La metadata se mezcla de forma **superficial**: una página que declara
 * `openGraph` pisa el objeto entero del layout, no sus campos sueltos. Eso tiene
 * una trampa fácil de comer: declarar `openGraph` y olvidarse de `twitter` deja
 * las tarjetas de X con el nombre y el logo del sitio en vez de los del
 * producto. Armar los dos de una sola fuente es lo que lo evita.
 */
export function socialMetadata(input: {
  title: string;
  description: string;
  /** Ruta relativa; se resuelve contra `metadataBase`. */
  url?: string;
  image?: { url: string; alt?: string | null };
}): Pick<Metadata, "openGraph" | "twitter"> {
  const image = input.image
    ? { url: input.image.url, alt: input.image.alt ?? input.title }
    : SITE_OG_IMAGE;

  return {
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "es_AR",
      title: input.title,
      description: input.description,
      ...(input.url ? { url: input.url } : {}),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image.url],
    },
  };
}

/**
 * La misma variable que ya usan las vueltas de Mercado Pago. Vive acá porque
 * ahora también la necesitan el sitemap, el robots y las canónicas: dos fuentes
 * de verdad para el dominio es justo lo que rompe las URLs absolutas sin que
 * nadie se entere hasta que un validador las rechaza.
 */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Si el sitio puede aparecer en buscadores.
 *
 * **Está apagado por defecto y hay que encenderlo a propósito**, con
 * `SITE_INDEXABLE="true"` en el entorno. La asimetría es deliberada: olvidarse
 * de encenderlo se nota enseguida —el sitio no aparece en Google y alguien
 * pregunta— mientras que olvidarse de apagarlo publica en el índice páginas que
 * todavía dicen "Texto provisorio", y sacarlas después depende de que Google
 * vuelva a pasar.
 *
 * De paso deja fuera del índice a los entornos de desarrollo y a los deploys de
 * preview, que no tienen la variable.
 */
export function isIndexable(): boolean {
  return process.env.SITE_INDEXABLE === "true";
}

/**
 * Absolutiza una ruta del sitio. El sitemap necesita URLs absolutas sí o sí; la
 * metadata no, porque Next resuelve las relativas contra `metadataBase`. Las
 * imágenes del catálogo llegan relativas (disco local, seed) o absolutas (Blob
 * store), así que se contemplan las dos.
 */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl()}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/**
 * Descripción para buscadores: una sola línea, cortada en palabra. Truncar a
 * mano con `slice` parte la última palabra al medio y arrastra los saltos de
 * línea de la descripción del producto al `<meta>`.
 */
export function metaDescription(text: string, maxLength = 155): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= maxLength) return flat;

  const cut = flat.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  // Si la última palabra es larguísima no hay dónde cortar prolijo: se corta
  // igual antes que devolver una descripción de dos palabras.
  const trimmed = lastSpace > maxLength / 2 ? cut.slice(0, lastSpace) : cut;
  return `${trimmed.replace(/[\s.,;:]+$/, "")}…`;
}
