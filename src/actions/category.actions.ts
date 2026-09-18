"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin, type ActionResult } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations/product";

function revalidateCategories() {
  // Las categorías salen en el menú del header de todo el storefront.
  revalidatePath("/", "layout");
  revalidatePath("/admin/categorias");
}

export async function saveCategory(input: z.input<typeof categorySchema>): Promise<ActionResult> {
  await assertAdmin();

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos de la categoría.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { id, ...data } = parsed.data;

  const slugOwner = await prisma.category.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });
  if (slugOwner && slugOwner.id !== id) {
    return { ok: false, error: `Ya existe una categoría con el slug "${data.slug}".` };
  }

  if (id) {
    await prisma.category.update({ where: { id }, data });
  } else {
    await prisma.category.create({ data });
  }

  revalidateCategories();
  return { ok: true, message: id ? "Categoría guardada." : "Categoría creada." };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await assertAdmin();

  const category = await prisma.category.findUnique({
    where: { id },
    select: { name: true, _count: { select: { products: true } } },
  });
  if (!category) return { ok: false, error: "La categoría no existe." };

  if (category._count.products > 0) {
    return {
      ok: false,
      error: `"${category.name}" tiene ${category._count.products} producto(s). Movelos a otra categoría antes de borrarla.`,
    };
  }

  await prisma.category.delete({ where: { id } });
  revalidateCategories();
  return { ok: true, message: "Categoría borrada." };
}
