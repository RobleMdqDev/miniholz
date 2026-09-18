"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

type NavDropdownItem = { href: string; label: string };

export function NavDropdown({ label, items }: { label: string; items: NavDropdownItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        aria-expanded={open}
        className="flex items-center gap-1 hover:text-gold-700"
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </button>

      {/* Panel a todo el ancho de la página, como el mega-menú de referencia. */}
      {open && (
        <div className="absolute left-1/2 top-full w-screen -translate-x-1/2 border-t border-brand-200 bg-brand-50/95 py-6 text-brand-900 shadow-lg">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-4 px-4 sm:flex sm:flex-wrap sm:gap-x-10">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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
