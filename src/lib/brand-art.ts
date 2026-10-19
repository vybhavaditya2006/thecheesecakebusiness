// Build-time only: brand artwork as SVG strings, for the share image and the
// favicons. The words come from brand.ts, so a rename needs no new art.
import { brand } from '../content/brand';
import { wordmarkPaths } from './wordmark-paths';

const CREAM = '#F3E7DA';
const WINE = '#7A1F2B';

// Link-preview image, 1200 × 630: the wordmark and tagline on cream at the
// left, and a hairline frame at the right that og.png.ts fills with a real
// photo (PHOTO_BOX, in the same units).
export const PHOTO_BOX = { left: 640, top: 48, width: 512, height: 534 } as const;

export const shareImageSvg = (width: number, height: number): string => {
  const wordmark = wordmarkPaths(brand.name);
  const { left, top, width: wide, height: high } = PHOTO_BOX;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="${CREAM}"/>
    <svg x="64" y="170" width="520" height="190" viewBox="${wordmark.viewBox}" fill="${WINE}">
      <path d="${wordmark.letters.join('')}"/>
    </svg>
    <text x="324" y="420" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="44" fill="${WINE}">${brand.tagline}</text>
    <rect x="${left - 8}" y="${top - 8}" width="${wide + 16}" height="${high + 16}" fill="#FAF5EF" stroke="${WINE}" stroke-opacity="0.35" stroke-width="1.5"/>
  </svg>`;
};

// Icon: the first letter of the wordmark on a cream tile.
export const iconSvg = (size: number): string => {
  const initial = wordmarkPaths(brand.name.slice(0, 1));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="14" fill="${CREAM}"/>
    <svg x="8" y="8" width="48" height="48" viewBox="${initial.viewBox}" fill="${WINE}">
      <path d="${initial.letters.join('')}"/>
    </svg>
  </svg>`;
};
