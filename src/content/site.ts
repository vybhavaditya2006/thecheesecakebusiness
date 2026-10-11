import { brand } from './brand';
import { customOptions } from './custom';
import { flavours } from './flavours';
import { formatPrice, pricing, saleActive } from './pricing';

export const delivery = {
  area: 'Nagarabhavi, Bengaluru',
  city: 'Bengaluru',
  region: 'Karnataka',
  country: 'IN',
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
  // Orders are emailed to the address that key was created for.
  web3formsKey: import.meta.env?.PUBLIC_WEB3FORMS_KEY ?? '',
  // Optional Google Apps Script web app that gets a copy of every order,
  // set as PUBLIC_ORDER_SCRIPT_URL in .env.
  orderScriptUrl: import.meta.env?.PUBLIC_ORDER_SCRIPT_URL ?? '',
} as const;

// What "Check my address" says, by straight-line distance from the kitchen.
export const deliveryVerdict = {
  free: 'Free delivery',
  outside: `Outside ${delivery.freeRadiusKm} km: a delivery charge applies, confirmed on WhatsApp`,
} as const;

export const orderPath = '/order';

const priceKey = saleActive ? 'offer' : 'regular';

// Page titles and descriptions for search results and link previews.
export const seo = {
  home: {
    title: `${brand.name}: cheesecake bites in ${delivery.city}`,
    description: `Bite-sized cheesecakes by ${brand.maker} in ${delivery.area}. ${flavours.length} flavours from ${formatPrice(pricing.single[priceKey])} a bite, or a box of ${pricing.box.bites} for ${formatPrice(pricing.box[priceKey])}. Free delivery within ${delivery.freeRadiusKm} km.`,
  },
  order: {
    title: `Order cheesecake bites · ${brand.name}`,
    description: `Pack a box of ${pricing.box.bites} for ${formatPrice(pricing.box[priceKey])}, pick singles, or ask for a custom box or party platter. ${delivery.freeNote}`,
  },
  // Generated at build time by src/pages/og.png.ts.
  shareImage: {
    path: '/og.png',
    width: 1200,
    height: 630,
    alt: `${brand.name}: a box of five cheesecake bites tied with a bow`,
  },
} as const;

// Link that opens the custom-order tab on the order page for one option.
export const customOrderLink = (optionId: string): string =>
  `${orderPath}?tab=custom&type=${optionId}`;

// "A little about me": the four-step timeline, then the maker's own story.
export const story = {
  heading: 'A little about me',
  steps: [
    { sketch: 'cake', title: 'One blueberry cheesecake for my nephew’s birthday' },
    { sketch: 'phone', title: 'Pre-orders the very same day, without a business' },
    {
      sketch: 'slice',
      title: 'A whole slice can be a little too much. So why not bite-sized?',
    },
    { sketch: 'box', title: `${brand.name}: building a dream one bite at a time` },
  ],
  caption: `${brand.maker}, the person behind the bites`,
  speechBubble: 'no judgement here!',
  // TODO: placeholder stitched from the timeline above. Replace with
  // Shlok's full story, one string per paragraph.
  paragraphs: [
    'It started with one blueberry cheesecake for my nephew’s birthday. The pre-orders came in the very same day, before there was any business to speak of.',
    'A whole slice can be a little too much, so I made them bite-sized. One bite at a time, that is how this is being built.',
  ],
} as const;

export const faq = [
  {
    question: 'Where do you deliver?',
    answer: `${delivery.freeNote} ${delivery.paidNote}`,
  },
  {
    question: 'Is there a minimum order?',
    answer: 'No. Order a single bite if that is all you are craving.',
  },
  {
    question: 'How do I pay?',
    answer: `${paymentMethods.join(' or ')}.`,
  },
  {
    question: 'Can I mix flavours in a box?',
    answer: `Yes. A box of ${pricing.box.bites} is any mix you like, and every flavour costs the same.`,
  },
  {
    question: 'Do you take custom orders?',
    answer: `Yes: ${customOptions.map((option) => option.name.toLowerCase()).join(', ')}. Tell us what you have in mind and we will confirm the details on WhatsApp.`,
  },
] as const;

export const pages = [
  { path: '/', label: 'Home' },
  { path: orderPath, label: 'Order' },
] as const;

// Jump links to sections of the home page.
export const jumpLinks = [
  { href: '/#flavours', label: 'Flavours' },
  { href: '/#story', label: 'Our story' },
] as const;
