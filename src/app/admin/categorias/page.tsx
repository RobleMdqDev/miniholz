import type { Metadata } from "next";
import { getAdminCategories } from "@/lib/admin-queries";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const metadata: Metadata = {
  title: "Categorías",
};

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">Categorías</h1>
        <p className="text-sm text-brand-600">
          Definen el menú de la tienda y los filtros del catálogo. El orden controla cómo aparecen.
        </p>
      </div>

      <CategoryManager categories={categories} />
    </div>
  );
}
