export const reducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const finePointer = (): boolean =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Cursor and particles only run on pointer-fine devices with enough cores.
export const canAffordEffects = (): boolean =>
  finePointer() && !reducedMotion() && (navigator.hardwareConcurrency ?? 2) >= 4;
