// The site's pages, navigation and search descriptions.
import { brand } from './brand';
import { flavours } from './flavours';
import { delivery } from './info';
import { formatPrice, pricing, saleActive } from './pricing';

export const paths = {
  home: '/',
  flavours: '/flavours',
  box: '/box',
  story: '/story',
  custom: '/custom',
  info: '/info',
} as const;

export const orderPath = paths.box;
export const boxLabel = 'Build your box';

// The links in the nav and the footer, in order.
export const navLinks = [
  { href: paths.flavours, label: 'Flavours' },
  { href: paths.story, label: 'Our Story' },
  { href: paths.custom, label: 'Custom & Gifts' },
  { href: paths.info, label: 'Good to Know' },
] as const;

// How each page arrives once the wine curtain has covered the last one.
export type Entrance = 'slide' | 'roll' | 'turn' | 'untie' | 'pin' | 'lid';

const priceKey = saleActive ? 'offer' : 'regular';
const { city } = delivery;

// Page titles and descriptions for search results and link previews.
export const seo = {
  home: {
    title: `${brand.name}: cheesecake bites in ${city}`,
    description: `Bite-sized cheesecakes by ${brand.maker} in ${city}. ${flavours.length} flavours from ${formatPrice(pricing.single[priceKey])} a piece, or a box of ${pricing.box.bites} for ${formatPrice(pricing.box[priceKey])}.`,
  },
  flavours: {
    title: `Flavours · ${brand.name}`,
    description: `${flavours.map((flavour) => flavour.name).join(', ')}: every flavour of cheesecake bite, all at the same price.`,
  },
  box: {
    title: `${boxLabel} · ${brand.name}`,
    description: `Pick any ${pricing.box.bites} pieces for ${formatPrice(pricing.box[priceKey])}, or single pieces at ${formatPrice(pricing.single[priceKey])}, and send the order on WhatsApp.`,
  },
  story: {
    title: `Our Story · ${brand.name}`,
    description: `How ${brand.maker} went from one birthday cheesecake to bite-sized ones, and how they are made.`,
  },
  custom: {
    title: `Custom & Gifts · ${brand.name}`,
    description: 'Build your own bite, a Half & Half cake, gift boxes and party platters, made to order.',
  },
  info: {
    title: `Good to Know · ${brand.name}`,
    description: `Delivery in ${city}, when your order arrives, how to pay and how to reach ${brand.maker}.`,
  },
  notFound: {
    title: `Page not found · ${brand.name}`,
    description: 'This page does not exist.',
  },
  // Generated at build time by src/pages/og.png.ts.
  shareImage: {
    path: '/og.png',
    width: 1200,
    height: 630,
    alt: `${brand.name}: a box of five cheesecake bites tied with a bow`,
  },
} as const;

// Link that opens the custom tab of the box builder on one option.
export const customOrderLink = (optionId: string): string =>
  `${paths.box}?tab=custom&type=${optionId}`;

// Home: how ordering works, in three steps.
export const ordering = {
  heading: 'How ordering works',
  steps: [
    { sketch: 'box', title: 'Build your box', detail: 'Five pieces, any flavours. Or only the one.' },
    {
      sketch: 'phone',
      title: 'Send it on WhatsApp',
      detail: `Your order opens in a chat with ${brand.maker}, already written out.`,
    },
    {
      sketch: 'door',
      title: 'Open the door',
      detail: `${brand.maker} confirms the day and brings it over.`,
    },
  ],
} as const;

export const notFound = {
  heading: 'Someone ate this page',
  detail: 'There is nothing here but crumbs.',
} as const;
