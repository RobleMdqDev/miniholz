"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Upload } from "lucide-react";
import { removePostCover } from "@/actions/post.actions";
import { FormError } from "@/components/ui/form";

/**
 * La portada se administra aparte del formulario, como las imágenes de
 * producto: sube por API route (es un archivo) y se guarda sola, sin esperar a
 * que se envíe el resto de la nota.
 */
export function PostCoverManager({
  postId,
  coverUrl,
}: {
  postId: string;
  coverUrl: string | null;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("cover", file);

    setUploading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/posts/${postId}/cover`, {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "No pudimos subir la portada.");
        return;
      }
      router.refresh();
    } catch {
      setError("No pudimos subir la portada. Revisá tu conexión.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function onRemove() {
    startTransition(async () => {
      setError(null);
      const result = await removePostCover(postId);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  const busy = uploading || pending;

  return (
    <div className="space-y-3">
      <FormError message={error ?? undefined} />

      {coverUrl ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-brand-200 bg-brand-50">
          <Image src={coverUrl} alt="" fill sizes="320px" className="object-cover" />
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center rounded-xl border border-dashed border-brand-200 bg-brand-50 text-xs text-brand-600">
          Sin portada
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-800 transition hover:border-gold-400">
          <Upload className="h-4 w-4" aria-hidden />
          {uploading ? "Subiendo…" : coverUrl ? "Reemplazar" : "Subir portada"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={onUpload}
            disabled={busy}
            className="sr-only"
          />
        </label>

        {coverUrl && (
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="flex items-center gap-2 rounded-full border border-danger-200 px-4 py-2 text-sm font-semibold text-danger-700 transition hover:bg-danger-50 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Quitar
          </button>
        )}
      </div>

      <p className="text-xs text-brand-600">
        Se ve en el listado y al compartir la nota. Conviene apaisada (16:9).
      </p>
    </div>
  );
}
