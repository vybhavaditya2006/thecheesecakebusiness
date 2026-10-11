export type FlavourId = 'blueberry' | 'kitkat' | 'oreo' | 'coffee' | 'biscoff';

export interface Flavour {
  id: FlavourId;
  name: string;
  // Accent colour, used only inside this flavour's scene.
  accent: string;
}

export const flavours: readonly Flavour[] = [
  { id: 'blueberry', name: 'Blueberry', accent: '#5B3FA0' },
  { id: 'kitkat', name: 'KitKat', accent: '#D2232A' },
  { id: 'oreo', name: 'Oreo', accent: '#111111' },
  { id: 'coffee', name: 'Coffee', accent: '#6F4E37' },
  { id: 'biscoff', name: 'Lotus Biscoff', accent: '#C8813C' },
];

export const flavourById = (id: FlavourId): Flavour =>
  flavours.find((flavour) => flavour.id === id)!;
