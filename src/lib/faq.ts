import { installmentsCount, transferDiscountPercent } from "@/lib/pricing";
import { PRODUCTION_DAYS } from "@/lib/store-facts";

/**
 * Las preguntas frecuentes, en un solo lugar.
 *
 * Viven acá y no dentro de la página porque las consume dos veces: el contenido
 * visible de `/ayuda` y el `FAQPage` de datos estructurados. Si se escribieran
 * dos veces, Google terminaría leyendo una versión y el visitante otra — que es
 * justo el tipo de discrepancia que invalida el marcado.
 *
 * El descuento y las cuotas salen de `pricing.ts`, no escritos a mano: si
 * mañana el descuento por transferencia cambia, esta respuesta cambia sola.
 */
export type FaqEntry = { question: string; answer: string };

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: "¿Cómo puedo pagar?",
    answer: `Con tarjeta de crédito o débito a través de Mercado Pago, en hasta ${installmentsCount} cuotas sin interés según tu banco; por transferencia bancaria, con un ${transferDiscountPercent}% de descuento adicional; o coordinando el pago por WhatsApp. Elegís el medio al finalizar la compra.`,
  },
  {
    question: "¿Cuánto tarda en llegar mi pedido?",
    answer: `Cada pieza se hace a pedido, así que la producción lleva entre ${PRODUCTION_DAYS} días hábiles desde que se acredita el pago. A eso se le suma el tiempo del envío, que depende del correo y de tu localidad.`,
  },
  {
    question: "¿Cuánto cuesta el envío?",
    answer:
      "El costo del envío no está incluido en el total que ves al finalizar la compra: lo cotizamos después, según el tamaño del pedido y tu código postal, y te lo pasamos antes de despachar. Nunca se cobra nada sin avisarte primero.",
  },
  {
    question: "¿Hacen envíos a todo el país?",
    answer:
      "Sí, enviamos a todo el país por correo. Una vez confirmado el pedido coordinamos con vos el costo y la modalidad, y te pasamos el código de seguimiento cuando el paquete sale del taller.",
  },
  {
    question: "¿Puedo pedir que graben un nombre?",
    answer:
      "Sí, en todos los productos que lo permiten. En la ficha de cada uno vas a ver el campo para escribir el texto y el máximo de caracteres que entra en esa pieza. El grabado no tiene costo adicional.",
  },
  {
    question: "¿Puedo cambiar o devolver un producto personalizado?",
    answer:
      "Los productos con nombre grabado se hacen especialmente para cada pedido, así que no se cambian ni se devuelven por arrepentimiento. Si la pieza llegó fallada o nos equivocamos en el grabado, la reponemos sin cargo.",
  },
  {
    question: "¿Necesito crear una cuenta para comprar?",
    answer:
      "No. Podés comprar como invitado dejando tu mail y tus datos de envío. Si creás una cuenta, además vas a poder ver el estado de tus pedidos y volver a ellos cuando quieras desde Mi cuenta.",
  },
  {
    question: "¿Cómo sigo el estado de mi pedido?",
    answer:
      "Si comprás con cuenta, desde Mi cuenta > Mis pedidos. Si comprás como invitado, guardá el enlace del pedido que te mostramos al finalizar la compra: es la forma de volver a él.",
  },
  {
    question: "¿Cómo envío el comprobante de la transferencia?",
    answer:
      "Desde la página del pedido: ahí mismo vas a encontrar los datos bancarios y un botón para subir el comprobante. Cuando lo verificamos, el pedido pasa a preparación.",
  },
  {
    question: "¿Es seguro pagar con tarjeta en el sitio?",
    answer:
      "Sí. El pago con tarjeta se completa dentro del sitio de Mercado Pago, no en el nuestro: los datos de tu tarjeta nunca pasan por MiniHolz ni quedan guardados acá.",
  },
];
