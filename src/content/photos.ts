// Photos from the kitchen and what each shows. The files live in
// src/assets/photos/masters/<name>.png.

export interface Snapshot {
  // File name, without the extension.
  name: string;
  // What the photo shows, for anyone who cannot see it.
  alt: string;
}

// Three packs of five, side by side, as they are handed over.
export const packsOfFive: Snapshot = {
  name: 'packs-of-five',
  alt: 'Three clear packs of five cheesecake bites, side by side, seen from above',
};


// Trays of bites in the kitchen, for "How it's made".
export const kitchen: readonly Snapshot[] = [
  { name: 'kitchen-tray-b', alt: 'A tray of bites in paper cups, some marbled, some plain, two with biscuit crumb' },
  { name: 'kitchen-tray-a', alt: 'A tray of bites, half topped with Oreo crumb and half with KitKat pieces' },
  { name: 'kitchen-fridge', alt: 'Trays of Oreo and KitKat bites in the fridge' },
];
