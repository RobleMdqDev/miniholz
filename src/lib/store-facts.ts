/**
 * Datos operativos de la tienda que aparecen en varias páginas de contenido.
 *
 * Están acá y no escritos dentro de cada página por una razón concreta: el
 * plazo de producción se menciona en Cómo comprar, en Ayuda y en Cambios y
 * devoluciones. Repetido tres veces, tarde o temprano alguien actualiza uno y
 * quedan dos versiones distintas conviviendo en el mismo sitio.
 *
 * Son dichos del negocio, no derivados del código. Cambiarlos es un deploy; si
 * alguna vez hace falta editarlos sin tocar el repositorio, el lugar natural es
 * `StoreSettings`, que ya se administra desde /admin/configuracion.
 */

/** Días hábiles de producción desde que se acredita el pago. */
export const PRODUCTION_DAYS = "7 y 10";

/** Plazo legal de arrepentimiento para compras a distancia (Ley 24.240). */
export const REGRET_DAYS = 10;

/** Ventana para pedir un cambio, contada desde que el pedido se recibe. */
export const EXCHANGE_DAYS = 30;
