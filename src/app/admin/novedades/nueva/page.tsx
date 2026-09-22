import type { Metadata } from "next";
import Link from "next/link";
import { PostForm } from "@/components/admin/PostForm";

export const metadata: Metadata = {
  title: "Nueva nota",
};

export default function NewPostPage() {
  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link href="/admin/novedades" className="text-sm text-brand-600 hover:text-gold-700">
          ← Novedades
        </Link>
        <h1 className="mt-1 text-2xl font-extrabold text-brand-900">Nueva nota</h1>
      </div>

      <p className="rounded-xl border border-brand-200 bg-white p-4 text-sm text-brand-600">
        La portada se sube después de crear la nota, cuando ya tiene su propia dirección.
      </p>

      <PostForm />
    </div>
  );
}
