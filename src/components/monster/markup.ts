// The Crumb Monster's drawing: a round cheesecake bite as a quiet line
// character, in the same etched wine line as the other illustrations. A
// scalloped crust edge, two dot eyes, a small mouth and two thin arms. One
// drawing, shared by the Astro and React wrappers; rig.ts moves the parts
// named in data-m.

export type Mood = 'hungry' | 'chomp' | 'chew' | 'thumbs-up' | 'peek' | 'lick';

export const monsterViewBox = '-14 -20 228 230';

// Where the middle of the mouth sits, as a fraction of the drawing's size.
export const monsterMouth = { x: 0.5, y: 0.68 } as const;

const CENTRE = { x: 100, y: 108 };
const SCALLOPS = 30;

// The crust: a fine scalloped edge, like the rim of a paper cup from above.
const crustEdge = (() => {
  const point = (index: number, radius: number): string => {
    const angle = (index / SCALLOPS) * Math.PI * 2;
    return `${(CENTRE.x + Math.cos(angle) * radius).toFixed(1)} ${(CENTRE.y + Math.sin(angle) * radius).toFixed(1)}`;
  };
  let path = `M${point(0, 80)}`;
  for (let index = 0; index < SCALLOPS; index += 1) {
    path += `Q${point(index + 0.5, 90)} ${point(index + 1, 80)}`;
  }
  return `${path}Z`;
})();

const ink = 'var(--color-wine)';
const crust = 'color-mix(in srgb, var(--color-crust) 30%, var(--color-cream))';

const eye = (x: number): string => `
  <g data-m="eye"><circle data-m="pupil" cx="${x}" cy="94" r="4.5" fill="${ink}" stroke="none"/></g>`;

export const monsterMarkup = `
<g data-m="root" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path data-m="arm-l" d="M22 122c-10 2-16 8-18 17"/>
  <path data-m="arm-r" d="M178 122c10 2 16 8 18 17"/>
  <g data-m="thumb">
    <path d="M178 122c10-3 16-11 18-22"/>
    <path d="M196 100v-13"/>
  </g>
  <path d="${crustEdge}" fill="${crust}" stroke-width="1.5"/>
  <circle cx="${CENTRE.x}" cy="${CENTRE.y}" r="72" fill="var(--color-cream)"/>
  <path d="M42 132c5 13 13 23 24 30M50 128c5 11 11 19 20 25M58 126c4 8 9 14 15 19" stroke-width="1" opacity="0.45"/>
  <path d="M128 52c10 4 18 10 24 18M134 46c9 4 16 9 22 16" stroke-width="1" opacity="0.3"/>
  ${eye(80)}${eye(120)}
  <path data-m="mouth" d="M82 131c6 12 30 12 36 0c-6-12-30-12-36 0z" fill="${ink}"/>
  <path data-m="tongue" d="M94 133c-1 14 13 14 12 0z" fill="color-mix(in srgb, var(--color-wine) 45%, var(--color-cream))" stroke-width="1.5"/>
</g>`;
