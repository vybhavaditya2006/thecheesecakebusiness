export type FlavourId = 'blueberry' | 'kitkat' | 'oreo' | 'coffee' | 'biscoff';

export interface Flavour {
  id: FlavourId;
  name: string;
  // Accent colour, used only inside this flavour's scene.
  accent: string;
  // One-line taste note. TODO: these are draft wording, not yet confirmed by Shlok.
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
  // True once the flavour's picture is a real photograph. Coffee has none yet:
  // it shows the 3D bite (see src/lib/bite-images.ts) and gets no hand-written note.
  photographed?: boolean;
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
    note: 'Tangy blueberry swirl on a buttery crumb.',
    ingredient: 'Blueberries',
    ingredientPhoto: 'blueberries',
    calories: null,
    ingredients: null,
    photographed: true,
    layers: layersToConfirm,
  },
  {
    id: 'kitkat',
    name: 'KitKat',
    accent: '#D2232A',
    note: 'Creamy cheesecake with a crisp wafer crunch.',
    ingredient: 'KitKat pieces',
    ingredientPhoto: 'kitkat',
    calories: null,
    ingredients: null,
    photographed: true,
    layers: layersToConfirm,
  },
  {
    id: 'oreo',
    name: 'Oreo',
    accent: '#111111',
    note: 'Cookies and cream, all the way down.',
    ingredient: 'Oreo crumbs',
    ingredientPhoto: 'oreo',
    calories: null,
    ingredients: null,
    photographed: true,
    layers: layersToConfirm,
  },
  {
    id: 'coffee',
    name: 'Coffee',
    accent: '#6F4E37',
    note: 'A smooth espresso kick in every bite.',
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
    note: 'Caramelised biscuit, warm with spice.',
    ingredient: 'Biscoff crumbs',
    ingredientPhoto: 'biscoff',
    calories: null,
    ingredients: null,
    photographed: true,
    layers: layersToConfirm,
  },
];

export const flavourById = (id: FlavourId): Flavour =>
  flavours.find((flavour) => flavour.id === id)!;
