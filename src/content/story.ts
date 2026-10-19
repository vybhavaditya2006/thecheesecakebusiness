// Our Story: the maker's own story, and how a bite is made.
import { brand } from './brand';

export const story = {
  label: 'Our Story',
  heading: 'A little about me',
  caption: `${brand.maker}, the person behind the pieces`,
  // TODO: placeholder stitched from the four moments of the story so far.
  // Replace with Shlok's full story, one string per paragraph.
  paragraphs: [
    'It started with one blueberry cheesecake for my nephew’s birthday. The pre-orders came in the very same day, before there was any business to speak of.',
    'A whole slice can be a little too much, so I made them bite-sized. One bite at a time, that is how this is being built.',
  ],
} as const;

// Shown wherever a detail is still waiting on Shlok.
export const unconfirmed = 'To be confirmed';

// TODO: placeholders. Replace each title and detail with the real step once
// Shlok confirms how a bite is made. Nothing here may be invented. `photo`
// is a kitchen photo (src/content/photos.ts) shown beside the step, if any.
export const howItsMade = {
  heading: 'How it’s made',
  steps: [
    { title: 'Step one', detail: unconfirmed, photo: 'kitchen-tray-b' },
    { title: 'Step two', detail: unconfirmed, photo: 'kitchen-tray-a' },
    { title: 'Step three', detail: unconfirmed, photo: 'kitchen-fridge' },
    { title: 'Step four', detail: unconfirmed, photo: undefined },
  ],
} as const;
