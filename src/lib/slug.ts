/** Tope de caracteres de un slug. Es el mismo para productos, categorías y notas. */
export const SLUG_MAX_LENGTH = 80;

/**
 * La forma válida de un slug: grupos de letras y números separados por **un**
 * guion, sin guiones al principio ni al final.
 *
 * No alcanza con validar los caracteres permitidos (`/^[a-z0-9-]+$/`): eso deja
 * pasar `-percheros-`, `mesas--sillas` y hasta `--`. Son URLs feas, se ven en el
 * resultado de búsqueda y, peor, dos escrituras distintas de lo mismo terminan
 * siendo dos páginas distintas.
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function withoutAccents(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Convierte un nombre en un slug de url: sin tildes, en minúsculas, con guiones.
 *
 * El recorte va **antes** de limpiar los guiones de las puntas, no después. Al
 * revés —como estaba— un corte que cae justo en el medio de una palabra vuelve a
 * dejar un guion colgando al final, y ese slug ya no pasa su propia validación.
 */
export function slugify(value: string, maxLength = SLUG_MAX_LENGTH): string {
  return withoutAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, maxLength)
    .replace(/^-+|-+$/g, "");
}

/**
 * Versión tolerante, para usar mientras alguien **está escribiendo** el slug a
 * mano en un formulario.
 *
 * Pasar `slugify` en cada tecla hace imposible escribir un guion: apenas se
 * teclea, lo borra por ser el último carácter, y nunca se puede llegar a
 * "mesas-y-sillas". Esta versión deja el guion final en paz y solo impide lo que
 * no tiene vuelta atrás —acentos, símbolos, guiones repetidos o al principio—.
 * Al salir del campo se normaliza con `slugify`.
 */
export function slugifyWhileTyping(value: string, maxLength = SLUG_MAX_LENGTH): string {
  return withoutAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .slice(0, maxLength);
}
