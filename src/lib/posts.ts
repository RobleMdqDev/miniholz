import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Consultas de la sección Novedades.
 *
 * Una regla que sostiene todo el archivo: **la tienda nunca ve un borrador**.
 * El filtro no se arma en cada página sino acá, en `publishedWhere()`, para que
 * agregar una consulta nueva no sea una oportunidad de olvidárselo.
 */

/**
 * Publicada y con fecha ya cumplida. Lo segundo permite dejar una nota
 * programada para más adelante sin que aparezca antes de tiempo.
 *
 * Es una función y no una constante a propósito: como constante, el `new Date()`
 * se evalúa una sola vez, cuando se carga el módulo, y el filtro queda clavado
 * en la hora de arranque del servidor. Una nota publicada después de ese momento
 * no aparecía hasta reiniciar el proceso.
 */
function publishedWhere(): Prisma.PostWhereInput {
  return {
    status: "PUBLISHED",
    publishedAt: { not: null, lte: new Date() },
  };
}

/** Cuántas notas por página en el listado público. */
export const POSTS_PER_PAGE = 9;

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverUrl: true,
  coverAlt: true,
  publishedAt: true,
} as const;

export type PostCardData = Prisma.PostGetPayload<{ select: typeof cardSelect }>;

/**
 * Una página del listado público. Devuelve también el total para poder dibujar
 * la paginación sin una segunda consulta desde la página.
 */
export async function getPublishedPosts(page: number) {
  const currentPage = Math.max(1, Math.trunc(page) || 1);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: publishedWhere(),
      orderBy: { publishedAt: "desc" },
      skip: (currentPage - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
      select: cardSelect,
    }),
    prisma.post.count({ where: publishedWhere() }),
  ]);

  return {
    posts,
    total,
    currentPage,
    totalPages: Math.max(1, Math.ceil(total / POSTS_PER_PAGE)),
  };
}

export async function getPublishedPostBySlug(slug: string) {
  return prisma.post.findFirst({
    where: { slug, ...publishedWhere() },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      body: true,
      coverUrl: true,
      coverAlt: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
}

export type PostDetail = NonNullable<Awaited<ReturnType<typeof getPublishedPostBySlug>>>;

/** Para el sitemap y para prerenderizar las notas. */
export async function getPublishedPostRoutes() {
  return prisma.post.findMany({
    where: publishedWhere(),
    orderBy: { publishedAt: "desc" },
    select: { slug: true, updatedAt: true },
  });
}

/**
 * El listado del panel, que sí ve los borradores: es justamente donde hay que
 * poder encontrarlos.
 */
export async function getAdminPosts() {
  return prisma.post.findMany({
    orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      coverUrl: true,
      coverAlt: true,
    },
  });
}

export async function getPostForAdmin(id: string) {
  return prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      body: true,
      coverUrl: true,
      coverAlt: true,
      status: true,
      publishedAt: true,
    },
  });
}

export type AdminPostDetail = NonNullable<Awaited<ReturnType<typeof getPostForAdmin>>>;

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatPostDate(date: Date): string {
  return dateFormatter.format(date);
}
