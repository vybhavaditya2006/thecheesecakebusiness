// Photos from the kitchen, and the few words that go with each. The files
// live in src/assets/photos/<name>.webp; a snapshot is only shown once its
// file exists.

export interface Snapshot {
  // File name, without the extension.
  name: string;
  // What the photo shows, for anyone who cannot see it.
  alt: string;
  // An optional hand-written note beside it.
  note?: string;
}

// Three packs of five, side by side, as they are handed over.
export const packsOfFive: Snapshot = {
  name: 'packs-of-five',
  alt: 'Three clear packs of five cheesecake bites, side by side, seen from above',
  note: 'packs of five',
};

// A Half & Half cake, still in its tin.
export const halfAndHalfCake: Snapshot = {
  name: 'half-and-half',
  alt: 'A round Half & Half cheesecake in its tin: one half pale, the other a darker flavour',
  note: 'half & half',
};

// Trays of bites in the kitchen, for "How it's made".
export const kitchen: readonly Snapshot[] = [
  { name: 'kitchen-tray-b', alt: 'A tray of bites in paper cups, some marbled, some plain, two with biscuit crumb' },
  { name: 'kitchen-tray-a', alt: 'A tray of bites, half topped with Oreo crumb and half with KitKat pieces' },
  { name: 'kitchen-fridge', alt: 'Trays of Oreo and KitKat bites in the fridge', note: 'in the fridge' },
];
