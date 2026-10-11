export interface CustomOption {
  id: string;
  name: string;
  description: string;
  // Available sizes in bites, where the option comes in fixed sizes.
  sizes?: readonly number[];
}

// Custom orders are priced and confirmed on WhatsApp.
export const customOptions: readonly CustomOption[] = [
  {
    id: 'combo',
    name: 'Your own combo',
    description: 'Tell us the flavour combination you have in mind.',
  },
  {
    id: 'half-and-half',
    name: 'Half & Half cake',
    description: 'One cake, two flavours.',
  },
  {
    id: 'gift-box',
    name: 'Gift box',
    description: 'A box made for gifting.',
    sizes: [5, 10],
  },
  {
    id: 'party-platter',
    name: 'Party platter',
    description: 'A platter for the whole table.',
    sizes: [25, 50],
  },
];
