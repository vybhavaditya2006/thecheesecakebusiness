// When each beat of the whole-cake scene happens, as fractions of its full
// scroll (about 400vh). Kept apart from the 3D code so the page can time its
// text to the same beats without loading three.js.
export const DIVE = {
  // Top-down, the whole cake slowly turning.
  whole: [0, 0.15],
  // The knife line is drawn, then the wedge slides out with a puff of crumbs.
  cut: [0.15, 0.23],
  slide: [0.23, 0.3],
  // The camera comes down to eye level and round to the cut face.
  sweep: [0.3, 0.45],
  // The circular mask opens over the last of the sweep.
  enter: [0.39, 0.45],
} as const;

// The full scroll the scene is planned for, and how much of it is built so far.
export const DIVE_SCROLL_VH = 400;
export const DIVE_BUILT = DIVE.sweep[1];
