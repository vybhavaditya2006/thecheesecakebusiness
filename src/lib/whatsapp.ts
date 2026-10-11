import { brand } from '../content/brand';
import { flavours } from '../content/flavours';
import { formatPrice, priceFor } from '../content/pricing';
import { contact } from '../content/site';
import type { OrderItems } from './order-store';

export const orderMessage = (items: OrderItems): string => {
  const lines = flavours
    .filter((flavour) => items[flavour.id] > 0)
    .map((flavour) => `• ${flavour.name} × ${items[flavour.id]}`);
  const bites = flavours.reduce((sum, flavour) => sum + items[flavour.id], 0);

  return [
    `Hi ${brand.name}! I'd like to order:`,
    ...lines,
    `Total: ${bites} ${bites === 1 ? 'bite' : 'bites'} — ${formatPrice(priceFor(bites))}`,
  ].join('\n');
};

// With no number configured, WhatsApp asks the customer to pick a chat.
export const whatsappLink = (message: string): string =>
  `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;

export const orderLink = (items: OrderItems): string => whatsappLink(orderMessage(items));
