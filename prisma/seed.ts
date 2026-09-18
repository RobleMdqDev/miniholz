import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { sampleCategories, sampleProducts } from "./sample-catalog";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Administración";

  if (!email || !password) {
    throw new Error(
      "Faltan ADMIN_EMAIL y/o ADMIN_PASSWORD en .env — son necesarios para crear el usuario administrador.",
    );
  }

  // Solo se crea si no existe: correr el seed de nuevo no pisa la contraseña
  // que el admin haya cambiado.
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      passwordHash: await hash(password, 10),
      role: "ADMIN",
    },
  });
  console.log(`Usuario administrador listo: ${admin.email}`);

  const existingSettings = await prisma.storeSettings.findUnique({ where: { id: 1 } });
  const whatsappNumber = process.env.WHATSAPP_NUMBER ?? "";
  const bankAccountInfo = process.env.BANK_ACCOUNT_INFO ?? "";

  // Solo completa lo que esté vacío: nunca pisa lo que el admin ya haya cargado.
  const settings = await prisma.storeSettings.upsert({
    where: { id: 1 },
    update: {
      whatsappNumber: existingSettings?.whatsappNumber || whatsappNumber,
      bankAccountInfo: existingSettings?.bankAccountInfo || bankAccountInfo,
    },
    create: {
      id: 1,
      whatsappNumber,
      bankAccountInfo,
      announcementText: "ENVIAMOS a todo el país — el costo se coordina después de la compra",
    },
  });
  console.log(
    `Configuración de tienda lista (WhatsApp: ${settings.whatsappNumber || "sin cargar"})`,
  );

  await seedSampleCatalog();
}

/**
 * Catálogo de muestra para poder trabajar la tienda antes del panel de admin.
 * Los productos que ya existen se dejan intactos, así correr el seed de nuevo
 * no pisa lo que se haya editado a mano.
 */
async function seedSampleCatalog() {
  for (const category of sampleCategories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, position: category.position },
      create: category,
    });
  }

  let created = 0;
  for (const product of sampleProducts) {
    const exists = await prisma.product.findUnique({
      where: { slug: product.slug },
      select: { id: true },
    });
    if (exists) continue;

    const category = await prisma.category.findUnique({
      where: { slug: product.categorySlug },
      select: { id: true },
    });

    await prisma.product.create({
      data: {
        slug: product.slug,
        name: product.name,
        description: product.description,
        basePrice: product.basePrice,
        compareAtPrice: product.compareAtPrice,
        personalizationLabel: product.personalizationLabel,
        personalizationMaxLength: product.personalizationMaxLength,
        personalizationRequired: product.personalizationRequired,
        categoryId: category?.id,
        variants: {
          create: product.variants.map((variant, index) => ({
            name: variant.name,
            stock: variant.stock,
            priceOverride: variant.priceOverride ?? null,
            position: index,
          })),
        },
        images: {
          create: product.imageAlts.map((alt, index) => ({
            url: `/images/muestra/${product.slug}-${index + 1}.png`,
            alt,
            position: index,
          })),
        },
      },
    });
    created += 1;
  }

  console.log(
    `Catálogo de muestra: ${sampleCategories.length} categorías, ${created} productos nuevos ` +
      `(${sampleProducts.length - created} ya existían)`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
