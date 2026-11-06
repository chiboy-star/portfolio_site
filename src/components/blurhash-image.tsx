"use client";

import * as React from "react";
import { decode } from "blurhash";
import { cn } from "@/lib/utils";

interface BlurHashImageProps {
  src: string;
  alt: string;
  blurhash?: string;
  className?: string;
}

export function BlurHashImage({
  src,
  alt,
  blurhash = "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
  className,
}: BlurHashImageProps) {
  const [loaded, setLoaded] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !blurhash) return;

    try {
      const width = 32;
      const height = 20;
      canvas.width = width;
      canvas.height = height;
      const pixels = decode(blurhash, width, height);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const imageData = ctx.createImageData(width, height);
        imageData.data.set(pixels);
        ctx.putImageData(imageData, 0, 0);
      }
    } catch {
      // Ignore blurhash decoding fallback
    }
  }, [blurhash]);

  return (
    <div className={cn("relative overflow-hidden bg-[var(--surface)]", className)}>
      {/* BlurHash placeholder canvas */}
      {!loaded && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover filter blur-xs scale-105"
        />
      )}

      {/* Actual image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}

