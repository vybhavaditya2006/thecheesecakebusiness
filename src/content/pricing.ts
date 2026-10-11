export interface Price {
  label: string;
  // Number of bites this price buys.
  bites: number;
  // Regular price in rupees.
  regular: number;
  // Launch offer price in rupees.
  offer: number;
}

export const currency = { code: 'INR', symbol: '₹' } as const;

// Same price for every flavour.
export const pricing = {
  box: { label: 'Box of 5 (pick any mix)', bites: 5, regular: 150, offer: 125 },
  single: { label: 'Single bite', bites: 1, regular: 65, offer: 50 },
} as const satisfies Record<string, Price>;

// Flip to false when the launch offer ends.
export const launchOfferActive = true;

export const formatPrice = (amount: number): string => `${currency.symbol}${amount}`;

// Cheapest way to buy `bites` bites: full boxes first, the rest as singles.
export const priceFor = (bites: number, offer: boolean = launchOfferActive): number => {
  const key = offer ? 'offer' : 'regular';
  const boxes = Math.floor(bites / pricing.box.bites);
  const singles = bites % pricing.box.bites;
  return boxes * pricing.box[key] + singles * pricing.single[key];
};
