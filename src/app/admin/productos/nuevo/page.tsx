import type { Metadata } from "next";
import { getAdminCategories } from "@/lib/admin-queries";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = {
  title: "Nuevo producto",
};

export default async function NewProductPage() {
  const categories = await getAdminCategories();

  return (
    <div className="max-w-4xl space-y-5">
      <h1 className="text-2xl font-extrabold text-brand-900">Nuevo producto</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
