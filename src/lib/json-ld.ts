import type { ProductDetail } from "@/lib/catalog";
import { centsToPesos, variantPriceCents } from "@/lib/pricing";
import {
  SITE_DESCRIPTION,
  SITE_EMAIL,
  SITE_NAME,
  SITE_OG_IMAGE,
  absoluteUrl,
  siteUrl,
} from "@/lib/site";

/**
 * Los objetos JSON-LD que describen el sitio y el catálogo para los buscadores.
 *
 * Dos reglas sostienen este archivo, y conviene no aflojarlas:
 *
 * 1. **Solo se declara lo que es cierto.** Un dato inventado acá no es un
 *    detalle cosmético: Google penaliza el marcado que no coincide con la
 *    página, y puede dejar de mostrar los resultados enriquecidos del sitio
 *    entero. Por eso no hay calificaciones, ni reseñas, ni una fecha de validez
 *    de precio puesta a dedo.
 * 2. **Lo declarado tiene que coincidir con lo visible.** Las migas de pan del
 *    marcado son las mismas que ve el usuario, no una versión mejorada.
 */

/** `@id` estables, para que un objeto pueda referenciar a otro sin repetirlo. */
function organizationId(): string {
  return `${siteUrl()}/#organization`;
}

/**
 * `Organization` y no `LocalBusiness`: no hay dirección física ni horario de
 * atención al público, y `LocalBusiness` sin dirección es marcado inválido.
 * Si algún día hay local o punto de retiro, este es el lugar donde cambia.
 */
export function organizationJsonLd() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId(),
    name: SITE_NAME,
    url,
    description: SITE_DESCRIPTION,
    logo: absoluteUrl(SITE_OG_IMAGE.url),
    email: SITE_EMAIL,
    areaServed: "AR",
    // Sin `sameAs`: los enlaces a redes del pie todavía apuntan a "#". Cuando
    // existan las cuentas reales, van acá.
  };
}

export function websiteJsonLd() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}/#website`,
    name: SITE_NAME,
    url,
    inLanguage: "es-AR",
    publisher: { "@id": organizationId() },
    // Sin `potentialAction`/`SearchAction` a propósito: el buscador del header
    // hoy es un input decorativo, sin formulario ni ruta de resultados.
    // Declarar una URL de búsqueda que no busca nada es exactamente el tipo de
    // marcado que Google castiga. Se agrega cuando exista la búsqueda.
  };
}

/** Un escalón de las migas de pan: el nombre visible y su ruta. */
export type BreadcrumbStep = { name: string; path: string };

export function breadcrumbJsonLd(steps: BreadcrumbStep[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: steps.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.name,
      item: absoluteUrl(step.path),
    })),
  };
}

/**
 * `Product` con su oferta. Es el marcado con más impacto directo en clics: es
 * lo que pone el precio y la disponibilidad en el propio resultado de búsqueda.
 */
export function productJsonLd(product: ProductDetail) {
  const url = absoluteUrl(`/productos/${product.slug}`);

  // El precio efectivo de cada variante, que puede tener su propio override.
  // El esquema garantiza al menos una variante, pero si alguna vez no la
  // hubiera, el precio base es la respuesta correcta y no `Infinity`.
  const prices = product.variants.length
    ? product.variants.map((variant) =>
        variantPriceCents(product.basePrice, variant.priceOverride),
      )
    : [product.basePrice];

  const lowPrice = centsToPesos(Math.min(...prices));
  const highPrice = centsToPesos(Math.max(...prices));

  const availability = product.variants.some((variant) => variant.stock > 0)
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  const offerBase = {
    priceCurrency: "ARS",
    availability,
    itemCondition: "https://schema.org/NewCondition",
    url,
    seller: { "@id": organizationId() },
    // Sin `priceValidUntil`, `shippingDetails` ni `hasMerchantReturnPolicy`.
    // Google los recomienda, pero hoy no hay con qué completarlos sin inventar:
    // el envío se cotiza después de la compra y la política de cambios y
    // devoluciones todavía no existe como página. Los tres se suman cuando esos
    // dos pendientes se resuelvan.
  };

  // Varias variantes a precios distintos no son "un precio": son un rango, y
  // declarar uno solo haría que el resultado de búsqueda muestre un precio que
  // el visitante después no encuentra.
  const offers =
    lowPrice === highPrice
      ? { "@type": "Offer", price: lowPrice, ...offerBase }
      : {
          "@type": "AggregateOffer",
          lowPrice,
          highPrice,
          offerCount: prices.length,
          ...offerBase,
        };

  // `sku` solo si es inequívoco: con varias variantes, cada una tiene el suyo y
  // ponerlo a nivel producto sería elegir uno al azar.
  const skus = product.variants.map((variant) => variant.sku).filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description.replace(/\s+/g, " ").trim(),
    image: product.images.map((image) => absoluteUrl(image.url)),
    url,
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(product.category ? { category: product.category.name } : {}),
    ...(skus.length === 1 ? { sku: skus[0] } : {}),
    offers,
  };
}
