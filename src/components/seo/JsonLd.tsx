/**
 * Datos estructurados (JSON-LD) para buscadores.
 *
 * El escapado de `<` no es decorativo: `JSON.stringify` no escapa nada, y el
 * nombre o la descripción de un producto los edita el admin. Un `</script>`
 * metido ahí cerraría la etiqueta y todo lo que siguiera se interpretaría como
 * HTML. Reemplazarlo por `<` lo neutraliza sin cambiar el valor que lee el
 * buscador, y es lo que recomienda la documentación de Next.
 *
 * Va un `<script>` nativo y no `next/script`: esto es data, no código a
 * ejecutar, así que no hay nada que optimizar en su carga.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
