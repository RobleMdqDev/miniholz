"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

type NavDropdownItem = { href: string; label: string };

/**
 * Margen para el movimiento en diagonal: salir del botón por un costado y
 * entrar al panel más abajo deja al puntero, por un instante, fuera del
 * disparador. Sin esta demora el panel se cierra en el camino. Es el patrón
 * habitual de los mega-menús, y cubre el caso que la geometría no cubre.
 */
const CLOSE_DELAY_MS = 120;

export function NavDropdown({ label, items }: { label: string; items: NavDropdownItem[] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const closeNow = useCallback(() => {
    cancelClose();
    setOpen(false);
  }, [cancelClose]);

  const closeSoon = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }, [cancelClose]);

  // Un temporizador vivo después de desmontar termina llamando a setState sobre
  // un componente que ya no existe.
  useEffect(() => cancelClose, [cancelClose]);

  useEffect(() => {
    if (!open) return;
    function onPointerDownOutside(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeNow();
      }
    }
    document.addEventListener("pointerdown", onPointerDownOutside);
    return () => document.removeEventListener("pointerdown", onPointerDownOutside);
  }, [open, closeNow]);

  return (
    <div
      ref={containerRef}
      // `py-3 -my-3` estira el disparador hasta el alto completo de la fila del
      // `<nav>`, que es donde arranca el panel (`top-full`). Sin esto queda una
      // franja muerta de 12px —el `py-3` del contenedor de la fila— entre el
      // borde del botón y el del panel: al bajar el mouse se cruza esa franja,
      // el puntero sale del div, se dispara `onMouseLeave` y el panel se cierra
      // antes de que se pueda llegar. El margen negativo compensa el relleno,
      // así que la altura de la barra no cambia.
      className="py-3 -my-3"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={closeSoon}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return;
        closeNow();
        // El foco vuelve al disparador: si quedara dentro de un panel que ya no
        // está, el siguiente tabulador saltaría a un lugar impredecible.
        buttonRef.current?.focus();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        // Alterna, no solo abre. Antes `onClick` solo ponía `true` y `onFocus`
        // también abría: con teclado o touch no había forma de cerrarlo salvo
        // haciendo click afuera. `onFocus` ya no abre a propósito — el foco se
        // dispara antes que el click, así que con un botón que alterna el click
        // lo cerraría de inmediato y nunca se podría abrir con el mouse.
        onClick={() => {
          cancelClose();
          setOpen((wasOpen) => !wasOpen);
        }}
        aria-expanded={open}
        aria-haspopup="true"
        // Solo cuando el panel existe: apuntar a un id ausente es inválido.
        aria-controls={open ? panelId : undefined}
        className="flex items-center gap-1 hover:text-gold-700"
      >
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {/* Panel a todo el ancho de la página, como el mega-menú de referencia.
          Se posiciona contra el `<nav className="relative">` del header y no
          contra este div, que es justamente lo que le permite ocupar todo el
          ancho en vez del ancho del botón. */}
      {open && (
        <div
          id={panelId}
          className="absolute left-1/2 top-full w-screen -translate-x-1/2 border-t border-brand-200 bg-brand-50/95 py-6 text-brand-900 shadow-lg"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-4 px-4 sm:flex sm:flex-wrap sm:gap-x-10">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeNow}
                className="text-sm font-semibold uppercase tracking-[1px] hover:text-gold-700"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
