"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ROTATION_MS = 4000;

export function TopBar({ messages }: { messages: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, [messages.length]);

  function goTo(delta: number) {
    setIndex((current) => (current + delta + messages.length) % messages.length);
  }

  return (
    <div className="bg-gold-100 text-brand-800">
      <div className="mx-auto flex h-7 max-w-7xl items-center gap-4 px-4 text-xs">
        <div className="hidden gap-3 sm:flex">
          <a href="#" aria-label="Instagram" className="hover:opacity-80">
            IG
          </a>
          <a href="#" aria-label="Facebook" className="hover:opacity-80">
            FB
          </a>
        </div>

        <div className="flex flex-1 items-center justify-center gap-3 overflow-hidden">
          {messages.length > 1 && (
            <button
              type="button"
              onClick={() => goTo(-1)}
              aria-label="Anuncio anterior"
              className="shrink-0 hover:opacity-80"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
          <p className="truncate text-center font-medium">{messages[index]}</p>
          {messages.length > 1 && (
            <button
              type="button"
              onClick={() => goTo(1)}
              aria-label="Siguiente anuncio"
              className="shrink-0 hover:opacity-80"
            >
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>

        <div className="hidden w-12 sm:block" aria-hidden />
      </div>
    </div>
  );
}
