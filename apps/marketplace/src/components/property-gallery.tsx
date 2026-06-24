"use client";

import type { PublicPropertyImage } from "@propai/shared";
import { useState } from "react";

export function PropertyGallery({
  images,
  title,
  typeLabel,
}: {
  images: PublicPropertyImage[];
  title: string;
  typeLabel: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="rounded-card from-muted to-card flex aspect-[16/10] items-center justify-center bg-gradient-to-br">
        <span className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
          {typeLabel}
        </span>
      </div>
    );
  }

  const current = images[active] ?? images[0]!;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-card overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={`${title} — photo ${active + 1}`}
          className="aspect-[16/10] w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.slice(0, 5).map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === active}
              className={`overflow-hidden rounded-lg border-2 transition-colors ${
                i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`${title} thumbnail ${i + 1}`}
                className="aspect-square w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
