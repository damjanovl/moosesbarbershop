"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { GalleryImage } from "@/lib/gallery-images";
import { Card } from "@/components/ui";

export function PortfolioGallery({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  const n = images.length;
  const open = activeIndex !== null && n > 0;

  const go = useCallback(
    (dir: -1 | 1) => {
      setActiveIndex((i) => {
        if (i === null || n === 0) return i;
        return (i + dir + n) % n;
      });
    },
    [n],
  );

  const close = useCallback(() => setActiveIndex(null), []);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, go]);

  if (n === 0) return null;

  const current = activeIndex !== null ? images[activeIndex] : null;

  return (
    <>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {images.map((p, i) => (
          <Card key={p.filename} className="p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveIndex(i)}
              className="group relative aspect-square w-full cursor-zoom-in text-left outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-card)]"
            >
              <Image
                src={p.src}
                alt={p.label}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition group-hover:opacity-95"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
            </button>
          </Card>
        ))}
      </div>

      {open && current ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/92 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
          onClick={close}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/70"
            aria-label="Close gallery"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>

          <div
            className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative flex w-full max-w-5xl flex-1 items-center justify-center gap-2 md:gap-4"
              onTouchStart={(e) => {
                touchStartX.current = e.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                const start = touchStartX.current;
                touchStartX.current = null;
                if (start === null) return;
                const end = e.changedTouches[0]?.clientX;
                if (end === undefined) return;
                const dx = end - start;
                if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
              }}
            >
              <button
                type="button"
                onClick={() => go(-1)}
                className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/70 md:inline-flex"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden />
              </button>

              <div className="relative aspect-[4/5] w-full max-h-[min(85vh,900px)] min-h-[240px] md:aspect-video md:max-h-[min(82vh,900px)]">
                <Image
                  src={current.src}
                  alt={current.label}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>

              <button
                type="button"
                onClick={() => go(1)}
                className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/70 md:inline-flex"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" aria-hidden />
              </button>
            </div>

            <div className="flex w-full max-w-5xl items-center justify-between gap-4 px-1 md:hidden">
              <button
                type="button"
                onClick={() => go(-1)}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-white"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
                Prev
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-white"
                aria-label="Next image"
              >
                Next
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <p className="max-w-2xl text-center text-sm text-white/80">
              <span className="font-medium text-white">{current.label}</span>
              <span className="ml-2 text-white/45">
                {(activeIndex ?? 0) + 1} / {n}
              </span>
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
