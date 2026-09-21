"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin, type ActionResult } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { postSchema, type PostInput } from "@/lib/validations/post";

type SavePostResult = ActionResult & { postId?: string };

function revalidateNovedades(slug?: string) {
  revalidatePath("/novedades");
  if (slug) revalidatePath(`/novedades/${slug}`);
  revalidatePath("/admin/novedades");
  // El sitemap lista las notas publicadas.
  revalidatePath("/sitemap.xml");
}

/**
 * Qué fecha de publicación le corresponde a la nota.
 *
 * Se sella la primera vez que se publica y después no se toca: es la fecha que
 * ve el lector. Si al despublicar se borrara, volver a publicar inventaría una
 * fecha nueva y la nota saltaría al tope del listado como si fuera reciente.
 */
function nextPublishedAt(
  status: PostInput["status"],
  current: Date | null,
): Date | null {
  if (status !== "PUBLISHED") return current;
  return current ?? new Date();
}

export async function createPost(input: PostInput): Promise<SavePostResult> {
  await assertAdmin();

  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos de la nota.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;
  const slugTaken = await prisma.post.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });
  if (slugTaken) {
    return {
      ok: false,
      error: "Ya existe una nota con ese slug.",
      fieldErrors: { slug: ["Elegí otro."] },
    };
  }

  const post = await prisma.post.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      body: data.body,
      coverUrl: data.coverUrl || null,
      coverAlt: data.coverAlt || null,
      status: data.status,
      publishedAt: nextPublishedAt(data.status, null),
    },
    select: { id: true, slug: true },
  });

  revalidateNovedades(post.slug);
  return { ok: true, postId: post.id, message: "Nota creada." };
}

export async function updatePost(id: string, input: PostInput): Promise<SavePostResult> {
  await assertAdmin();

  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos de la nota.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;
  const existing = await prisma.post.findUnique({
    where: { id },
    select: { slug: true, publishedAt: true },
  });
  if (!existing) return { ok: false, error: "La nota no existe." };

  if (data.slug !== existing.slug) {
    const slugTaken = await prisma.post.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (slugTaken) {
      return {
        ok: false,
        error: "Ya existe una nota con ese slug.",
        fieldErrors: { slug: ["Elegí otro."] },
      };
    }
  }

  await prisma.post.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      body: data.body,
      coverUrl: data.coverUrl || null,
      coverAlt: data.coverAlt || null,
      status: data.status,
      publishedAt: nextPublishedAt(data.status, existing.publishedAt),
    },
  });

  // Si cambió el slug, la url vieja también hay que revalidarla: si no, queda
  // servida desde caché una nota que ya no vive ahí.
  revalidateNovedades(data.slug);
  if (data.slug !== existing.slug) revalidatePath(`/novedades/${existing.slug}`);

  return { ok: true, postId: id, message: "Nota actualizada." };
}

export async function removePostCover(id: string): Promise<ActionResult> {
  await assertAdmin();

  const post = await prisma.post.findUnique({
    where: { id },
    select: { slug: true, coverUrl: true },
  });
  if (!post) return { ok: false, error: "La nota no existe." };
  if (!post.coverUrl) return { ok: true, message: "La nota no tenía portada." };

  await prisma.post.update({ where: { id }, data: { coverUrl: null } });
  await storage.delete(post.coverUrl);

  revalidatePath(`/admin/novedades/${id}`);
  revalidateNovedades(post.slug);
  return { ok: true, message: "Portada eliminada." };
}

export async function deletePost(id: string): Promise<ActionResult> {
  await assertAdmin();

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { slug: true, coverUrl: true },
  });
  if (!existing) return { ok: false, error: "La nota no existe." };

  await prisma.post.delete({ where: { id } });
  // Si no, la portada queda huérfana ocupando lugar en el storage.
  if (existing.coverUrl) await storage.delete(existing.coverUrl);

  revalidateNovedades(existing.slug);
  return { ok: true, message: "Nota eliminada." };
}
