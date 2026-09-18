"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { deleteCategory, saveCategory } from "@/actions/category.actions";
import { slugify } from "@/lib/slug";
import { FormError, inputClassName } from "@/components/ui/form";

type Category = {
  id: string;
  name: string;
  slug: string;
  position: number;
  _count: { products: number };
};

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newSlugTouched, setNewSlugTouched] = useState(false);

  function run(action: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "No se pudo completar la acción.");
        return;
      }
      setMessage(result.message ?? null);
      router.refresh();
    });
  }

  function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(async () => {
      const result = await saveCategory({
        name: newName,
        slug: newSlug || slugify(newName),
        position: categories.length + 1,
      });
      if (result.ok) {
        setNewName("");
        setNewSlug("");
        setNewSlugTouched(false);
      }
      return result;
    });
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-2xl border border-brand-200 bg-white p-5 sm:grid-cols-[2fr_2fr_auto]"
      >
        <div>
          <label htmlFor="newName" className="mb-1 block text-xs font-semibold text-brand-600">
            Nombre
          </label>
          <input
            id="newName"
            value={newName}
            onChange={(event) => {
              setNewName(event.target.value);
              if (!newSlugTouched) setNewSlug(slugify(event.target.value));
            }}
            required
            className={inputClassName}
            placeholder="Mesas y sillas"
          />
        </div>
        <div>
          <label htmlFor="newSlug" className="mb-1 block text-xs font-semibold text-brand-600">
            Slug
          </label>
          <input
            id="newSlug"
            value={newSlug}
            onChange={(event) => {
              setNewSlugTouched(true);
              setNewSlug(event.target.value);
            }}
            required
            className={inputClassName}
            placeholder="mesas-y-sillas"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 rounded-full bg-gold-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gold-800 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Agregar
          </button>
        </div>
      </form>

      <FormError message={error ?? undefined} />
      {message && (
        <p className="rounded-lg bg-brand-100 px-3 py-2 text-sm font-medium text-brand-800">
          {message}
        </p>
      )}

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-brand-200 bg-white p-8 text-center text-sm text-brand-600">
          Todavía no hay categorías.
        </p>
      ) : (
        <ul className="divide-y divide-brand-100 rounded-2xl border border-brand-200 bg-white">
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              pending={pending}
              confirming={confirmingId === category.id}
              onConfirmDelete={() => setConfirmingId(category.id)}
              onCancelDelete={() => setConfirmingId(null)}
              onDelete={() => run(() => deleteCategory(category.id))}
              onSave={(patch) =>
                run(() =>
                  saveCategory({
                    id: category.id,
                    name: patch.name,
                    slug: patch.slug,
                    position: patch.position,
                  }),
                )
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryRow({
  category,
  pending,
  confirming,
  onConfirmDelete,
  onCancelDelete,
  onDelete,
  onSave,
}: {
  category: Category;
  pending: boolean;
  confirming: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
  onSave: (patch: { name: string; slug: string; position: number }) => void;
}) {
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [position, setPosition] = useState(String(category.position));

  const dirty =
    name !== category.name || slug !== category.slug || Number(position) !== category.position;

  return (
    <li className="grid gap-3 p-4 sm:grid-cols-[2fr_2fr_90px_auto] sm:items-end">
      <div>
        <label className="mb-1 block text-xs font-semibold text-brand-600">Nombre</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClassName} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-brand-600">Slug</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClassName} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-brand-600">Orden</label>
        <input
          type="number"
          min="0"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className={inputClassName}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!dirty || pending}
          onClick={() => onSave({ name, slug, position: Number(position) })}
          className="rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:opacity-30"
        >
          Guardar
        </button>

        {confirming ? (
          <>
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="rounded-full bg-danger-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-danger-700 disabled:opacity-50"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={onCancelDelete}
              className="text-xs font-semibold text-brand-600 hover:text-brand-900"
            >
              No
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onConfirmDelete}
            disabled={pending}
            title={
              category._count.products > 0
                ? `${category._count.products} producto(s) en esta categoría`
                : "Borrar categoría"
            }
            className="rounded-lg p-2 text-brand-600 transition hover:bg-danger-50 hover:text-danger-600 disabled:opacity-30"
            aria-label={`Borrar ${category.name}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        )}

        <span className="text-xs text-brand-600">
          {category._count.products} prod.
        </span>
      </div>
    </li>
  );
}
