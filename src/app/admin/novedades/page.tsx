import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { formatPostDate, getAdminPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Novedades",
};

type AdminPost = Awaited<ReturnType<typeof getAdminPosts>>[number];

export default async function AdminPostsPage() {
  const posts = await getAdminPosts();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-brand-900">Novedades</h1>
        <Link
          href="/admin/novedades/nueva"
          className="flex items-center gap-2 rounded-full bg-gold-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gold-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nueva nota
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-brand-200 bg-white p-8 text-center text-sm text-brand-600">
          Todavía no escribiste ninguna nota.
        </p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/admin/novedades/${post.id}`}
                className="flex gap-3 rounded-2xl border border-brand-200 bg-white p-3 transition hover:border-gold-300"
              >
                <Thumb post={post} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug text-brand-900">{post.title}</p>
                  <p className="truncate text-xs text-brand-600">/novedades/{post.slug}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <StatusBadge status={post.status} />
                    <span className="text-brand-600">
                      {post.publishedAt
                        ? `Publicada el ${formatPostDate(post.publishedAt)}`
                        : "Sin publicar"}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Thumb({ post }: { post: AdminPost }) {
  if (!post.coverUrl) {
    return (
      <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[10px] uppercase text-brand-500">
        Sin portada
      </div>
    );
  }

  return (
    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-brand-50">
      <Image
        src={post.coverUrl}
        alt={post.coverAlt ?? ""}
        fill
        sizes="96px"
        className="object-cover"
      />
    </div>
  );
}

function StatusBadge({ status }: { status: AdminPost["status"] }) {
  const published = status === "PUBLISHED";
  return (
    <span
      className={
        published
          ? "rounded-full bg-accent-100 px-2.5 py-1 font-semibold text-accent-700"
          : "rounded-full bg-brand-100 px-2.5 py-1 font-semibold text-brand-700"
      }
    >
      {published ? "Publicada" : "Borrador"}
    </span>
  );
}
