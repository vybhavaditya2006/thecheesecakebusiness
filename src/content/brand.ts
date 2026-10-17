// Single source of truth for the brand. The name is a working name and may
// change, so nothing else in the project should hard-code it.
export const brand = {
  name: 'Miette',
  maker: 'Shlok',
  descriptor: 'Cheesecake bites by Shlok',
  tagline: 'A little, well made.',
  campaign: 'Diwali & Dussehra launch special',
  pitch:
    'Whole cheesecakes are expensive, too much to finish, and too heavy. Bite-sized portions satisfy the craving without overeating, and cost less.',
  // The pitch as three short lines, for "Why pieces" on Home.
  whyPieces: {
    heading: 'Why pieces',
    lines: ['Craving satisfied.', 'Not overeating.', 'Kinder on your wallet.'],
  },
  // Script logo SVG, imported from src/assets once it exists.
  logoPath: 'src/assets/logo.svg',
  // Placeholder until the real domain is bought.
  domain: 'miette.example',
} as const;

export type Brand = typeof brand;
