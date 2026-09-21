import { prisma } from "@/lib/prisma";

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  basePrice: true,
  compareAtPrice: true,
  category: { select: { name: true, slug: true } },
  images: { select: { url: true, alt: true }, orderBy: { position: "asc" }, take: 1 },
  variants: { select: { stock: true, priceOverride: true } },
} as const;

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  compareAtPrice: number | null;
  categoryName: string | null;
  image: { url: string; alt: string | null } | null;
  inStock: boolean;
};

type ProductCardRow = {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  compareAtPrice: number | null;
  category: { name: string; slug: string } | null;
  images: { url: string; alt: string | null }[];
  variants: { stock: number; priceOverride: number | null }[];
};

function toCardData(product: ProductCardRow): ProductCardData {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    basePrice: product.basePrice,
    compareAtPrice: product.compareAtPrice,
    categoryName: product.category?.name ?? null,
    image: product.images[0] ?? null,
    inStock: product.variants.some((variant) => variant.stock > 0),
  };
}

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true },
  });
}

export async function getProducts(options: { categorySlug?: string; take?: number } = {}) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(options.categorySlug ? { category: { slug: options.categorySlug } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options.take,
    select: cardSelect,
  });
  return products.map(toCardData);
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      basePrice: true,
      compareAtPrice: true,
      personalizationLabel: true,
      personalizationMaxLength: true,
      personalizationRequired: true,
      category: { select: { name: true, slug: true } },
      images: {
        select: { id: true, url: true, alt: true },
        orderBy: { position: "asc" },
      },
      variants: {
        select: { id: true, name: true, sku: true, stock: true, priceOverride: true },
        orderBy: { position: "asc" },
      },
    },
  });
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

/**
 * Lo que el sitemap necesita de cada producto activo: la url, cuándo cambió por
 * última vez y su primera imagen. `updatedAt` sale de la base y no de la fecha
 * del build, que es lo que le dice al buscador que vale la pena volver a pasar.
 */
export async function getSitemapProducts() {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
    select: {
      slug: true,
      updatedAt: true,
      images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
    },
  });
}

/** Los slugs de producto activos, para prerenderizar las fichas. */
export async function getActiveProductSlugs() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return products.map((product) => product.slug);
}
