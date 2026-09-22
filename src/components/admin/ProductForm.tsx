"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { createProduct, deleteProduct, updateProduct } from "@/actions/product.actions";
import { centsToPesos } from "@/lib/pricing";
import { slugify, slugifyWhileTyping } from "@/lib/slug";
import type { ProductInput } from "@/lib/validations/product";
import { FieldError, FormError, inputClassName, labelClassName } from "@/components/ui/form";

type VariantRow = {
  id?: string;
  name: string;
  sku: string;
  priceInPesos: string;
  stock: string;
  /** Las variantes ya vendidas no se pueden borrar sin romper el historial. */
  locked: boolean;
};

export type ProductFormData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  compareAtPrice: number | null;
  isActive: boolean;
  categoryId: string | null;
  personalizationLabel: string | null;
  personalizationMaxLength: number | null;
  personalizationRequired: boolean;
  variants: { id: string; name: string; sku: string | null; priceOverride: number | null; stock: number; orderItemCount: number }[];
};

const EMPTY_VARIANT: VariantRow = { name: "", sku: "", priceInPesos: "", stock: "0", locked: false };

export function ProductForm({
  categories,
  product,
}: {
  categories: { id: string; name: string }[];
  product?: ProductFormData;
}) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [basePrice, setBasePrice] = useState(
    product ? String(centsToPesos(product.basePrice)) : "",
  );
  const [compareAtPrice, setCompareAtPrice] = useState(
    product?.compareAtPrice ? String(centsToPesos(product.compareAtPrice)) : "",
  );
  const [isActive, setIsActive] = useState(product?.isActive ?? true);

  const [personalizationLabel, setPersonalizationLabel] = useState(
    product?.personalizationLabel ?? "",
  );
  const [personalizationMaxLength, setPersonalizationMaxLength] = useState(
    product?.personalizationMaxLength ? String(product.personalizationMaxLength) : "12",
  );
  const [personalizationRequired, setPersonalizationRequired] = useState(
    product?.personalizationRequired ?? false,
  );

  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku ?? "",
      priceInPesos: variant.priceOverride ? String(centsToPesos(variant.priceOverride)) : "",
      stock: String(variant.stock),
      locked: variant.orderItemCount > 0,
    })) ?? [{ ...EMPTY_VARIANT, name: "Único" }],
  );

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function buildInput(): ProductInput {
    const toNumberOrNull = (value: string) => (value.trim() === "" ? null : Number(value));

    return {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      categoryId: categoryId || null,
      basePriceInPesos: Number(basePrice),
      compareAtPriceInPesos: toNumberOrNull(compareAtPrice),
      isActive,
      personalizationLabel: personalizationLabel.trim() || null,
      personalizationMaxLength: personalizationLabel.trim()
        ? Number(personalizationMaxLength)
        : null,
      personalizationRequired: personalizationLabel.trim() ? personalizationRequired : false,
      variants: variants.map((variant) => ({
        id: variant.id,
        name: variant.name.trim(),
        sku: variant.sku.trim() || undefined,
        priceInPesos: toNumberOrNull(variant.priceInPesos),
        stock: Number(variant.stock || 0),
      })),
    };
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      setError(null);
      setFieldErrors({});

      const input = buildInput();
      const result = product
        ? await updateProduct(product.id, input)
        : await createProduct(input);

      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      if (product) router.refresh();
      else router.push(`/admin/productos/${result.productId}`);
    });
  }

  function onDelete() {
    if (!product) return;
    startTransition(async () => {
      setError(null);
      const result = await deleteProduct(product.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/productos");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-brand-200 bg-white p-5">
        <h2 className="font-bold text-brand-900">Datos del producto</h2>

        <div>
          <label htmlFor="name" className={labelClassName}>
            Nombre
          </label>
          <input
            id="name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            required
            className={inputClassName}
            placeholder="Mesa y silla infantil personalizada"
          />
          <FieldError messages={fieldErrors.name} />
        </div>

        <div>
          <label htmlFor="slug" className={labelClassName}>
            Slug <span className="font-normal text-brand-600">(la dirección en la tienda)</span>
          </label>
          <input
            id="slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugifyWhileTyping(event.target.value));
            }}
            // Al salir del campo se normaliza: es el momento en que un guion
            // final ya no es "algo que se está escribiendo" sino un error.
            onBlur={() => setSlug(slugify(slug))}
            required
            className={inputClassName}
            placeholder="mesa-y-silla-personalizada"
          />
          <p className="mt-1 text-xs text-brand-600">/productos/{slug || "…"}</p>
          <FieldError messages={fieldErrors.slug} />
        </div>

        <div>
          <label htmlFor="description" className={labelClassName}>
            Descripción
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            rows={5}
            className={inputClassName}
          />
          <FieldError messages={fieldErrors.description} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="categoryId" className={labelClassName}>
              Categoría
            </label>
            <select
              id="categoryId"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className={inputClassName}
            >
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="basePrice" className={labelClassName}>
              Precio (pesos)
            </label>
            <input
              id="basePrice"
              type="number"
              min="0"
              step="0.01"
              value={basePrice}
              onChange={(event) => setBasePrice(event.target.value)}
              required
              className={inputClassName}
              placeholder="48900"
            />
            <FieldError messages={fieldErrors.basePriceInPesos} />
          </div>

          <div>
            <label htmlFor="compareAtPrice" className={labelClassName}>
              Precio tachado <span className="font-normal text-brand-600">(opcional)</span>
            </label>
            <input
              id="compareAtPrice"
              type="number"
              min="0"
              step="0.01"
              value={compareAtPrice}
              onChange={(event) => setCompareAtPrice(event.target.value)}
              className={inputClassName}
              placeholder="61000"
            />
            <FieldError messages={fieldErrors.compareAtPriceInPesos} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-brand-800">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="accent-gold-600"
          />
          Publicado en la tienda
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-brand-200 bg-white p-5">
        <div>
          <h2 className="font-bold text-brand-900">Opciones y stock</h2>
          <p className="text-xs text-brand-600">
            Si el producto no tiene variantes, dejá una sola opción: la tienda no muestra el
            selector. El precio de cada opción es opcional; si está vacío usa el precio general.
          </p>
        </div>

        <FieldError messages={fieldErrors.variants} />

        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div
              key={variant.id ?? `nueva-${index}`}
              className="grid gap-3 rounded-xl border border-brand-100 p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
            >
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-600">Opción</label>
                <input
                  value={variant.name}
                  onChange={(event) => updateVariant(index, { name: event.target.value })}
                  required
                  className={inputClassName}
                  placeholder="Natural"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-600">SKU</label>
                <input
                  value={variant.sku}
                  onChange={(event) => updateVariant(index, { sku: event.target.value })}
                  className={inputClassName}
                  placeholder="opcional"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-600">Precio</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={variant.priceInPesos}
                  onChange={(event) => updateVariant(index, { priceInPesos: event.target.value })}
                  className={inputClassName}
                  placeholder="general"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-600">Stock</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={variant.stock}
                  onChange={(event) => updateVariant(index, { stock: event.target.value })}
                  required
                  className={inputClassName}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={variants.length === 1 || variant.locked}
                  title={
                    variant.locked
                      ? "Esta opción ya se vendió: poné su stock en 0 para dejar de ofrecerla"
                      : undefined
                  }
                  onClick={() => setVariants((rows) => rows.filter((_, i) => i !== index))}
                  className="rounded-lg p-2 text-brand-600 transition hover:bg-danger-50 hover:text-danger-600 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Quitar opción"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setVariants((rows) => [...rows, { ...EMPTY_VARIANT }])}
          className="flex items-center gap-2 rounded-full border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-800 transition hover:border-gold-400 hover:text-gold-700"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Agregar opción
        </button>
      </section>

      <section className="space-y-4 rounded-2xl border border-brand-200 bg-white p-5">
        <div>
          <h2 className="font-bold text-brand-900">Personalización</h2>
          <p className="text-xs text-brand-600">
            Dejá la etiqueta vacía si el producto no se personaliza.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="personalizationLabel" className={labelClassName}>
              Etiqueta del campo
            </label>
            <input
              id="personalizationLabel"
              value={personalizationLabel}
              onChange={(event) => setPersonalizationLabel(event.target.value)}
              className={inputClassName}
              placeholder="Nombre a grabar"
            />
            <FieldError messages={fieldErrors.personalizationLabel} />
          </div>
          <div>
            <label htmlFor="personalizationMaxLength" className={labelClassName}>
              Máximo de caracteres
            </label>
            <input
              id="personalizationMaxLength"
              type="number"
              min="1"
              max="200"
              value={personalizationMaxLength}
              onChange={(event) => setPersonalizationMaxLength(event.target.value)}
              disabled={!personalizationLabel.trim()}
              className={inputClassName}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-brand-800">
          <input
            type="checkbox"
            checked={personalizationRequired}
            disabled={!personalizationLabel.trim()}
            onChange={(event) => setPersonalizationRequired(event.target.checked)}
            className="accent-gold-600"
          />
          Es obligatorio completarlo para comprar
        </label>
      </section>

      <FormError message={error ?? undefined} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gold-700 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gold-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear producto"}
        </button>

        <Link
          href="/admin/productos"
          className="text-sm font-semibold text-brand-600 hover:text-gold-700"
        >
          Volver al listado
        </Link>

        {product && (
          <span className="ml-auto flex items-center gap-3">
            {confirmingDelete ? (
              <>
                <span className="text-sm text-brand-700">¿Borrar este producto?</span>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={pending}
                  className="rounded-full bg-danger-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-danger-700 disabled:opacity-50"
                >
                  Sí, borrar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="text-sm font-semibold text-brand-600 hover:text-brand-900"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                disabled={pending}
                className="text-sm font-semibold text-danger-700 hover:underline disabled:opacity-50"
              >
                Borrar producto
              </button>
            )}
          </span>
        )}
      </div>

      {!isEdit && (
        <p className="text-xs text-brand-600">
          Después de crearlo vas a poder subirle las imágenes.
        </p>
      )}
    </form>
  );
}
