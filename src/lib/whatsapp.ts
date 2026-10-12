import { brand } from '../content/brand';
import { customPriceNote } from '../content/custom';
import type { FlavourId } from '../content/flavours';
import { formatPrice, priceBreakdown, pricing, saleActive } from '../content/pricing';
import { countByFlavour, type CustomRequest } from './order-store';

const capitalised = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

// The order itself, one item per line, ending with the total.
export const orderLines = (bites: readonly FlavourId[], custom: readonly CustomRequest[]): string[] => {
  const key = saleActive ? 'offer' : 'regular';
  const { boxes, singles, total } = priceBreakdown(bites.length);
  const packed = boxes * pricing.box.bites;
  const picked = (run: readonly FlavourId[]): string =>
    countByFlavour(run)
      .map(({ flavour, count }) => `${flavour.name} x${count}`)
      .join(', ');
  const lines: string[] = [];

  // Each run of five is a box, listed with the flavours picked for it.
  for (let start = 0; start < packed; start += pricing.box.bites) {
    const box = bites.slice(start, start + pricing.box.bites);
    lines.push(`${pricing.box.name}: ${picked(box)} — ${formatPrice(pricing.box[key])}`);
  }
  if (singles) {
    const name = capitalised(pricing.single.counted[1]);
    lines.push(`${name}: ${picked(bites.slice(packed))} — ${formatPrice(singles * pricing.single[key])}`);
  }
  for (const request of custom) {
    lines.push(`${request.title}: ${request.details.join(', ')} — ${customPriceNote.toLowerCase()}`);
  }

  const priced = bites.length ? formatPrice(total) : '';
  const unpriced = custom.length ? 'custom orders' : '';
  lines.push(`Total: ${[priced, unpriced].filter(Boolean).join(' + ')}`);

  return lines;
};

// The WhatsApp message: just the order. Name, address and day are sorted out
// in the chat.
export const orderMessage = (bites: readonly FlavourId[], custom: readonly CustomRequest[]): string =>
  [
    `Hi ${brand.maker}! I'd like to order:`,
    '',
    ...orderLines(bites, custom),
    '',
    '(Delivery and payment to be confirmed here.)',
  ].join('\n');

export { whatsappLink } from './wa-link';
