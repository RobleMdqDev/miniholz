"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost, deletePost, updatePost } from "@/actions/post.actions";
import { slugify, slugifyWhileTyping } from "@/lib/slug";
import type { AdminPostDetail } from "@/lib/posts";
import type { PostInput } from "@/lib/validations/post";
import {
  FieldError,
  FormError,
  SubmitButton,
  inputClassName,
  labelClassName,
} from "@/components/ui/form";

type FieldErrors = Record<string, string[]>;

export function PostForm({ post }: { post?: AdminPostDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [coverAlt, setCoverAlt] = useState(post?.coverAlt ?? "");
  const [status, setStatus] = useState<PostInput["status"]>(post?.status ?? "DRAFT");

  // El slug se sigue al título mientras nadie lo toque a mano. En una nota ya
  // creada arranca bloqueado: cambiarlo rompe la url que quizá ya se compartió,
  // así que tiene que ser una decisión explícita.
  const [slugLocked, setSlugLocked] = useState(Boolean(post));

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugLocked) setSlug(slugify(value));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const input: PostInput = {
      title,
      slug,
      excerpt,
      body,
      // La portada no se edita acá: se sube desde la nota ya creada.
      coverUrl: post?.coverUrl ?? null,
      coverAlt: coverAlt.trim() || null,
      status,
    };

    startTransition(async () => {
      const result = post ? await updatePost(post.id, input) : await createPost(input);

      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      if (post) {
        router.refresh();
      } else {
        router.push(`/admin/novedades/${result.postId}`);
      }
    });
  }

  function onDelete() {
    if (!post) return;
    startTransition(async () => {
      const result = await deletePost(post.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/novedades");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormError message={error ?? undefined} />

      <div>
        <label htmlFor="title" className={labelClassName}>
          Título
        </label>
        <input
          id="title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          aria-invalid={Boolean(fieldErrors.title)}
          className={inputClassName}
        />
        <FieldError messages={fieldErrors.title} />
      </div>

      <div>
        <label htmlFor="slug" className={labelClassName}>
          Slug
        </label>
        <div className="flex items-center gap-2">
          <input
            id="slug"
            value={slug}
            readOnly={slugLocked}
            onChange={(event) => setSlug(slugifyWhileTyping(event.target.value))}
            onBlur={() => setSlug(slugify(slug))}
            aria-invalid={Boolean(fieldErrors.slug)}
            className={`${inputClassName} ${slugLocked ? "bg-brand-50 text-brand-600" : ""}`}
          />
          {post && (
            <button
              type="button"
              onClick={() => setSlugLocked((locked) => !locked)}
              className="shrink-0 rounded-full border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:border-gold-400"
            >
              {slugLocked ? "Editar" : "Bloquear"}
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-brand-600">/novedades/{slug || "…"}</p>
        <FieldError messages={fieldErrors.slug} />
      </div>

      <div>
        <label htmlFor="excerpt" className={labelClassName}>
          Bajada
        </label>
        <textarea
          id="excerpt"
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          rows={2}
          maxLength={200}
          aria-invalid={Boolean(fieldErrors.excerpt)}
          className={inputClassName}
        />
        <p className="mt-1 text-xs text-brand-600">
          Se ve en el listado y es la descripción que sale en Google. {excerpt.trim().length}/200
        </p>
        <FieldError messages={fieldErrors.excerpt} />
      </div>

      <div>
        <label htmlFor="body" className={labelClassName}>
          Cuerpo
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={18}
          aria-invalid={Boolean(fieldErrors.body)}
          className={`${inputClassName} font-mono text-sm`}
        />
        <p className="mt-1 text-xs text-brand-600">
          Se escribe en Markdown: <code>## Subtítulo</code>, <code>**negrita**</code>,{" "}
          <code>*cursiva*</code>, <code>- viñeta</code>, <code>[texto](/ruta)</code>.
        </p>
        <FieldError messages={fieldErrors.body} />
      </div>

      <div>
        <label htmlFor="coverAlt" className={labelClassName}>
          Texto alternativo de la portada
        </label>
        <input
          id="coverAlt"
          value={coverAlt}
          onChange={(event) => setCoverAlt(event.target.value)}
          placeholder="Qué se ve en la foto"
          className={inputClassName}
        />
        <p className="mt-1 text-xs text-brand-600">
          Lo lee quien navega con lector de pantalla, y lo usan los buscadores.
        </p>
      </div>

      <fieldset>
        <legend className={labelClassName}>Estado</legend>
        <div className="flex flex-wrap gap-2">
          {(["DRAFT", "PUBLISHED"] as const).map((value) => (
            <label
              key={value}
              className={
                status === value
                  ? "cursor-pointer rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white"
                  : "cursor-pointer rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700"
              }
            >
              <input
                type="radio"
                name="status"
                className="sr-only"
                checked={status === value}
                onChange={() => setStatus(value)}
              />
              {value === "DRAFT" ? "Borrador" : "Publicada"}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-brand-600">
          Un borrador no aparece en la tienda ni en el sitemap. La fecha de publicación se sella la
          primera vez que se publica y no vuelve a cambiar.
        </p>
      </fieldset>

      <SubmitButton pending={pending} pendingLabel="Guardando…">
        {post ? "Guardar cambios" : "Crear nota"}
      </SubmitButton>

      {post && (
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="w-full rounded-full border border-danger-200 px-4 py-3 text-sm font-semibold text-danger-700 transition hover:bg-danger-50 disabled:opacity-60"
        >
          Eliminar nota
        </button>
      )}
    </form>
  );
}
