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
  // The pitch, broken up for the "Why bites" scene.
  whyBites: {
    heading: 'Why bites',
    before: 'Whole cake: too much',
    after: '1 bite: just right',
    reasons: [
      { title: 'Craving satisfied.', line: 'One bite is enough to answer the craving.' },
      {
        title: 'Not overeating.',
        line: 'A whole cheesecake is too much to finish, and too heavy.',
      },
      {
        title: 'Kinder on your wallet.',
        line: 'Whole cheesecakes are expensive; a bite costs less.',
      },
    ],
  },
  // The same pitch as three lines, for the 3D cake scene on Home.
  wholeCake: ['A whole cheesecake?', 'Too much to finish.', 'Too heavy. Too pricey.'],
  // Script logo SVG, imported from src/assets once it exists.
  logoPath: 'src/assets/logo.svg',
  // Placeholder until the real domain is bought.
  domain: 'miette.example',
} as const;

export type Brand = typeof brand;
