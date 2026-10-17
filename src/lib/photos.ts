import type { ImageMetadata } from 'astro';

// Every photo on the site is a lossless PNG master made from the camera
// originals by scripts/process-photos.mjs. Astro encodes each one once, at
// build time, to AVIF with a WebP fallback, at the widths below. A width
// larger than the master is skipped, so nothing is ever enlarged.

const masters = import.meta.glob<{ default: ImageMetadata }>('../assets/photos/masters/*.png', { eager: true });

// A full-frame photo (or Shlok's cut-out), by file name without the extension.
export const photo = (name: string): ImageMetadata | undefined =>
  masters[`../assets/photos/masters/${name}.png`]?.default;

// Photos of what is sold are encoded at a higher quality than the rest.
const products = /^(bite-|macro-|packs-of-five$|half-and-half$)/;
export const QUALITY = { product: 85, other: 78 } as const;
export const qualityOf = (name: string): number => (products.test(name) ? QUALITY.product : QUALITY.other);

// The browser picks from these by the `sizes` it is given and the screen's
// pixel density, so a 2x screen gets twice the pixels.
export const PHOTO_WIDTHS = [240, 320, 480, 640, 800, 1000, 1200, 1600, 2000];
export const CUTOUT_WIDTHS = [96, 160, 240, 320, 480, 640, 800, 1000, 1200];
