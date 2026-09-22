"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";
import { inputClassName, labelClassName } from "@/components/ui/form";

const SUBJECTS = [
  { value: "consulta", label: "Una consulta" },
  { value: "pedido", label: "Mi pedido" },
  { value: "personalizado", label: "Un pedido especial" },
  { value: "arrepentimiento", label: "Arrepentimiento de compra" },
] as const;

type Subject = (typeof SUBJECTS)[number]["value"];

/**
 * El formulario arma el mensaje y lo abre en WhatsApp: no lo manda por mail.
 *
 * Es una decisión deliberada. Un formulario que envía correo necesita un
 * proveedor de mail configurado, y sin eso lo único que se puede construir es
 * un formulario que traga los mensajes en silencio — bastante peor que no
 * tenerlo. Así el mensaje sale de verdad, y el visitante ve que salió.
 */
export function ContactForm({
  whatsappNumber,
  defaultSubject,
}: {
  whatsappNumber: string;
  defaultSubject?: Subject;
}) {
  const [subject, setSubject] = useState<Subject>(defaultSubject ?? "consulta");
  const [name, setName] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");

  const needsOrder = subject === "pedido" || subject === "arrepentimiento";

  const intro =
    subject === "arrepentimiento"
      ? "Quiero ejercer el derecho de arrepentimiento de mi compra."
      : subject === "pedido"
        ? "Tengo una consulta sobre mi pedido."
        : subject === "personalizado"
          ? "Quiero consultar por un pedido especial."
          : "Tengo una consulta.";

  const text = [
    `¡Hola! ${intro}`,
    "",
    name.trim() && `Mi nombre: ${name.trim()}`,
    needsOrder && orderNumber.trim() && `Pedido n.º ${orderNumber.trim()}`,
    message.trim(),
  ]
    .filter(Boolean)
    .join("\n");

  const href = `https://wa.me/${normalizeWhatsAppNumber(whatsappNumber)}?text=${encodeURIComponent(text)}`;
  const ready = message.trim().length > 0;

  return (
    <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
      <fieldset>
        <legend className={labelClassName}>¿Sobre qué querés escribirnos?</legend>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((option) => (
            <label
              key={option.value}
              className={
                subject === option.value
                  ? "cursor-pointer rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white"
                  : "cursor-pointer rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 transition hover:border-gold-400"
              }
            >
              <input
                type="radio"
                name="subject"
                className="sr-only"
                checked={subject === option.value}
                onChange={() => setSubject(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="contact-name" className={labelClassName}>
          Tu nombre
        </label>
        <input
          id="contact-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClassName}
        />
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
          className={inputClassName}
        />
      </div>

      <a
        href={ready ? href : undefined}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={!ready}
        className={
          ready
            ? "flex w-full items-center justify-center gap-2 rounded-full bg-gold-700 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gold-800"
            : "flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-gold-700 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white opacity-60"
        }
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        Enviar por WhatsApp
      </a>

      <p className="text-xs text-brand-600">
        Se abre WhatsApp con el mensaje ya escrito. Podés revisarlo y editarlo antes de enviarlo.
      </p>
    </form>
  );
}
