export interface Price {
  // What it is called in an order.
  name: string;
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
  box: { name: 'Box of five pieces', label: 'Box of five pieces (pick any mix)', bites: 5, regular: 150, offer: 125 },
  single: { name: 'Single piece', label: 'Single piece', bites: 1, regular: 65, offer: 50 },
} as const satisfies Record<string, Price>;

// Flip to false when the launch offer ends.
export const saleActive = true;

export const formatPrice = (amount: number): string => `${currency.symbol}${amount}`;

// How an order is charged: every full set of bites is a box, the rest are
// singles. It makes no difference how the customer picked them.
export const priceFor = (bites: number, offer: boolean = saleActive): number => {
  const key = offer ? 'offer' : 'regular';
  const boxes = Math.floor(bites / pricing.box.bites);
  const singles = bites % pricing.box.bites;
  return boxes * pricing.box[key] + singles * pricing.single[key];
};

export interface PriceBreakdown {
  boxes: number;
  singles: number;
  total: number;
  // What the same order costs without the launch offer.
  regularTotal: number;
  // Bites to add for the leftover singles to become a cheaper box; 0 if
  // there is nothing to gain.
  toNextBox: number;
}

export const priceBreakdown = (bites: number): PriceBreakdown => {
  const key = saleActive ? 'offer' : 'regular';
  const boxes = Math.floor(bites / pricing.box.bites);
  const singles = bites % pricing.box.bites;
  const cheaperAsBox = singles * pricing.single[key] > pricing.box[key];

  return {
    boxes,
    singles,
    total: priceFor(bites),
    regularTotal: priceFor(bites, false),
    toNextBox: cheaperAsBox ? pricing.box.bites - singles : 0,
  };
};
