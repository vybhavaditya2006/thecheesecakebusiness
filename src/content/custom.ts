import { brand } from './brand';

export type CustomOptionId = 'build-your-own' | 'half-and-half' | 'gift-box' | 'party-platter';

export interface CustomOption {
  id: CustomOptionId;
  name: string;
  description: string;
  // Available sizes in bites, where the option comes in fixed sizes.
  sizes?: readonly number[];
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

export const isCustomOptionId = (id: unknown): id is CustomOptionId =>
  customOptions.some((option) => option.id === id);

export interface LayerChoice {
  id: string;
  name: string;
  // Colour of the layer in the build-up drawing; null draws nothing.
  colour: string | null;
}

export interface BiteLayer {
  id: 'base' | 'filling' | 'centre' | 'topping';
  name: string;
  choices: readonly LayerChoice[];
}

// "Build your own bite", from the bottom layer up.
// TODO: placeholder choices. Replace with what the kitchen really offers.
export const biteLayers: readonly BiteLayer[] = [
  {
    id: 'base',
    name: 'Base',
    choices: [
      { id: 'biscuit', name: 'Biscuit crumb', colour: '#C9A26B' },
      { id: 'oreo', name: 'Oreo crumb', colour: '#111111' },
      { id: 'biscoff', name: 'Biscoff crumb', colour: '#C8813C' },
    ],
  },
  {
    id: 'filling',
    name: 'Filling',
    choices: [
      { id: 'classic', name: 'Classic', colour: '#FBF3E8' },
      { id: 'blueberry', name: 'Blueberry', colour: '#5B3FA0' },
      { id: 'coffee', name: 'Coffee', colour: '#6F4E37' },
      { id: 'chocolate', name: 'Chocolate', colour: '#4A2C1A' },
    ],
  },
  {
    id: 'centre',
    name: 'Centre',
    choices: [
      { id: 'none', name: 'None', colour: null },
      { id: 'blueberry', name: 'Blueberry compote', colour: '#5B3FA0' },
      { id: 'biscoff', name: 'Biscoff spread', colour: '#C8813C' },
      { id: 'kitkat', name: 'KitKat piece', colour: '#D2232A' },
    ],
  },
  {
    id: 'topping',
    name: 'Topping',
    choices: [
      { id: 'blueberries', name: 'Blueberries', colour: '#5B3FA0' },
      { id: 'kitkat', name: 'KitKat pieces', colour: '#D2232A' },
      { id: 'oreo', name: 'Oreo crumbs', colour: '#111111' },
      { id: 'coffee', name: 'Coffee dust', colour: '#6F4E37' },
      { id: 'biscoff', name: 'Biscoff crumbs', colour: '#C8813C' },
    ],
  },
];

// Longest gift note, in characters.
export const giftNoteLimit = 140;

// What a custom order might be for. Picking one adds it to the WhatsApp message.
export const occasions = ['Diwali', 'Birthdays', 'Office'] as const;

// Wording on the Custom & Gifts page.
export const customPage = {
  ask: `Ask ${brand.maker} on WhatsApp`,
  occasionsHeading: 'What is it for?',
  halves: ['First half', 'Second half'],
  // How each WhatsApp message opens and closes.
  opening: 'I would like to ask about a custom order:',
  closing: '(Price, delivery and payment to be confirmed here.)',
} as const;

