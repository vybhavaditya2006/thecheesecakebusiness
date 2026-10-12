import { contact } from '../content/info';

// A link that opens WhatsApp with a message written out. With no number
// configured, WhatsApp asks the customer to pick a chat.
export const whatsappLink = (message: string): string =>
  `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;
