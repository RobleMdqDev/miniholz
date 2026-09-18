"use client";

import { useState } from "react";
import Image from "next/image";

type GalleryImage = { id: string; url: string; alt: string | null };

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  if (!active) {
    return <div className="aspect-square rounded-2xl bg-brand-50" aria-hidden />;
  }

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {images.length > 1 && (
        <ul className="flex gap-3 sm:flex-col">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Ver imagen ${index + 1} de ${images.length}`}
                aria-current={index === activeIndex}
                className={
                  index === activeIndex
                    ? "relative block h-16 w-16 overflow-hidden rounded-xl ring-2 ring-gold-500"
                    : "relative block h-16 w-16 overflow-hidden rounded-xl ring-1 ring-brand-200 transition hover:ring-gold-300"
                }
              >
                <Image
                  src={image.url}
                  alt={image.alt ?? productName}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative aspect-square flex-1 overflow-hidden rounded-2xl bg-brand-50">
        <Image
          src={active.url}
          alt={active.alt ?? productName}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
