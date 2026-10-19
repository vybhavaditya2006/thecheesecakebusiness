export type FlavourId = 'blueberry' | 'kitkat' | 'oreo' | 'coffee' | 'biscoff';

export interface Flavour {
  id: FlavourId;
  name: string;
  // Accent colour, used only inside this flavour's scene.
  accent: string;
  // One-line note. Only what can be seen in the photos (and, for Coffee,
  // what CLAUDE.md says); no claimed ingredients. TODO: Shlok's own words.
  note: string;
  // What surrounds the bite in the flavour's scene.
  ingredient: string;
  // The cut-out photo of that ingredient, src/assets/ingredients/<name>.png,
  // made by scripts/process-photos.mjs. None shows until the photo exists.
  ingredientPhoto: 'blueberries' | 'kitkat' | 'oreo' | 'coffee-beans' | 'biscoff';
  // Optional, shown on /flavours only once filled in. TODO: both are null
  // until Shlok confirms them; never estimate them.
  // Calories in one piece.
  calories: number | null;
  // What goes into it, in order.
  ingredients: readonly string[] | null;
  // What the bite is made of, from the top down.
  layers: readonly Layer[];
}

export interface Layer {
  part: string;
  what: string;
}

// TODO: placeholders. Replace each `what` with the real layer once Shlok
// confirms it, flavour by flavour. Nothing here may be invented.
const unconfirmed = 'To be confirmed';
const layersToConfirm: readonly Layer[] = [
  { part: 'Topping', what: unconfirmed },
  { part: 'Filling', what: unconfirmed },
  { part: 'Crust', what: unconfirmed },
];

export const flavours: readonly Flavour[] = [
  {
    id: 'blueberry',
    name: 'Blueberry',
    accent: '#5B3FA0',
    note: 'Blueberry compote on top.',
    ingredient: 'Blueberries',
    ingredientPhoto: 'blueberries',
    calories: null,
    ingredients: null,
    layers: layersToConfirm,
  },
  {
    id: 'kitkat',
    name: 'KitKat',
    accent: '#D2232A',
    note: 'Two pieces of KitKat on top.',
    ingredient: 'KitKat pieces',
    ingredientPhoto: 'kitkat',
    calories: null,
    ingredients: null,
    layers: layersToConfirm,
  },
  {
    id: 'oreo',
    name: 'Oreo',
    accent: '#111111',
    note: 'Oreo crumb on top.',
    ingredient: 'Oreo crumbs',
    ingredientPhoto: 'oreo',
    calories: null,
    ingredients: null,
    layers: layersToConfirm,
  },
  {
    id: 'coffee',
    name: 'Coffee',
    accent: '#6F4E37',
    note: 'Light brown all through, with nothing on top.',
    ingredient: 'Coffee beans',
    ingredientPhoto: 'coffee-beans',
    calories: null,
    ingredients: null,
    layers: layersToConfirm,
  },
  {
    id: 'biscoff',
    name: 'Lotus Biscoff',
    accent: '#C8813C',
    note: 'Lotus Biscoff crumb on top.',
    ingredient: 'Biscoff crumbs',
    ingredientPhoto: 'biscoff',
    calories: null,
    ingredients: null,
    layers: layersToConfirm,
  },
];

export const flavourById = (id: FlavourId): Flavour =>
  flavours.find((flavour) => flavour.id === id)!;
