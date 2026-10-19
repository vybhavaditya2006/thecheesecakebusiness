// Good to Know: the practical facts. This page is their one home; other pages
// only point here or show a shorter form (a number, a label, a link).
import { pricing } from './pricing';

export const delivery = {
  area: 'Nagarabhavi, Bengaluru',
  city: 'Bengaluru',
  region: 'Karnataka',
  country: 'IN',
  pincode: '560072',
  // Kitchen location as [lat, lng] (Plus Code 7J4VXG79+8X).
  kitchen: [12.96331, 77.51994] as const,
  freeRadiusKm: 5,
  heading: 'Where we deliver',
  freeNote: 'Free delivery within 5 km of Nagarabhavi, Bengaluru 560072.',
  paidNote: 'Beyond 5 km delivery is paid; the charge is confirmed on WhatsApp.',
  // The short form, for the footer and the order summary.
  short: 'Free within 5 km',
  minimumOrder: 0,
} as const;

export const arrival = {
  heading: 'When it arrives',
  notes: [
    'Same day, if what you picked is in stock.',
    'Otherwise it is made to order, and the day is confirmed on WhatsApp.',
  ],
  short: 'Same day if in stock',
  // Both ways it can go, for the icon row.
  shortChoice: 'Same day or made to order',
} as const;

export const paymentMethods = ['UPI', 'cash'] as const;

export const payment = {
  heading: 'How to pay',
  notes: [`Pay by ${paymentMethods.join(' or ')}.`, 'Payment is sorted out on WhatsApp, along with your order.'],
  short: paymentMethods.join(' or '),
} as const;

export const contact = {
  heading: 'Say hello',
  // Shlok's WhatsApp number, in international format without the "+".
  whatsapp: '916362813519',
  whatsappNote: 'Orders and payment happen here.',
  // For calls: the same number as WhatsApp, as it is written and as a tel: link.
  phone: '+91 63628 13519',
  tel: '+916362813519',
  // For questions only; orders stay on WhatsApp.
  email: 'shlokajaypawar@gmail.com',
  emailNote: 'For questions only.',
  // Both at once, above the contact strip on Good to Know.
  summary: 'Orders and payment happen on WhatsApp. Email is for questions only.',
} as const;

export interface Question {
  question: string;
  answer: string;
  // An optional link to the page that explains it in full.
  link?: { page: 'custom'; label: string };
}

// Only what the sections above do not already answer.
export const faq: readonly Question[] = [
  {
    question: 'Are they eggless?',
    answer: 'Yes.',
  },
  {
    question: 'Is there a minimum order?',
    answer: 'No. Order a single piece if that is all you are craving.',
  },
  {
    question: 'Can I mix flavours in a box?',
    answer: `Yes. A box of ${pricing.box.bites} is any mix you like.`,
  },
  {
    question: 'Do you take custom orders?',
    answer: 'Yes, from a bite of your own design to a platter for a party.',
    link: { page: 'custom', label: 'See Custom & Gifts' },
  },
];
