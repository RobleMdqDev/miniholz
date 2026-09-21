import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPublishedPosts } from "@/lib/posts";
import { SITE_NAME, socialMetadata } from "@/lib/site";
import { PostCard } from "@/components/post/PostCard";

const TITLE = "Novedades";
const DESCRIPTION = `Notas del taller de ${SITE_NAME}: cómo trabajamos la madera, ideas para el cuarto de los chicos y lo nuevo de la tienda.`;

function canonicalFor(page: number): string {
  // La primera página es `/novedades` a secas: `?pagina=1` sería una segunda URL
  // con exactamente el mismo contenido.
  return page > 1 ? `/novedades?pagina=${page}` : "/novedades";
}

function pageFromParam(value: string | string[] | undefined): number {
  const parsed = Number(typeof value === "string" ? value : 1);
  return Number.isFinite(parsed) && parsed > 1 ? Math.trunc(parsed) : 1;
}

export async function generateMetadata(props: PageProps<"/novedades">): Promise<Metadata> {
  const { pagina } = await props.searchParams;
  const page = pageFromParam(pagina);

  // Cada página de la paginación se canoniza a sí misma: son listas distintas,
  // y mandarlas todas a la primera escondería las notas viejas del índice.
  const title = page > 1 ? `${TITLE} — página ${page}` : TITLE;
  const canonical = canonicalFor(page);

  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical },
    ...socialMetadata({ title, description: DESCRIPTION, url: canonical }),
  };
}

export default async function NovedadesPage(props: PageProps<"/novedades">) {
  const { pagina } = await props.searchParams;
  const { posts, currentPage, totalPages } = await getPublishedPosts(pageFromParam(pagina));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-extrabold text-brand-900">{TITLE}</h1>
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-brand-700">{DESCRIPTION}</p>

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-brand-200 bg-white p-8 text-center text-sm text-brand-600">
          Todavía no publicamos ninguna nota.{" "}
          <Link href="/productos" className="font-bold text-gold-700 hover:underline">
            Mientras tanto, mirá la tienda
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Paginación">
          <PageLink
            href={canonicalFor(currentPage - 1)}
            disabled={currentPage === 1}
            label="Anterior"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Anterior
          </PageLink>

          <p aria-current="page" className="text-sm font-medium text-brand-700">
            Página {currentPage} de {totalPages}
          </p>

          <PageLink
            href={canonicalFor(currentPage + 1)}
            disabled={currentPage === totalPages}
            label="Siguiente"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" aria-hidden />
          </PageLink>
        </nav>
      )}
    </div>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const className =
    "flex items-center gap-1 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 transition hover:border-gold-400 hover:text-gold-700";

  // Un extremo de la paginación se muestra apagado y sin enlace, no como un
  // enlace que lleva a una página vacía.
  if (disabled) {
    return (
      <span aria-disabled className={`${className} pointer-events-none opacity-40`}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  );
}
