import { contact } from '../content/info';

// encodeURIComponent leaves ! ' ( ) * as they are. They are legal in a link,
// but some apps stop a link at an apostrophe or a bracket when they pass it
// on, so they are encoded too. Line breaks go as %0A, which WhatsApp on
// Android, iPhone and the web all turn back into new lines.
const encode = (text: string): string =>
  encodeURIComponent(text).replace(/[!'()*]/g, (mark) => `%${mark.charCodeAt(0).toString(16).toUpperCase()}`);

// A link that opens WhatsApp with a message written out. With no number
// configured, WhatsApp asks the customer to pick a chat.
export const whatsappLink = (message: string): string => `https://wa.me/${contact.whatsapp}?text=${encode(message)}`;
