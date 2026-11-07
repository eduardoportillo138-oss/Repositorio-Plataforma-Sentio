'use client';

import { decode } from 'blurhash';
import { useEffect, useRef, useState } from 'react';

const PLACEHOLDER_SIZE = 32;

export interface BlurhashImageProps {
  src: string;
  blurhash: string;
  alt: string;
  size: number;
  /** Para variantes de mayor densidad (pantallas retina). */
  srcSet?: string;
}

/**
 * Imagen con marcador blurhash: el hash se pinta en un <canvas> de 32×32 escalado mientras
 * la foto carga, y la foto aparece encima con un fundido.
 */
export function BlurhashImage({ src, blurhash, alt, size, srcSet }: BlurhashImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  // Se guarda qué URL cargó (no un booleano) para que cambiar `src` vuelva a mostrar el marcador
  // sin un efecto que lo reinicie después de un onLoad inmediato (imágenes en caché).
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loaded = loadedSrc === src;

  // Si la imagen ya estaba completa al montar (caché), onLoad pudo dispararse antes de hidratar.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setLoadedSrc(src);
  }, [src]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    try {
      const pixels = decode(blurhash, PLACEHOLDER_SIZE, PLACEHOLDER_SIZE);
      const image = ctx.createImageData(PLACEHOLDER_SIZE, PLACEHOLDER_SIZE);
      image.data.set(pixels);
      ctx.putImageData(image, 0, 0);
    } catch {
      // Hash inválido: se queda el color de fondo del avatar.
    }
  }, [blurhash]);

  const fill = { position: 'absolute', inset: 0, width: '100%', height: '100%' } as const;
  return (
    <span style={{ position: 'relative', display: 'block', width: size, height: size }}>
      <canvas
        ref={canvasRef}
        width={PLACEHOLDER_SIZE}
        height={PLACEHOLDER_SIZE}
        aria-hidden
        style={fill}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- imagen externa ya optimizada (WebP) */}
      <img
        ref={imgRef}
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? `${size}px` : undefined}
        alt={alt}
        width={size}
        height={size}
        decoding="async"
        onLoad={() => setLoadedSrc(src)}
        style={{
          ...fill,
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 200ms ease-out',
        }}
      />
    </span>
  );
}
