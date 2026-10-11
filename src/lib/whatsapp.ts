import { brand } from '../content/brand';
import { customPriceNote } from '../content/custom';
import type { FlavourId } from '../content/flavours';
import { formatPrice, priceBreakdown } from '../content/pricing';
import { contact } from '../content/site';
import { countByFlavour, type CustomRequest } from './order-store';

const plural = (count: number, word: string, many = `${word}s`): string =>
  `${count} ${count === 1 ? word : many}`;

export const orderMessage = (bites: readonly FlavourId[], custom: readonly CustomRequest[]): string => {
  const lines = [`Hi ${brand.name}! I'd like to order:`];

  if (bites.length) {
    const { boxes, singles, total } = priceBreakdown(bites.length);
    const charged = [boxes && plural(boxes, 'box', 'boxes'),singles && plural(singles, 'single')]
      .filter(Boolean)
      .join(' + ');

    lines.push(
      ...countByFlavour(bites).map(({ flavour, count }) => `• ${flavour.name} × ${count}`),
      `${plural(bites.length, 'bite')} (${charged}): ${formatPrice(total)}`,
    );
  }

  for (const request of custom) {
    lines.push('', `${request.title} (${customPriceNote.toLowerCase()})`);
    lines.push(...request.details.map((detail) => `• ${detail}`));
  }

  return lines.join('\n');
};

// With no number configured, WhatsApp asks the customer to pick a chat.
export const whatsappLink = (message: string): string =>
  `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;

export const orderLink = (bites: readonly FlavourId[], custom: readonly CustomRequest[]): string =>
  whatsappLink(orderMessage(bites, custom));
