/**
 * Texto introductorio de cada categoría.
 *
 * Sin esto una página de categoría es una grilla de imágenes: no le dice nada a
 * un buscador, que solo ve el `h1` y un puñado de nombres de producto. Este
 * párrafo es lo que le da a la página algo que posicionar.
 *
 * Vive en código y no en la base siguiendo el criterio que ya fijó el plan de
 * navegación: código para lo que cambia poco, base de datos para lo que cambia
 * seguido. Son cinco textos que se tocan una vez por año. Si alguna vez hace
 * falta editarlos sin un deploy, el movimiento es agregar `description` a
 * `Category` y leerlo desde el admin; el resto de esta entrega no cambia.
 *
 * ⚠️ Estos textos los redacté yo a partir de lo que hay en el catálogo. Son
 * descriptivos y no prometen plazos, precios ni materiales que no estén ya en
 * las fichas, pero conviene que los revise alguien de la marca: es la voz de la
 * tienda la que habla acá.
 */
const CATEGORY_INTRO: Record<string, string> = {
  "mesas-y-sillas":
    "Mesas y sillas de madera a escala infantil, para que los chicos dibujen, jueguen y coman a su altura. Cada juego se hace a mano y se puede grabar con el nombre.",
  percheros:
    "Percheros y perchas de pared de madera para el cuarto de los chicos: dejan abrigos, mochilas y toallas a una altura que pueden alcanzar solos, con el nombre grabado.",
  decoracion:
    "Piezas de madera para decorar el cuarto: carteles con el nombre, móviles de cuna y detalles hechos a mano que acompañan el crecimiento.",
  organizacion:
    "Organizadores de madera para el cambiador y el cuarto: cada cosa en su lugar, en piezas que combinan con el resto de los muebles.",
  guardado:
    "Baúles y cajas de madera para guardar juguetes: aguantan el uso diario y hacen que ordenar sea parte del juego.",
};

/**
 * Devuelve `null` para una categoría sin texto —una nueva, por ejemplo— y la
 * página simplemente no muestra el párrafo. Es preferible a un texto genérico
 * de relleno, que no aporta nada y se nota.
 */
export function categoryIntro(slug: string): string | null {
  return CATEGORY_INTRO[slug] ?? null;
}
