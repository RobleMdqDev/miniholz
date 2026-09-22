import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maxUploadBytes, storage } from "@/lib/storage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Portada de una nota. Va por API route y no por Server Action porque recibe un
 * archivo.
 *
 * La imagen se sube al storage propio en vez de aceptar una URL pegada a mano:
 * `next/image` solo optimiza los dominios declarados en `next.config.ts`, así
 * que una URL externa daría 400 en producción.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/posts/[id]/cover">) {
  // El proxy ya filtra /admin, pero esto es /api: se revalida el rol acá.
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "No autorizado." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, slug: true, coverUrl: true },
  });
  if (!post) {
    return Response.json({ error: "La nota no existe." }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("cover");
  if (!(file instanceof File)) {
    return Response.json({ error: "Elegí una imagen." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { error: `"${file.name}" no es una imagen válida (JPG, PNG, WEBP o AVIF).` },
      { status: 400 },
    );
  }

  const maxBytes = maxUploadBytes();
  if (file.size > maxBytes) {
    return Response.json(
      { error: `"${file.name}" supera el máximo de ${Math.round(maxBytes / 1024 / 1024)} MB.` },
      { status: 400 },
    );
  }

  const saved = await storage.save(file, `uploads/posts/${post.id}`);
  await prisma.post.update({ where: { id: post.id }, data: { coverUrl: saved.url } });

  // Recién después de guardar la nueva: si borrar falla, la nota queda con
  // portada igual, que es mejor que quedarse sin ninguna.
  if (post.coverUrl) await storage.delete(post.coverUrl);

  revalidatePath(`/admin/novedades/${post.id}`);
  revalidatePath("/admin/novedades");
  revalidatePath("/novedades");
  revalidatePath(`/novedades/${post.slug}`);

  return Response.json({ url: saved.url });
}
