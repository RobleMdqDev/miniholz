"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin, type ActionResult } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { storeSettingsSchema } from "@/lib/validations/product";

export async function updateStoreSettings(
  input: z.input<typeof storeSettingsSchema>,
): Promise<ActionResult> {
  await assertAdmin();

  const parsed = storeSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos de la tienda.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = {
    whatsappNumber: parsed.data.whatsappNumber,
    bankAccountInfo: parsed.data.bankAccountInfo,
    announcementText: parsed.data.announcementText || null,
    menuPromoTitle: parsed.data.menuPromoTitle || null,
    menuPromoSubtitle: parsed.data.menuPromoSubtitle || null,
    menuPromoHref: parsed.data.menuPromoHref || null,
  };

  await prisma.storeSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  // El anuncio y la promo del menú salen en el layout de todo el storefront.
  revalidatePath("/", "layout");
  revalidatePath("/admin/configuracion");
  return { ok: true, message: "Configuración guardada." };
}
