import { brand } from '../content/brand';
import { customPriceNote } from '../content/custom';
import type { FlavourId } from '../content/flavours';
import { formatPrice, priceBreakdown, pricing } from '../content/pricing';
import { contact } from '../content/info';
import { countByFlavour, type CustomRequest } from './order-store';

const plural = (count: number, word: string, many = `${word}s`): string =>
  `${count} ${count === 1 ? word : many}`;

// The order itself, one item per line, ending with the total.
export const orderLines = (bites: readonly FlavourId[], custom: readonly CustomRequest[]): string[] => {
  const lines: string[] = [];

  if (bites.length) {
    const { boxes, singles, total } = priceBreakdown(bites.length);
    const charged = [boxes && plural(boxes, 'box', 'boxes'), singles && plural(singles, 'single')]
      .filter(Boolean)
      .join(' + ');
    const picked = (run: readonly FlavourId[]): string =>
      countByFlavour(run)
        .map(({ flavour, count }) => `${flavour.name} × ${count}`)
        .join(', ');
    const packed = boxes * pricing.box.bites;

    // Each run of five is a box, listed with the flavours picked for it.
    for (let start = 0; start < packed; start += pricing.box.bites) {
      lines.push(`• ${pricing.box.name}: ${picked(bites.slice(start, start + pricing.box.bites))}`);
    }
    if (singles) lines.push(`• Singles: ${picked(bites.slice(packed))}`);
    lines.push(`${plural(bites.length, 'piece')} (${charged}): ${formatPrice(total)}`);
  }

  for (const request of custom) {
    if (lines.length) lines.push('');
    lines.push(`${request.title} (${customPriceNote.toLowerCase()})`);
    lines.push(...request.details.map((detail) => `• ${detail}`));
  }

  return lines;
};

// The WhatsApp message: just the order. Name, address and day are sorted out
// in the chat.
export const orderMessage = (bites: readonly FlavourId[], custom: readonly CustomRequest[]): string =>
  [`Hi ${brand.name}! I'd like to order:`, ...orderLines(bites, custom)].join('\n');

// With no number configured, WhatsApp asks the customer to pick a chat.
export const whatsappLink = (message: string): string =>
  `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;

export const orderLink = (bites: readonly FlavourId[], custom: readonly CustomRequest[]): string =>
  whatsappLink(orderMessage(bites, custom));
