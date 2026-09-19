import type { Options } from 'canvas-confetti';

/**
 * Lanza confeti cargando la librería solo cuando se necesita
 * (así no forma parte del JavaScript inicial de la página).
 */
export function fireConfetti(options?: Options): void {
  import('canvas-confetti')
    .then(mod => { mod.default(options); })
    .catch(() => { /* no es crítico */ });
}
