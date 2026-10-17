export type FlavourId = 'blueberry' | 'kitkat' | 'oreo' | 'coffee' | 'biscoff';

export interface Flavour {
  id: FlavourId;
  name: string;
  // Accent colour, used only inside this flavour's scene.
  accent: string;
  // One-line taste note. TODO: these are draft wording, not yet confirmed by Shlok.
  note: string;
  // What bursts out around the bite in the flavour's scene.
  ingredient: string;
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
    photographed: true,
    layers: layersToConfirm,
  },
  {
    id: 'kitkat',
    name: 'KitKat',
    accent: '#D2232A',
    note: 'Creamy cheesecake with a crisp wafer crunch.',
    ingredient: 'KitKat pieces',
    photographed: true,
    layers: layersToConfirm,
  },
  {
    id: 'oreo',
    name: 'Oreo',
    accent: '#111111',
    note: 'Cookies and cream, all the way down.',
    ingredient: 'Oreo crumbs',
    photographed: true,
    layers: layersToConfirm,
  },
  {
    id: 'coffee',
    name: 'Coffee',
    accent: '#6F4E37',
    note: 'A smooth espresso kick in every bite.',
    ingredient: 'Coffee beans',
    layers: layersToConfirm,
  },
  {
    id: 'biscoff',
    name: 'Lotus Biscoff',
    accent: '#C8813C',
    note: 'Caramelised biscuit, warm with spice.',
    ingredient: 'Biscoff crumbs',
    photographed: true,
    layers: layersToConfirm,
  },
];

export const flavourById = (id: FlavourId): Flavour =>
  flavours.find((flavour) => flavour.id === id)!;
