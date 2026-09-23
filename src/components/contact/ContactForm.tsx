"use client";

import { useState, useTransition } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { sendContactForm } from "@/actions/contact.actions";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";
import {
  CONTACT_SUBJECT_LABELS,
  contactSubjectSchema,
  type ContactSubject,
} from "@/lib/validations/contact";
import { FieldError, FormError, inputClassName, labelClassName } from "@/components/ui/form";

const SUBJECTS = contactSubjectSchema.options;

/**
 * El formulario de contacto, con dos salidas para el mismo mensaje.
 *
 * **WhatsApp** abre la conversación con el texto ya escrito; es inmediato y es
 * donde la tienda realmente atiende. **Por mail** manda la consulta a la casilla
 * interna a través de Resend, para quien está en una computadora o prefiere
 * dejarlo por escrito.
 *
 * Los dos caminos existen a propósito: el de WhatsApp no depende de que el
 * correo esté configurado, así que el formulario nunca queda inservible.
 */
export function ContactForm({
  whatsappNumber,
  defaultSubject,
}: {
  whatsappNumber: string;
  defaultSubject?: ContactSubject;
}) {
  const [subject, setSubject] = useState<ContactSubject>(defaultSubject ?? "consulta");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const needsOrder = subject === "pedido" || subject === "arrepentimiento";

  const intro =
    subject === "arrepentimiento"
      ? "Quiero ejercer el derecho de arrepentimiento de mi compra."
      : subject === "pedido"
        ? "Tengo una consulta sobre mi pedido."
        : subject === "personalizado"
          ? "Quiero consultar por un pedido especial."
          : "Tengo una consulta.";

  const whatsappText = [
    `¡Hola! ${intro}`,
    "",
    name.trim() && `Mi nombre: ${name.trim()}`,
    needsOrder && orderNumber.trim() && `Pedido n.º ${orderNumber.trim()}`,
    message.trim(),
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappHref = `https://wa.me/${normalizeWhatsAppNumber(whatsappNumber)}?text=${encodeURIComponent(whatsappText)}`;
  const hasMessage = message.trim().length > 0;

  function onSendEmail() {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await sendContactForm({
        subject,
        name,
        email,
        orderNumber: orderNumber.trim() || undefined,
        message,
      });
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <p className="rounded-2xl border border-accent-200 bg-accent-50 p-5 text-sm text-accent-800">
        <strong className="font-bold">Recibimos tu mensaje.</strong> Te respondemos a{" "}
        {email || "tu correo"} lo antes posible. Si es urgente, escribinos por WhatsApp.
      </p>
    );
  }

  return (
    <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
      <fieldset>
        <legend className={labelClassName}>¿Sobre qué querés escribirnos?</legend>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((option) => (
            <label
              key={option}
              className={
                subject === option
                  ? "cursor-pointer rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white"
                  : "cursor-pointer rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 transition hover:border-gold-400"
              }
            >
              <input
                type="radio"
                name="subject"
                className="sr-only"
                checked={subject === option}
                onChange={() => setSubject(option)}
              />
              {CONTACT_SUBJECT_LABELS[option]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={labelClassName}>
            Tu nombre
          </label>
          <input
            id="contact-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            className={inputClassName}
          />
          <FieldError messages={fieldErrors.name} />
        </div>

        <div>
          <label htmlFor="contact-email" className={labelClassName}>
            Tu email
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            className={inputClassName}
          />
          <FieldError messages={fieldErrors.email} />
        </div>
      </div>

      {needsOrder && (
        <div>
          <label htmlFor="contact-order" className={labelClassName}>
            Número de pedido
          </label>
          <input
            id="contact-order"
            inputMode="numeric"
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            placeholder="Por ejemplo: 128"
            className={inputClassName}
          />
        </div>
      )}

      <div>
        <label htmlFor="contact-message" className={labelClassName}>
          Tu mensaje
        </label>
        <textarea
          id="contact-message"
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-invalid={Boolean(fieldErrors.message)}
          className={inputClassName}
        />
        <FieldError messages={fieldErrors.message} />
      </div>

      <FormError message={error ?? undefined} />

      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={hasMessage ? whatsappHref : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!hasMessage}
          className={
            hasMessage
              ? "flex items-center justify-center gap-2 rounded-full bg-gold-700 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gold-800"
              : "flex cursor-not-allowed items-center justify-center gap-2 rounded-full bg-gold-700 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white opacity-60"
          }
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          Por WhatsApp
        </a>

        <button
          type="button"
          onClick={onSendEmail}
          disabled={pending}
          className="flex items-center justify-center gap-2 rounded-full border border-brand-300 px-4 py-3 text-sm font-bold uppercase tracking-wide text-brand-800 transition hover:border-gold-500 disabled:opacity-60"
        >
          <Mail className="h-4 w-4" aria-hidden />
          {pending ? "Enviando…" : "Por mail"}
        </button>
      </div>

      <p className="text-xs text-brand-600">
        Por WhatsApp se abre la conversación con el mensaje ya escrito y podés revisarlo antes de
        enviarlo. Por mail nos llega directo y te respondemos a la dirección que dejaste.
      </p>
    </form>
  );
}
