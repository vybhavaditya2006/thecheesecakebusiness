export const delivery = {
  area: 'Nagarabhavi, Bengaluru',
  pincode: '560072',
  // Kitchen location as [lat, lng] (Plus Code 7J4VXG79+8X).
  kitchen: [12.96331, 77.51994] as const,
  freeRadiusKm: 5,
  freeNote: 'Free delivery within 5 km of Nagarabhavi, Bengaluru 560072.',
  paidNote: 'Beyond 5 km delivery is paid; the charge is confirmed on WhatsApp.',
  minimumOrder: 0,
  minimumOrderNote: 'No minimum order.',
} as const;

export const paymentMethods = ['UPI', 'Cash on delivery'] as const;

export const contact = {
  // WhatsApp number in international format without "+", e.g. 919876543210.
  // TODO: not provided yet.
  whatsapp: '',
  // Web3Forms access key for order emails, set as PUBLIC_WEB3FORMS_KEY in .env.
  web3formsKey: import.meta.env?.PUBLIC_WEB3FORMS_KEY ?? '',
} as const;

export const orderPath = '/order';

export const pages = [
  { path: '/', label: 'Home' },
  { path: orderPath, label: 'Order' },
] as const;

// Jump links to sections of the home page.
export const jumpLinks = [
  { href: '/#flavours', label: 'Flavours' },
  { href: '/#story', label: 'Our story' },
] as const;
