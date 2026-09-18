/**
 * Catálogo de muestra para desarrollo. No es el catálogo real de MiniHolz: se
 * carga con `npx prisma db seed` para poder trabajar la tienda antes de que
 * exista el panel de administración (Fase 5), y se reemplaza cargando los
 * productos reales desde ahí.
 *
 * Precios en centavos, como en toda la app.
 */

export const sampleCategories = [
  { slug: "mesas-y-sillas", name: "Mesas y sillas", position: 1 },
  { slug: "percheros", name: "Percheros", position: 2 },
  { slug: "decoracion", name: "Decoración", position: 3 },
  { slug: "organizacion", name: "Organización", position: 4 },
  { slug: "guardado", name: "Guardado", position: 5 },
];

type SampleProduct = {
  slug: string;
  name: string;
  categorySlug: string;
  description: string;
  basePrice: number;
  compareAtPrice: number | null;
  personalizationLabel: string | null;
  personalizationMaxLength: number | null;
  personalizationRequired: boolean;
  variants: { name: string; stock: number; priceOverride?: number }[];
  imageAlts: string[];
};

export const sampleProducts: SampleProduct[] = [
  {
    slug: "mesa-y-silla-personalizada",
    name: "Mesa y silla infantil personalizada",
    categorySlug: "mesas-y-sillas",
    description:
      "Set de mesa y silla en madera maciza, pensado para que los chicos jueguen, dibujen y coman a su altura. Bordes redondeados, terminación con laca al agua apta para uso infantil y el nombre grabado en el frente de la mesa.",
    basePrice: 4890000,
    compareAtPrice: 6100000,
    personalizationLabel: "Nombre a grabar",
    personalizationMaxLength: 12,
    personalizationRequired: false,
    variants: [
      { name: "Natural", stock: 6 },
      { name: "Blanco", stock: 3 },
      { name: "Rosa viejo", stock: 2, priceOverride: 5190000 },
    ],
    imageAlts: [
      "Mesa infantil de madera natural con patas torneadas",
      "Detalle de la terminación de la madera",
      "Mesa vista de frente con el nombre grabado",
    ],
  },
  {
    slug: "perchero-infantil-con-nombre",
    name: "Perchero infantil con nombre",
    categorySlug: "percheros",
    description:
      "Perchero de pared a la altura de los chicos, para que puedan colgar y descolgar solos su abrigo y su mochila. Incluye tarugos y tornillos para instalarlo.",
    basePrice: 1120000,
    compareAtPrice: 1400000,
    personalizationLabel: "Nombre a grabar",
    personalizationMaxLength: 10,
    personalizationRequired: true,
    variants: [
      { name: "3 ganchos", stock: 8 },
      { name: "5 ganchos", stock: 4, priceOverride: 1340000 },
    ],
    imageAlts: [
      "Perchero de madera con tres ganchos",
      "Perchero montado en la pared",
      "Detalle del nombre grabado en el perchero",
    ],
  },
  {
    slug: "cartel-de-nombre-de-madera",
    name: "Cartel de nombre de madera",
    categorySlug: "decoracion",
    description:
      "Cartel calado con el nombre, ideal para la puerta del cuarto o sobre la cuna. Se entrega listo para colgar, con cinta de algodón.",
    basePrice: 620000,
    compareAtPrice: 780000,
    personalizationLabel: "Nombre a calar",
    personalizationMaxLength: 12,
    personalizationRequired: true,
    variants: [
      { name: "20 cm", stock: 12 },
      { name: "30 cm", stock: 7, priceOverride: 760000 },
      { name: "40 cm", stock: 0, priceOverride: 890000 },
    ],
    imageAlts: [
      "Cartel de madera con nombre calado",
      "Cartel colgado sobre una cuna",
      "Detalle del calado de las letras",
    ],
  },
  {
    slug: "movil-de-cuna-nube",
    name: "Móvil de cuna nube",
    categorySlug: "decoracion",
    description:
      "Móvil de cuna en madera y hilo de algodón, con nubes y gotas en tonos suaves. Liviano y silencioso, se cuelga del soporte de la cuna.",
    basePrice: 990000,
    compareAtPrice: null,
    personalizationLabel: null,
    personalizationMaxLength: null,
    personalizationRequired: false,
    variants: [{ name: "Único", stock: 5 }],
    imageAlts: [
      "Móvil de cuna con nubes de madera",
      "Móvil colgado sobre la cuna",
      "Detalle de las nubes y las gotas",
    ],
  },
  {
    slug: "organizador-de-panales",
    name: "Organizador de pañales de madera",
    categorySlug: "organizacion",
    description:
      "Organizador para el cambiador, con tres compartimentos para pañales, toallitas y cremas. Se apoya o se cuelga de la pared.",
    basePrice: 730000,
    compareAtPrice: 910000,
    personalizationLabel: "Nombre a grabar",
    personalizationMaxLength: 12,
    personalizationRequired: false,
    variants: [
      { name: "Natural", stock: 9 },
      { name: "Blanco", stock: 1 },
    ],
    imageAlts: [
      "Organizador de pañales de madera con tres compartimentos",
      "Organizador apoyado sobre el cambiador",
      "Detalle de los compartimentos",
    ],
  },
  {
    slug: "baul-de-juguetes-personalizado",
    name: "Baúl de juguetes personalizado",
    categorySlug: "guardado",
    description:
      "Baúl con tapa y bisagras de cierre lento, para que la tapa no se cierre de golpe. Interior lijado y sin astillas, con el nombre grabado en el frente.",
    basePrice: 1580000,
    compareAtPrice: null,
    personalizationLabel: "Nombre a grabar",
    personalizationMaxLength: 14,
    personalizationRequired: false,
    variants: [
      { name: "Natural", stock: 4 },
      { name: "Rosa viejo", stock: 2, priceOverride: 1690000 },
    ],
    imageAlts: [
      "Baúl de juguetes de madera con tapa",
      "Baúl abierto mostrando el interior",
      "Detalle del nombre grabado en el frente",
    ],
  },
  {
    slug: "percha-de-pared-con-nombre",
    name: "Percha de pared con nombre",
    categorySlug: "percheros",
    description:
      "Percha individual de pared con el nombre grabado. Se puede combinar con otras para armar una fila en el cuarto o en la entrada.",
    basePrice: 850000,
    compareAtPrice: null,
    personalizationLabel: "Nombre a grabar",
    personalizationMaxLength: 10,
    personalizationRequired: true,
    variants: [{ name: "Único", stock: 15 }],
    imageAlts: [
      "Percha de pared de madera con nombre",
      "Varias perchas montadas en fila",
      "Detalle del grabado",
    ],
  },
  {
    slug: "set-mesa-didactica-montessori",
    name: "Set mesa didáctica Montessori",
    categorySlug: "mesas-y-sillas",
    description:
      "Mesa didáctica con bandejas intercambiables para juego sensorial, siguiendo la propuesta Montessori. Incluye dos bandejas y una tapa lisa para usarla como escritorio.",
    basePrice: 3690000,
    compareAtPrice: null,
    personalizationLabel: null,
    personalizationMaxLength: null,
    personalizationRequired: false,
    variants: [
      { name: "Natural", stock: 3 },
      { name: "Blanco", stock: 0 },
    ],
    imageAlts: [
      "Mesa didáctica de madera con bandejas",
      "Mesa con las bandejas colocadas",
      "Detalle de la bandeja sensorial",
    ],
  },
];
