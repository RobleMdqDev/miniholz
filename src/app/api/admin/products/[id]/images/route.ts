import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maxUploadBytes, storage } from "@/lib/storage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_IMAGES_PER_PRODUCT = 8;

/** Subida de imágenes de producto. Va por API route porque recibe archivos. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/products/[id]/images">) {
  // El proxy ya filtra /admin, pero esto es /api: se revalida el rol acá.
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "No autorizado." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, slug: true, name: true, _count: { select: { images: true } } },
  });
  if (!product) {
    return Response.json({ error: "El producto no existe." }, { status: 404 });
  }

  const formData = await request.formData();
  const files = formData.getAll("images").filter((entry): entry is File => entry instanceof File);
  if (files.length === 0) {
    return Response.json({ error: "Elegí al menos una imagen." }, { status: 400 });
  }

  if (product._count.images + files.length > MAX_IMAGES_PER_PRODUCT) {
    return Response.json(
      { error: `Un producto admite hasta ${MAX_IMAGES_PER_PRODUCT} imágenes.` },
      { status: 400 },
    );
  }

  const maxBytes = maxUploadBytes();
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: `"${file.name}" no es una imagen válida (JPG, PNG, WEBP o AVIF).` },
        { status: 400 },
      );
    }
    if (file.size > maxBytes) {
      return Response.json(
        {
          error: `"${file.name}" supera el máximo de ${Math.round(maxBytes / 1024 / 1024)} MB.`,
        },
        { status: 400 },
      );
    }
  }

  const uploaded: { url: string }[] = [];
  let position = product._count.images;
  for (const file of files) {
    const saved = await storage.save(file, `uploads/products/${product.id}`);
    await prisma.productImage.create({
      data: { productId: product.id, url: saved.url, alt: product.name, position },
    });
    uploaded.push({ url: saved.url });
    position += 1;
  }

  revalidatePath(`/admin/productos/${product.id}`);
  revalidatePath(`/productos/${product.slug}`);
  revalidatePath("/productos");
  revalidatePath("/");

  return Response.json({ uploaded });
}
