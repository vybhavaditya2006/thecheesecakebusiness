// The layers of a cheesecake, top down, as labelled on the slice in the
// whole-cake scene on Home.
//
// TODO: the `note` wording is a placeholder. Replace each one with Shlok's
// own words for that layer once he confirms them. Nothing here may be invented.

export interface CakeLayer {
  // Matches the layer in the 3D slice.
  id: 'topping' | 'filling' | 'crust';
  name: string;
  note: string;
}

const unconfirmed = 'To be confirmed';

export const cakeLayers: readonly CakeLayer[] = [
  { id: 'topping', name: 'Topping', note: unconfirmed },
  { id: 'filling', name: 'Filling', note: unconfirmed },
  { id: 'crust', name: 'Crust', note: unconfirmed },
];
