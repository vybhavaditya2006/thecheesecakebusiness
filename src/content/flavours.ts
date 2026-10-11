export type FlavourId = 'blueberry' | 'kitkat' | 'oreo' | 'coffee' | 'biscoff';

export interface Flavour {
  id: FlavourId;
  name: string;
  // Accent colour, used only inside this flavour's scene.
  accent: string;
  // One-line taste note.
  note: string;
  // What bursts out around the bite in the flavour's scene.
  ingredient: string;
}

export const flavours: readonly Flavour[] = [
  {
    id: 'blueberry',
    name: 'Blueberry',
    accent: '#5B3FA0',
    note: 'Tangy blueberry swirl on a buttery crumb.',
    ingredient: 'Blueberries',
  },
  {
    id: 'kitkat',
    name: 'KitKat',
    accent: '#D2232A',
    note: 'Creamy cheesecake with a crisp wafer crunch.',
    ingredient: 'KitKat pieces',
  },
  {
    id: 'oreo',
    name: 'Oreo',
    accent: '#111111',
    note: 'Cookies and cream, all the way down.',
    ingredient: 'Oreo crumbs',
  },
  {
    id: 'coffee',
    name: 'Coffee',
    accent: '#6F4E37',
    note: 'A smooth espresso kick in every bite.',
    ingredient: 'Coffee beans',
  },
  {
    id: 'biscoff',
    name: 'Lotus Biscoff',
    accent: '#C8813C',
    note: 'Caramelised biscuit, warm with spice.',
    ingredient: 'Biscoff crumbs',
  },
];

export const flavourById = (id: FlavourId): Flavour =>
  flavours.find((flavour) => flavour.id === id)!;
