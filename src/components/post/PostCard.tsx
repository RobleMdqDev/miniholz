import Image from "next/image";
import Link from "next/link";
import type { PostCardData } from "@/lib/posts";
import { formatPostDate } from "@/lib/posts";

export function PostCard({ post }: { post: PostCardData }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-brand-100 bg-white transition hover:shadow-md">
      <Link href={`/novedades/${post.slug}`} className="group block">
        <div className="relative aspect-[16/9] bg-brand-50">
          {post.coverUrl ? (
            <Image
              src={post.coverUrl}
              alt={post.coverAlt ?? ""}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs uppercase tracking-wide text-brand-500">
              MiniHolz
            </div>
          )}
        </div>

        <div className="space-y-2 p-4">
          {post.publishedAt && (
            <p className="text-xs uppercase tracking-wide text-brand-600">
              <time dateTime={post.publishedAt.toISOString()}>
                {formatPostDate(post.publishedAt)}
              </time>
            </p>
          )}
          <h2 className="font-semibold leading-snug text-brand-900 group-hover:text-gold-700">
            {post.title}
          </h2>
          <p className="text-sm leading-relaxed text-brand-600">{post.excerpt}</p>
        </div>
      </Link>
    </article>
  );
}
