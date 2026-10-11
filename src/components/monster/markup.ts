// The Crumb Monster's drawing: a round cream cheesecake bite with golden crust
// fur, a wide wine mouth, two tiny arms and big eyes. One drawing, shared by
// the Astro and React wrappers; rig.ts moves the parts named in data-m.

export type Mood = 'hungry' | 'chomp' | 'chew' | 'thumbs-up' | 'peek' | 'lick';

export const monsterViewBox = '-14 -20 228 230';

// Where the middle of the mouth sits, as a fraction of the drawing's size.
export const monsterMouth = { x: 0.5, y: 0.7 } as const;

const CENTRE = { x: 100, y: 108 };
const TUFTS = 26;

// The crust: a ring of fur tufts around the body.
const fur =
  Array.from({ length: TUFTS * 2 }, (_, index) => {
    const angle = (index / (TUFTS * 2)) * Math.PI * 2;
    const radius = index % 2 ? 76 : 88;
    const x = (CENTRE.x + Math.cos(angle) * radius).toFixed(1);
    const y = (CENTRE.y + Math.sin(angle) * radius).toFixed(1);
    return `${index ? 'L' : 'M'}${x} ${y}`;
  }).join('') + 'Z';

const ink = 'var(--color-wine-deep)';
const crust = 'var(--color-crust)';

// An arm is a crust-coloured stroke with an ink outline behind it.
const limb = (d: string): string =>
  `<path d="${d}" stroke="${ink}" stroke-width="9"/><path d="${d}" stroke="${crust}" stroke-width="5"/>`;

const eye = (x: number): string => `
  <g data-m="eye">
    <circle cx="${x}" cy="82" r="17" fill="#fff"/>
    <circle data-m="pupil" cx="${x}" cy="84" r="7.5" fill="${ink}" stroke="none"/>
  </g>`;

export const monsterMarkup = `
<g data-m="root" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <g data-m="arm-l">${limb('M26 120c-14-4-22 2-24 14')}</g>
  <g data-m="arm-r">${limb('M174 120c14-4 22 2 24 14')}</g>
  <g data-m="thumb">
    ${limb('M172 120c14-2 22-10 24-24')}
    ${limb('M196 86v-14')}
    <circle cx="196" cy="94" r="9" fill="${crust}" stroke-width="2"/>
  </g>
  <path d="${fur}" fill="${crust}" stroke-width="2"/>
  <circle cx="${CENTRE.x}" cy="${CENTRE.y}" r="70" fill="var(--color-cream)"/>
  <path d="M44 138c6 12 14 20 24 26M52 132c5 10 11 16 19 21M150 150c-5 6-11 10-17 13" stroke-width="1.5" opacity="0.5"/>
  ${eye(76)}${eye(124)}
  <path data-m="mouth" d="M56 132c8 38 80 38 88 0c-28 8-60 8-88 0z" fill="var(--color-wine)"/>
  <path data-m="tongue" d="M86 142c-2 26 30 26 28 0z" fill="color-mix(in srgb, var(--color-wine) 55%, var(--color-cream))" stroke-width="2"/>
</g>`;
