"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin, type ActionResult } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { pesosToCents } from "@/lib/pricing";
import { storage } from "@/lib/storage";
import { productSchema, type ProductInput } from "@/lib/validations/product";

type SaveProductResult = ActionResult & { productId?: string };

function revalidateStorefront(slug?: string) {
  revalidatePath("/");
  revalidatePath("/productos");
  if (slug) revalidatePath(`/productos/${slug}`);
  revalidatePath("/admin/productos");
}

export async function createProduct(input: ProductInput): Promise<SaveProductResult> {
  await assertAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del producto.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;
  const slugTaken = await prisma.product.findUnique({ where: { slug: data.slug }, select: { id: true } });
  if (slugTaken) {
    return { ok: false, error: "Ya existe un producto con ese slug.", fieldErrors: { slug: ["Elegí otro."] } };
  }

  const duplicateSku = await findDuplicateSku(data.variants);
  if (duplicateSku) {
    return { ok: false, error: `El SKU "${duplicateSku}" ya está en uso. Los SKU no se pueden repetir.` };
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      basePrice: pesosToCents(data.basePriceInPesos),
      compareAtPrice: data.compareAtPriceInPesos === null ? null : pesosToCents(data.compareAtPriceInPesos),
      isActive: data.isActive,
      categoryId: data.categoryId,
      personalizationLabel: data.personalizationLabel || null,
      personalizationMaxLength: data.personalizationLabel ? data.personalizationMaxLength : null,
      personalizationRequired: data.personalizationLabel ? data.personalizationRequired : false,
      variants: {
        create: data.variants.map((variant, index) => ({
          name: variant.name,
          sku: variant.sku || null,
          priceOverride: variant.priceInPesos === null ? null : pesosToCents(variant.priceInPesos),
          stock: variant.stock,
          position: index,
        })),
      },
    },
    select: { id: true, slug: true },
  });

  revalidateStorefront(product.slug);
  return { ok: true, productId: product.id, message: "Producto creado." };
}

export async function updateProduct(id: string, input: ProductInput): Promise<SaveProductResult> {
  await assertAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del producto.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;
  const existing = await prisma.product.findUnique({
    where: { id },
    select: {
      slug: true,
      variants: { select: { id: true, name: true, _count: { select: { orderItems: true } } } },
    },
  });
  if (!existing) return { ok: false, error: "El producto no existe." };

  const slugOwner = await prisma.product.findUnique({ where: { slug: data.slug }, select: { id: true } });
  if (slugOwner && slugOwner.id !== id) {
    return { ok: false, error: "Ya existe otro producto con ese slug.", fieldErrors: { slug: ["Elegí otro."] } };
  }

  const duplicateSku = await findDuplicateSku(data.variants, id);
  if (duplicateSku) {
    return { ok: false, error: `El SKU "${duplicateSku}" ya está en uso. Los SKU no se pueden repetir.` };
  }

  // Las variantes que desaparecen del formulario se borran, salvo que estén
  // usadas por un pedido: ahí romperían el historial de compras.
  const keptIds = new Set(data.variants.map((variant) => variant.id).filter(Boolean));
  const toDelete = existing.variants.filter((variant) => !keptIds.has(variant.id));
  const blocked = toDelete.find((variant) => variant._count.orderItems > 0);
  if (blocked) {
    return {
      ok: false,
      error: `No se puede borrar la opción "${blocked.name}" porque ya forma parte de un pedido. Poné su stock en 0 para dejar de venderla.`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        basePrice: pesosToCents(data.basePriceInPesos),
        compareAtPrice: data.compareAtPriceInPesos === null ? null : pesosToCents(data.compareAtPriceInPesos),
        isActive: data.isActive,
        categoryId: data.categoryId,
        personalizationLabel: data.personalizationLabel || null,
        personalizationMaxLength: data.personalizationLabel ? data.personalizationMaxLength : null,
        personalizationRequired: data.personalizationLabel ? data.personalizationRequired : false,
      },
    });

    if (toDelete.length > 0) {
      await tx.productVariant.deleteMany({ where: { id: { in: toDelete.map((v) => v.id) } } });
    }

    for (const [index, variant] of data.variants.entries()) {
      const payload = {
        name: variant.name,
        sku: variant.sku || null,
        priceOverride: variant.priceInPesos === null ? null : pesosToCents(variant.priceInPesos),
        stock: variant.stock,
        position: index,
      };

      if (variant.id) {
        await tx.productVariant.update({ where: { id: variant.id }, data: payload });
      } else {
        await tx.productVariant.create({ data: { ...payload, productId: id } });
      }
    }
  });

  revalidateStorefront(data.slug);
  if (existing.slug !== data.slug) revalidatePath(`/productos/${existing.slug}`);
  return { ok: true, productId: id, message: "Producto guardado." };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await assertAdmin();

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      slug: true,
      images: { select: { url: true } },
      variants: { select: { _count: { select: { orderItems: true } } } },
    },
  });
  if (!product) return { ok: false, error: "El producto no existe." };

  const soldUnits = product.variants.reduce((total, variant) => total + variant._count.orderItems, 0);
  if (soldUnits > 0) {
    return {
      ok: false,
      error:
        "Este producto ya se vendió, así que no se puede borrar sin romper el historial de pedidos. Desactivalo para sacarlo de la tienda.",
    };
  }

  await prisma.product.delete({ where: { id } });
  for (const image of product.images) {
    await storage.delete(image.url);
  }

  revalidateStorefront(product.slug);
  return { ok: true, message: "Producto borrado." };
}

export async function setProductActive(id: string, isActive: boolean): Promise<ActionResult> {
  await assertAdmin();

  const product = await prisma.product.update({
    where: { id },
    data: { isActive },
    select: { slug: true },
  });

  revalidateStorefront(product.slug);
  return { ok: true, message: isActive ? "Producto publicado." : "Producto desactivado." };
}

export async function deleteProductImage(imageId: string): Promise<ActionResult> {
  await assertAdmin();

  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { url: true, product: { select: { id: true, slug: true } } },
  });
  if (!image) return { ok: false, error: "La imagen no existe." };

  await prisma.productImage.delete({ where: { id: imageId } });
  await storage.delete(image.url);

  revalidateStorefront(image.product.slug);
  revalidatePath(`/admin/productos/${image.product.id}`);
  return { ok: true, message: "Imagen borrada." };
}

export async function moveProductImage(imageId: string, direction: "up" | "down"): Promise<ActionResult> {
  await assertAdmin();

  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { id: true, position: true, productId: true, product: { select: { slug: true } } },
  });
  if (!image) return { ok: false, error: "La imagen no existe." };

  const siblings = await prisma.productImage.findMany({
    where: { productId: image.productId },
    orderBy: { position: "asc" },
    select: { id: true },
  });

  const index = siblings.findIndex((sibling) => sibling.id === imageId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= siblings.length) return { ok: true };

  [siblings[index], siblings[target]] = [siblings[target], siblings[index]];

  await prisma.$transaction(
    siblings.map((sibling, position) =>
      prisma.productImage.update({ where: { id: sibling.id }, data: { position } }),
    ),
  );

  revalidateStorefront(image.product.slug);
  revalidatePath(`/admin/productos/${image.productId}`);
  return { ok: true };
}

/**
 * `ProductVariant.sku` es único en toda la tienda. Sin este chequeo previo, un
 * SKU repetido llega a la base y explota con el error crudo de Prisma en vez de
 * un mensaje que el admin pueda entender.
 */
async function findDuplicateSku(
  variants: { id?: string; sku?: string }[],
  productId?: string,
): Promise<string | null> {
  const skus = variants
    .map((variant) => variant.sku?.trim())
    .filter((sku): sku is string => Boolean(sku));

  const seen = new Set<string>();
  for (const sku of skus) {
    if (seen.has(sku)) return sku;
    seen.add(sku);
  }
  if (skus.length === 0) return null;

  const taken = await prisma.productVariant.findMany({
    where: {
      sku: { in: skus },
      ...(productId ? { NOT: { productId } } : {}),
    },
    select: { sku: true },
  });

  return taken[0]?.sku ?? null;
}
