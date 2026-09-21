import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getPostForAdmin } from "@/lib/posts";
import { PostForm } from "@/components/admin/PostForm";
import { PostCoverManager } from "@/components/admin/PostCoverManager";

export const metadata: Metadata = {
  title: "Editar nota",
};

export default async function EditPostPage(props: PageProps<"/admin/novedades/[id]">) {
  const { id } = await props.params;
  const post = await getPostForAdmin(id);
  if (!post) notFound();

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/novedades" className="text-sm text-brand-600 hover:text-gold-700">
            ← Novedades
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold text-brand-900">{post.title}</h1>
        </div>

        {post.status === "PUBLISHED" && (
          <Link
            href={`/novedades/${post.slug}`}
            target="_blank"
            className="flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-800 transition hover:border-gold-400"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Ver en la tienda
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <PostForm post={post} />

        <aside className="lg:order-last">
          <h2 className="mb-2 text-sm font-semibold text-brand-800">Portada</h2>
          <PostCoverManager postId={post.id} coverUrl={post.coverUrl} />
        </aside>
      </div>
    </div>
  );
}
