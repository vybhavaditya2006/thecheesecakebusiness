// Build-time only: brand artwork as SVG strings, for the share image and the
// favicons. Everything is drawn from brand.ts, so a rename needs no new art.
import { brand } from '../content/brand';
import { flavours } from '../content/flavours';
import { wordmarkPaths } from './wordmark-paths';

const CREAM = '#F3E7DA';
const WINE = '#7A1F2B';

// The bow, in its own 120 × 62 box.
const bow = `
  <g fill="${CREAM}" stroke="${WINE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M54 26C40 6 14 4 10 18C7 30 34 38 54 29Z"/>
    <path d="M66 26C80 6 106 4 110 18C113 30 86 38 66 29Z"/>
    <path d="M56 33C51 43 43 51 33 58L40 44"/>
    <path d="M64 33C69 43 77 51 87 58L80 44"/>
    <ellipse cx="60" cy="27" rx="6.5" ry="7.5" fill="${WINE}"/>
  </g>`;

// The open box of five with its ribbon and bow, in a 360 × 250 box.
const box = (): string => {
  const bites = flavours
    .map((flavour, index) => {
      const x = 180 + (index - (flavours.length - 1) / 2) * 62;
      return `<circle cx="${x}" cy="112" r="29" fill="${CREAM}" stroke="${WINE}" stroke-width="2"/>
        <circle cx="${x}" cy="112" r="21" fill="${flavour.accent}" opacity="0.85"/>`;
    })
    .join('');

  return `
    <g stroke="${WINE}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M34 82L48 26H312L326 82Z" fill="${CREAM}"/>
      <path d="M34 82H326L346 140H14Z" fill="${WINE}" fill-opacity="0.1"/>
      ${bites}
      <path d="M14 140H346L338 228H22Z" fill="${CREAM}"/>
      <path d="M17 171H343L341 195H19Z" fill="${WINE}" stroke="none"/>
    </g>
    <svg x="125" y="158" width="110" height="57" viewBox="0 0 120 62">${bow}</svg>`;
};

// Link-preview image: the logo above the box, 1200 × 630.
export const shareImageSvg = (width: number, height: number): string => {
  const wordmark = wordmarkPaths(brand.name);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="${CREAM}"/>
    <rect x="24" y="24" width="1152" height="582" rx="28" fill="none" stroke="${WINE}" stroke-width="2" opacity="0.35"/>
    <svg x="340" y="56" width="520" height="190" viewBox="${wordmark.viewBox}" fill="${WINE}">
      <path d="${wordmark.letters.join('')}"/>
    </svg>
    <svg x="366" y="262" width="468" height="325" viewBox="0 0 360 250">${box()}</svg>
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
