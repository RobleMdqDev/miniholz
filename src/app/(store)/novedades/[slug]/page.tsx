import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPostDate, getPublishedPostBySlug, getPublishedPostRoutes } from "@/lib/posts";
import { socialMetadata } from "@/lib/site";
import { blogPostingJsonLd, breadcrumbJsonLd } from "@/lib/json-ld";
import { JsonLd } from "@/components/seo/JsonLd";
import { PostBody } from "@/components/post/PostBody";

export async function generateStaticParams() {
  const posts = await getPublishedPostRoutes();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps<"/novedades/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPublishedPostBySlug(slug);
  // Un borrador o un slug inexistente terminan en 404: que no se indexen.
  if (!post) return { title: "Nota no encontrada", robots: { index: false } };

  const canonical = `/novedades/${post.slug}`;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical },
    ...socialMetadata({
      title: post.title,
      description: post.excerpt,
      url: canonical,
      ...(post.coverUrl ? { image: { url: post.coverUrl, alt: post.coverAlt } } : {}),
    }),
  };
}

export default async function PostPage(props: PageProps<"/novedades/[slug]">) {
  const { slug } = await props.params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd data={blogPostingJsonLd(post)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Novedades", path: "/novedades" },
          { name: post.title, path: `/novedades/${post.slug}` },
        ])}
      />

      <nav className="mb-4 text-xs text-brand-600" aria-label="Migas de pan">
        <Link href="/novedades" className="hover:text-gold-700">
          Novedades
        </Link>
        {" / "}
        <span className="text-brand-900">{post.title}</span>
      </nav>

      <article>
        <header className="mb-6">
          {post.publishedAt && (
            <p className="mb-2 text-xs uppercase tracking-wide text-brand-600">
              <time dateTime={post.publishedAt.toISOString()}>
                {formatPostDate(post.publishedAt)}
              </time>
            </p>
          )}
          <h1 className="mb-3 text-2xl font-extrabold leading-tight text-brand-900 sm:text-3xl">
            {post.title}
          </h1>
          <p className="text-base leading-relaxed text-brand-600">{post.excerpt}</p>
        </header>

        {post.coverUrl && (
          <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-2xl bg-brand-50">
            <Image
              src={post.coverUrl}
              alt={post.coverAlt ?? ""}
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              // Es el elemento más grande sobre el pliegue: sin `priority`
              // arrastra la métrica de carga de toda la nota.
              priority
              className="object-cover"
            />
          </div>
        )}

        <PostBody>{post.body}</PostBody>
      </article>

      <p className="mt-10 border-t border-brand-100 pt-6 text-sm">
        <Link href="/novedades" className="font-bold text-gold-700 hover:underline">
          ← Volver a Novedades
        </Link>
      </p>
    </div>
  );
}
