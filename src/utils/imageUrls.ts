/**
 * Miniaturas: las fotos de productos subidas con la subida directa se guardan en dos tamaños:
 *   .../products/<id>-t.webp      (1000 px, para el detalle)
 *   .../products/<id>-t_400.webp  (400 px, para tarjetas y listas: ~4 veces más liviana)
 * El "-t" en el nombre indica que existe la miniatura. Las fotos antiguas se usan tal cual.
 */
const THUMB_RE = /(\/products\/[0-9a-f]{32}-t)\.(webp|jpg|png)$/i;

export function thumbUrl(url?: string | null): string | undefined {
  if (!url) return url ?? undefined;
  return THUMB_RE.test(url) ? url.replace(THUMB_RE, '$1_400.webp') : url;
}

/** Si la miniatura fallara (caso raro), vuelve a la imagen original una sola vez. */
export function fallbackToOriginal(original?: string | null) {
  return (e: { currentTarget: HTMLImageElement }) => {
    const img = e.currentTarget;
    if (original && img.dataset.fallback !== '1' && img.src !== original && !img.src.endsWith(original)) {
      img.dataset.fallback = '1';
      img.src = original;
    }
  };
}
