import { brand } from '../content/brand';
import { customPriceNote } from '../content/custom';
import type { FlavourId } from '../content/flavours';
import { formatPrice, priceBreakdown, pricing, saleActive } from '../content/pricing';
import { wholeCakes, wholeCakeSize } from '../content/whole-cakes';
import { flavourById } from '../content/flavours';
import { countByFlavour, wholeCakePrice, wholeCakeTotals, type CustomRequest, type WholeCakeOrder } from './order-store';

const capitalised = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

// "2026-10-24" as "Sat 24 Oct", read as a plain calendar date.
export const formatCakeDate = (date: string): string => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!))
    .toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    .replace(',', '');
};

// One whole cheesecake, as in "Whole cheesecake: Lotus Biscoff, 6 inch, for
// Sat 24 Oct (date to confirm), message: Happy birthday — price to confirm".
export const wholeCakeLine = (cake: WholeCakeOrder): string => {
  const price = wholeCakePrice(cake);
  const parts = [
    flavourById(cake.flavour).name,
    wholeCakeSize(cake.size)?.label,
    `for ${formatCakeDate(cake.date)} (date to confirm)`,
    cake.message ? `message: ${cake.message}` : undefined,
  ].filter(Boolean);
  return `${wholeCakes.one}: ${parts.join(', ')} — ${price === null ? 'price to confirm' : formatPrice(price)}`;
};

// What goes after the price in a total when some whole cheesecakes have no
// price yet: "+ whole cheesecake (price on WhatsApp)".
export const unpricedWholeCakes = (count: number): string =>
  count ? `+ ${count === 1 ? 'whole cheesecake' : `${count} whole cheesecakes`} (price on WhatsApp)` : '';

// The order itself, one item per line, ending with the total.
export const orderLines = (
  bites: readonly FlavourId[],
  custom: readonly CustomRequest[],
  whole: readonly WholeCakeOrder[] = [],
): string[] => {
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
  for (const cake of whole) lines.push(wholeCakeLine(cake));

  // What can be priced now, then what is still to be priced on WhatsApp.
  const cakes = wholeCakeTotals(whole);
  const priced = bites.length || cakes.priced ? formatPrice(total + cakes.priced) : '';
  const unpriced = [custom.length ? '+ custom orders' : '', unpricedWholeCakes(cakes.unpriced)].filter(Boolean);
  const totalLine = [priced, ...unpriced].filter(Boolean).join(' ');
  // Nothing priced yet: no "+" to start the line.
  lines.push(`Total: ${priced ? totalLine : totalLine.replace(/^\+ /, '')}`);

  return lines;
};

// The WhatsApp message: just the order. Name, address and day are sorted out
// in the chat.
export const orderMessage = (
  bites: readonly FlavourId[],
  custom: readonly CustomRequest[],
  whole: readonly WholeCakeOrder[] = [],
): string =>
  [
    `Hi ${brand.maker}! I'd like to order:`,
    '',
    ...orderLines(bites, custom, whole),
    '',
    '(Delivery and payment to be confirmed here.)',
  ].join('\n');

export { whatsappLink } from './wa-link';
