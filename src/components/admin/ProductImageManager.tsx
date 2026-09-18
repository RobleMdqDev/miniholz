"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Trash2, Upload } from "lucide-react";
import { deleteProductImage, moveProductImage } from "@/actions/product.actions";
import { FormError } from "@/components/ui/form";

type ProductImage = { id: string; url: string; alt: string | null; position: number };

export function ProductImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (const file of files) formData.append("images", file);

    setUploading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "No pudimos subir las imágenes.");
        return;
      }
      router.refresh();
    } catch {
      setError("No pudimos subir las imágenes. Revisá tu conexión.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function runAction(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (!result.ok) setError(result.error ?? "No se pudo completar la acción.");
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {images.length === 0 ? (
        <p className="rounded-xl bg-brand-50 p-4 text-sm text-brand-600">
          Todavía no subiste imágenes. La primera es la que se ve en el listado de la tienda.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.id} className="rounded-xl border border-brand-200 p-2">
              <div className="relative mb-2 aspect-square overflow-hidden rounded-lg bg-brand-50">
                <Image
                  src={image.url}
                  alt={image.alt ?? ""}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
                {index === 0 && (
                  <span className="absolute left-1 top-1 rounded-full bg-gold-700 px-2 py-0.5 text-[10px] font-bold text-white">
                    Principal
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="flex gap-1">
                  <button
                    type="button"
                    disabled={index === 0 || pending}
                    onClick={() => runAction(() => moveProductImage(image.id, "up"))}
                    aria-label="Mover antes"
                    className="rounded p-1 text-brand-600 hover:bg-brand-100 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={index === images.length - 1 || pending}
                    onClick={() => runAction(() => moveProductImage(image.id, "down"))}
                    aria-label="Mover después"
                    className="rounded p-1 text-brand-600 hover:bg-brand-100 disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </span>

                <button
                  type="button"
                  disabled={pending}
                  onClick={() => runAction(() => deleteProductImage(image.id))}
                  aria-label="Borrar imagen"
                  className="rounded p-1 text-brand-600 hover:bg-danger-50 hover:text-danger-600 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-800 transition hover:border-gold-400 hover:text-gold-700">
        <Upload className="h-4 w-4" aria-hidden />
        {uploading ? "Subiendo…" : "Agregar imágenes"}
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={onUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>

      <FormError message={error ?? undefined} />
    </div>
  );
}
