"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  gradient: string;
};

const SLIDES: Slide[] = [
  {
    id: "mesas-personalizadas",
    eyebrow: "Hecho a mano",
    title: "Mesas y sillas con el nombre de tu bebé",
    description: "Diseños de madera personalizados, en los colores que elijas.",
    ctaLabel: "Ver mesas y sillas",
    ctaHref: "/productos/categoria/mesas-y-sillas",
    gradient: "from-brand-200 to-brand-400",
  },
  {
    id: "envios",
    eyebrow: "Beneficio",
    title: "Enviamos a todo el país",
    description: "Coordinamos el envío con vos después de la compra.",
    ctaLabel: "Conocer más",
    ctaHref: "/como-comprar",
    gradient: "from-accent-200 to-accent-400",
  },
  {
    id: "grabado-sin-cargo",
    eyebrow: "Personalización",
    title: "Grabado de nombre sin cargo",
    description: "Cada pieza se graba a medida para que sea única.",
    ctaLabel: "Ver catálogo",
    ctaHref: "/productos",
    gradient: "from-gold-200 to-gold-400",
  },
];

export function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <section className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {SLIDES.map((slide) => (
            <div
              key={slide.id}
              className={`relative min-w-0 flex-[0_0_100%] bg-gradient-to-br ${slide.gradient} h-[400px] sm:h-[440px] lg:h-[500px]`}
            >
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-white/40" />
                <div className="absolute -right-8 bottom-0 h-56 w-56 rounded-full bg-white/30" />
                <div className="absolute right-1/4 top-8 h-16 w-16 rounded-full bg-white/30" />
              </div>

              <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-6 sm:px-10">
                <p className="mb-2 text-sm font-bold uppercase tracking-wide text-brand-800/80">
                  {slide.eyebrow}
                </p>
                <h2 className="max-w-lg text-3xl font-extrabold text-brand-900 sm:text-4xl lg:text-5xl">
                  {slide.title}
                </h2>
                <p className="mt-4 max-w-md text-brand-800">{slide.description}</p>
                <Link
                  href={slide.ctaHref}
                  className="mt-6 inline-block w-fit rounded-full bg-brand-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-800"
                >
                  {slide.ctaLabel}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={scrollPrev}
        aria-label="Diapositiva anterior"
        className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-brand-700 transition hover:bg-white sm:left-6 sm:flex"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={scrollNext}
        aria-label="Siguiente diapositiva"
        className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-brand-700 transition hover:bg-white sm:right-6 sm:flex"
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>

      <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`Ir a la diapositiva ${i + 1}`}
            aria-current={i === selectedIndex}
            className="flex h-11 w-7 items-center justify-center"
          >
            <span
              className={`h-2.5 rounded-full transition-all ${
                i === selectedIndex ? "w-6 bg-brand-900" : "w-2.5 bg-brand-900/30"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
