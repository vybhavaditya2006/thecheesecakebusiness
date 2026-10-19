import { brand } from './brand';

export type CustomOptionId = 'build-your-own' | 'half-and-half' | 'gift-box' | 'party-platter';

export interface CustomOption {
  id: CustomOptionId;
  name: string;
  description: string;
  // Available sizes in bites, where the option comes in fixed sizes.
  sizes?: readonly number[];
  // A photo master (src/assets/photos/masters) for its tile on Custom &
  // Gifts, and what that photo really shows. None: a "Photo coming soon" frame.
  // TODO: swap for photos of each option itself once Shlok has them.
  photo?: { name: string; alt: string };
}

// Custom orders are priced and confirmed on WhatsApp.
export const customPriceNote = 'Price confirmed on WhatsApp';
// The same fact in full, for the Custom & Gifts page.
export const customPricing =
  'Every custom order is priced on its own. You get the price on WhatsApp once you send it.';

export const customOptions: readonly CustomOption[] = [
  {
    id: 'build-your-own',
    name: 'Build your own bite',
    description: 'Pick the base, filling, centre and topping yourself.',
    photo: { name: 'macro-layers', alt: 'The layers of a cheesecake piece, seen through its paper cup' },
  },
  {
    id: 'half-and-half',
    name: 'Half & Half cake',
    description: 'One cake, two flavours.',
    photo: { name: 'half-and-half', alt: 'A Half & Half cheesecake in its tin, one half pale and the other darker' },
  },
  {
    id: 'gift-box',
    name: 'Gift box',
    description: 'A box made for gifting.',
    sizes: [5, 10],
    photo: { name: 'packs-of-five', alt: 'Clear packs of five cheesecake pieces, side by side' },
  },
  {
    id: 'party-platter',
    name: 'Party platter',
    description: 'A platter for the whole table.',
    sizes: [25, 50],
    photo: { name: 'kitchen-tray-a', alt: 'A tray of cheesecake pieces, half topped with Oreo crumb and half with KitKat' },
  },
];

export const isCustomOptionId = (id: unknown): id is CustomOptionId =>
  customOptions.some((option) => option.id === id);

// Longest gift note, in characters.
export const giftNoteLimit = 140;
// Longest description of a build-your-own bite, in characters.
export const ideaLimit = 200;


// Wording on the Custom & Gifts page.
export const customPage = {
  ask: `Ask ${brand.maker} on WhatsApp`,
  // How each WhatsApp message opens and closes.
  opening: 'I would like to ask about a custom order:',
  closing: '(Price, delivery and payment to be confirmed here.)',
} as const;

