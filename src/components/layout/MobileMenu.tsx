"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, ShieldCheck, User, X } from "lucide-react";

type MenuLink = { href: string; label: string };

export function MobileMenu({
  links,
  categories,
  isLoggedIn,
  isAdmin,
  userName,
}: {
  links: MenuLink[];
  categories: MenuLink[];
  isLoggedIn: boolean;
  isAdmin: boolean;
  userName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  // Navegar cierra el menú: en el móvil el panel tapa toda la pantalla.
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    // Evita que la página de atrás siga scrolleando detrás del panel.
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir el menú"
        aria-expanded={open}
        className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-brand-900 transition hover:bg-brand-200 md:hidden"
      >
        <Menu className="h-6 w-6" aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-brand-900/40" onClick={close} aria-hidden />

          <nav
            aria-label="Menú principal"
            className="relative flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-brand-100 px-4 py-3">
              <span className="font-extrabold tracking-wide text-brand-900">Menú</span>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar el menú"
                className="flex h-11 w-11 items-center justify-center rounded-full text-brand-600 transition hover:bg-brand-100"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-3">
              <Link href="/" onClick={close} className={itemClass}>
                Inicio
              </Link>

              <button
                type="button"
                onClick={() => setCategoriesOpen((value) => !value)}
                aria-expanded={categoriesOpen}
                className={`${itemClass} flex w-full items-center justify-between`}
              >
                Tienda Online
                <ChevronDown
                  className={`h-4 w-4 transition ${categoriesOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>

              {categoriesOpen && (
                <div className="mb-1 ml-3 border-l border-brand-200 pl-3">
                  <Link href="/productos" onClick={close} className={subItemClass}>
                    Ver todo
                  </Link>
                  {categories.map((category) => (
                    <Link key={category.href} href={category.href} onClick={close} className={subItemClass}>
                      {category.label}
                    </Link>
                  ))}
                </div>
              )}

              {links.map((link) => (
                <Link key={link.href} href={link.href} onClick={close} className={itemClass}>
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="border-t border-brand-100 px-2 py-3">
              {isAdmin && (
                <Link href="/admin" onClick={close} className={`${itemClass} flex items-center gap-2`}>
                  <ShieldCheck className="h-5 w-5 text-gold-600" aria-hidden />
                  Administración
                </Link>
              )}
              <Link
                href={isLoggedIn ? "/cuenta" : "/login"}
                onClick={close}
                className={`${itemClass} flex items-center gap-2`}
              >
                <User className="h-5 w-5 text-gold-600" aria-hidden />
                {isLoggedIn ? `Mi cuenta${userName ? ` · ${userName}` : ""}` : "Ingresar"}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

// Altura cómoda para el dedo (44px es el mínimo recomendado para táctil).
const itemClass =
  "block rounded-xl px-3 py-3 text-base font-semibold text-brand-900 transition hover:bg-brand-100";

const subItemClass =
  "block rounded-xl px-3 py-2.5 text-sm font-medium text-brand-700 transition hover:bg-brand-100";
