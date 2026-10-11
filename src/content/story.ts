// Our Story: the four-step timeline, the maker's own story, and how a bite
// is made.
import { brand } from './brand';

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

// Shown wherever a detail is still waiting on Shlok.
export const unconfirmed = 'To be confirmed';

// TODO: placeholders. Replace each title and detail with the real step once
// Shlok confirms how a bite is made. Nothing here may be invented.
export const howItsMade = {
  heading: 'How it’s made',
  steps: [
    { title: 'Step one', detail: unconfirmed },
    { title: 'Step two', detail: unconfirmed },
    { title: 'Step three', detail: unconfirmed },
    { title: 'Step four', detail: unconfirmed },
  ],
} as const;

// Real photos of the bites, side on. Only flavours with a photo in
// src/assets/photos/bite-<id>.webp are shown.
export const upClose = {
  label: 'Real photos',
  heading: 'The bites, up close',
} as const;
