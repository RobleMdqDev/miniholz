import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Qué puede rastrear un buscador.
 *
 * Lo que se bloquea no es secreto —la autorización real vive en `proxy.ts` y en
 * cada Server Action—, es que no aporta nada a una búsqueda: paneles con
 * sesión, pasos de checkout y endpoints de API. Dejarlos abiertos gasta
 * presupuesto de rastreo en páginas que nunca van a posicionar.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/cuenta", "/checkout", "/carrito", "/login", "/registro", "/api"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
