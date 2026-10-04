"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/**
 * A fill-positioned, GPU-transformed parallax image.
 * The inner layer is rendered 24% taller than its frame so that vertical
 * travel never exposes an edge. Respects prefers-reduced-motion.
 */
export default function ParallaxImage({
  src,
  alt,
  speed = 0.18,
  sizes = "100vw",
  priority = false,
  decorative = false,
  className = "",
  imgClassName = "",
  loading = "lazy",
}: {
  src: string;
  alt: string;
  speed?: number;
  sizes?: string;
  priority?: boolean;
  decorative?: boolean;
  className?: string;
  imgClassName?: string;
  loading?: "lazy" | "eager";
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = outer.getBoundingClientRect();
      const vh =
        window.innerHeight || document.documentElement.clientHeight;
      const progress = (vh - rect.top) / (vh + rect.height);
      const p = Math.max(-0.25, Math.min(1.25, progress));
      const travel = rect.height * speed;
      const y = (0.5 - p) * travel;
      inner.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && queue()),
      { rootMargin: "200px" }
    );
    io.observe(outer);

    return () => {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [speed]);

  return (
    <div
      ref={outerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      aria-hidden={decorative || undefined}
    >
      <div
        ref={innerRef}
        className="absolute -top-[12%] left-0 right-0 h-[124%] will-change-transform"
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : loading}
          className={`object-cover ${imgClassName}`}
        />
      </div>
    </div>
  );
}
