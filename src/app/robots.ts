import type { MetadataRoute } from "next";
import { isIndexable, siteUrl } from "@/lib/site";

/**
 * Qué puede rastrear un buscador.
 *
 * Lo que se bloquea siempre no es secreto —la autorización real vive en
 * `proxy.ts` y en cada Server Action—, es que no aporta nada a una búsqueda:
 * paneles con sesión, pasos de checkout y endpoints de API. Dejarlos abiertos
 * gasta presupuesto de rastreo en páginas que nunca van a posicionar.
 */
export default function robots(): MetadataRoute.Robots {
  const alwaysBlocked = [
    "/admin",
    "/cuenta",
    "/checkout",
    "/carrito",
    "/login",
    "/registro",
    "/api",
  ];

  // Con el sitio todavía sin aprobar, el bloqueo lo hace el `noindex` del
  // layout, **no** un `Disallow: /` acá.
  //
  // Parece al revés y no lo es: `Disallow` impide *rastrear*, y una página que
  // Google no rastrea es una página en la que nunca ve la etiqueta `noindex`.
  // Si alguien enlaza el sitio desde afuera, Google puede listar igual la URL
  // —sin título ni descripción, porque no la pudo leer— y encima sin forma de
  // enterarse de que no debía. Dejándolo rastrear, lee el `noindex` y la
  // descarta de verdad.
  //
  // Lo que sí se omite es el sitemap: anunciarlo mientras todo está en
  // `noindex` solo llena Search Console de avisos de "URL enviada marcada como
  // noindex".
  if (!isIndexable()) {
    return {
      rules: { userAgent: "*", allow: "/", disallow: alwaysBlocked },
    };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: alwaysBlocked },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
