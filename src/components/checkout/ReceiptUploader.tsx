"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Upload } from "lucide-react";
import { FormError } from "@/components/ui/form";

export function ReceiptUploader({
  orderId,
  currentReceiptUrl,
}: {
  orderId: string;
  currentReceiptUrl: string | null;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState(currentReceiptUrl);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setUploading(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/receipt`, {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) {
        setError(data.error ?? "No pudimos subir el comprobante.");
        return;
      }

      setUploadedUrl(data.url ?? null);
      form.reset();
      router.refresh();
    } catch {
      setError("No pudimos subir el comprobante. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {uploadedUrl && (
        <p className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800">
          <Check className="h-4 w-4 text-gold-600" aria-hidden />
          Comprobante recibido.{" "}
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-gold-700 hover:underline"
          >
            Verlo
          </a>
        </p>
      )}

      <div>
        <label htmlFor="receipt" className="mb-1 block text-sm font-semibold text-brand-800">
          {uploadedUrl ? "Subir otro comprobante" : "Subir comprobante"}
        </label>
        <input
          id="receipt"
          name="receipt"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-700 file:mr-3 file:rounded-full file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-800"
        />
        <p className="mt-1 text-xs text-brand-600">Imagen (JPG, PNG, WEBP) o PDF.</p>
      </div>

      <FormError message={error ?? undefined} />

      <button
        type="submit"
        disabled={uploading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-700 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gold-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Upload className="h-4 w-4" aria-hidden />
        {uploading ? "Subiendo…" : "Enviar comprobante"}
      </button>
    </form>
  );
}
