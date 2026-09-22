"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStoreSettings } from "@/actions/settings.actions";
import { FieldError, FormError, inputClassName, labelClassName } from "@/components/ui/form";

export function StoreSettingsForm({
  settings,
}: {
  settings: {
    whatsappNumber: string;
    bankAccountInfo: string;
    announcementText: string | null;
    menuPromoTitle: string | null;
    menuPromoSubtitle: string | null;
    menuPromoHref: string | null;
  };
}) {
  const router = useRouter();
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [bankAccountInfo, setBankAccountInfo] = useState(settings.bankAccountInfo);
  const [announcementText, setAnnouncementText] = useState(settings.announcementText ?? "");
  const [menuPromoTitle, setMenuPromoTitle] = useState(settings.menuPromoTitle ?? "");
  const [menuPromoSubtitle, setMenuPromoSubtitle] = useState(settings.menuPromoSubtitle ?? "");
  const [menuPromoHref, setMenuPromoHref] = useState(settings.menuPromoHref ?? "");

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      setError(null);
      setMessage(null);
      setFieldErrors({});

      const result = await updateStoreSettings({
        whatsappNumber,
        bankAccountInfo,
        announcementText: announcementText.trim() || null,
        menuPromoTitle: menuPromoTitle.trim() || null,
        menuPromoSubtitle: menuPromoSubtitle.trim() || null,
        menuPromoHref: menuPromoHref.trim() || null,
      });

      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      setMessage(result.message ?? "Guardado.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-brand-200 bg-white p-5">
      <div>
        <label htmlFor="whatsappNumber" className={labelClassName}>
          Número de WhatsApp
        </label>
        <input
          id="whatsappNumber"
          value={whatsappNumber}
          onChange={(event) => setWhatsappNumber(event.target.value)}
          required
          className={inputClassName}
          placeholder="5491122334455"
        />
        <p className="mt-1 text-xs text-brand-600">
          Con código de país y sin símbolos. Es el número al que llegan los pedidos coordinados por
          WhatsApp.
        </p>
        <FieldError messages={fieldErrors.whatsappNumber} />
      </div>

      <div>
        <label htmlFor="bankAccountInfo" className={labelClassName}>
          Datos bancarios
        </label>
        <textarea
          id="bankAccountInfo"
          value={bankAccountInfo}
          onChange={(event) => setBankAccountInfo(event.target.value)}
          rows={5}
          className={inputClassName}
          placeholder={"Titular: …\nCBU: …\nAlias: …\nBanco: …"}
        />
        <p className="mt-1 text-xs text-brand-600">
          Se muestran tal cual al cliente que elige pagar por transferencia.
        </p>
        <FieldError messages={fieldErrors.bankAccountInfo} />
      </div>

      <div>
        <label htmlFor="announcementText" className={labelClassName}>
          Texto del anuncio <span className="font-normal text-brand-600">(opcional)</span>
        </label>
        <input
          id="announcementText"
          value={announcementText}
          onChange={(event) => setAnnouncementText(event.target.value)}
          className={inputClassName}
          maxLength={160}
          placeholder="ENVIAMOS a todo el país — el costo se coordina después de la compra"
        />
        <p className="mt-1 text-xs text-brand-600">
          Es el primer mensaje de la barra rotativa que se ve arriba de todo en la tienda.
        </p>
        <FieldError messages={fieldErrors.announcementText} />
      </div>

      <fieldset className="space-y-4 rounded-xl border border-brand-200 p-4">
        <legend className="px-2 text-sm font-semibold text-brand-800">
          Promo del menú <span className="font-normal text-brand-600">(opcional)</span>
        </legend>
        <p className="text-xs text-brand-600">
          Se muestra destacada dentro del desplegable de “Tienda Online”. Si dejás el título
          vacío, la promo no aparece.
        </p>

        <div>
          <label htmlFor="menuPromoTitle" className={labelClassName}>
            Título
          </label>
          <input
            id="menuPromoTitle"
            value={menuPromoTitle}
            onChange={(event) => setMenuPromoTitle(event.target.value)}
            className={inputClassName}
            maxLength={40}
            placeholder="20% OFF en percheros"
          />
          <FieldError messages={fieldErrors.menuPromoTitle} />
        </div>

        <div>
          <label htmlFor="menuPromoSubtitle" className={labelClassName}>
            Bajada
          </label>
          <input
            id="menuPromoSubtitle"
            value={menuPromoSubtitle}
            onChange={(event) => setMenuPromoSubtitle(event.target.value)}
            className={inputClassName}
            maxLength={80}
            placeholder="Hasta el 30 de septiembre"
          />
          <FieldError messages={fieldErrors.menuPromoSubtitle} />
        </div>

        <div>
          <label htmlFor="menuPromoHref" className={labelClassName}>
            A dónde lleva
          </label>
          <input
            id="menuPromoHref"
            value={menuPromoHref}
            onChange={(event) => setMenuPromoHref(event.target.value)}
            className={inputClassName}
            placeholder="/productos/categoria/percheros"
          />
          <p className="mt-1 text-xs text-brand-600">
            Una ruta del sitio, empezando con “/”. No se aceptan enlaces externos.
          </p>
          <FieldError messages={fieldErrors.menuPromoHref} />
        </div>
      </fieldset>

      <FormError message={error ?? undefined} />
      {message && (
        <p className="rounded-lg bg-brand-100 px-3 py-2 text-sm font-medium text-brand-800">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gold-700 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gold-800 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar configuración"}
      </button>
    </form>
  );
}
