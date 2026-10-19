// Whole cheesecakes. Their one home is the #whole section of /flavours;
// they are ordered on the "Whole cheesecake" tab of /box.
import { flavours, type FlavourId } from './flavours';
import { formatPrice } from './pricing';

export interface WholeCakeSize {
  id: string;
  // As it is shown and written in the order, e.g. "6 inch".
  label: string;
  // Price in rupees, or null for "price to confirm".
  price: number | null;
}

// TODO: sizes are null until Shlok confirms them. Never invent sizes or
// prices; while this is null, every price reads "Sizes and price on WhatsApp".
// (Widened on purpose, so code for sizes type-checks while there are none.)
const sizes = null as readonly WholeCakeSize[] | null;

export const wholeCakes = {
  name: 'Whole cheesecakes',
  // One of them, as an order line and a tab.
  one: 'Whole cheesecake',
  // Which flavours come whole. All five to start with.
  flavours: flavours.map((flavour) => flavour.id) as readonly FlavourId[],
  sizes,
  // In full, on /flavours#whole.
  leadTime: 'Made to order, date confirmed on WhatsApp.',
  // The shorter form, on /box.
  leadTimeShort: 'Date confirmed on WhatsApp',
  // When no size has a price: in full on /flavours#whole, and the shorter
  // forms elsewhere (say it once).
  priceNote: 'Sizes and price on WhatsApp',
  priceShort: 'Ask for sizes and prices',
  priceLater: 'Price on WhatsApp',
  // A photo master name in src/assets/photos/masters, or null for a cream
  // frame reading "Photo coming soon". The Half & Half cake is the only
  // whole cheesecake photographed so far.
  // TODO: swap for an overhead photo of a single-flavour whole cheesecake.
  photo: 'half-and-half' as string | null,
  photoAlt: 'A whole round cheesecake in its tin, seen from above',
  // On each flavour on /flavours, linking to #whole.
  also: 'Also as a whole cheesecake',
  order: 'Order a whole cheesecake',
  // The message written on the cake, at most this many characters.
  messageLimit: 40,
} as const;

// Sizes that have a price.
export const pricedSizes = (): readonly WholeCakeSize[] => (wholeCakes.sizes ?? []).filter((size) => size.price !== null);

// The price in a word or two, for Home: "from ₹900" once a size is priced,
// otherwise the short note.
export const wholeCakePriceLine = (): string => {
  const prices = pricedSizes().map((size) => size.price!);
  return prices.length ? `from ${formatPrice(Math.min(...prices))}` : wholeCakes.priceShort;
};

export const isWholeCakeFlavour = (id: unknown): id is FlavourId =>
  wholeCakes.flavours.includes(id as FlavourId);

export const wholeCakeSize = (id: string | undefined): WholeCakeSize | undefined =>
  wholeCakes.sizes?.find((size) => size.id === id);
