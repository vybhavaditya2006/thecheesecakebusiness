// When each beat of the whole-cake scene happens, as fractions of its full
// scroll (about 400vh). Kept apart from the 3D code so the page can time its
// text to the same beats without loading three.js.
export const DIVE = {
  // Top-down, the whole cake slowly turning.
  whole: [0, 0.15],
  // The knife line is drawn, then the wedge slides out with a puff of crumbs.
  cut: [0.15, 0.23],
  slide: [0.23, 0.3],
  // The camera comes down to eye level and round into the cut.
  sweep: [0.3, 0.45],
  // The circular mask opens over the last of the sweep, then lifts.
  enter: [0.39, 0.45],
  reveal: [0.45, 0.48],
  // The slice from the side, up close, with its layers labelled.
  labels: [0.48, 0.6],
  // The layers lift apart; the crust breaks into crumbs.
  explode: [0.6, 0.72],
  shatter: [0.64, 0.8],
  // Everything swirls into one bite, which drops into the box of five.
  swirl: [0.8, 0.9],
  drop: [0.9, 0.95],
  reasons: [0.91, 1],
} as const;

// The scroll the scene is pinned for.
export const DIVE_SCROLL_VH = 400;
