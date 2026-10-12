import type { ImageMetadata } from 'astro';
import type { FlavourId } from '../content/flavours';

// Bite photos live in src/assets/bites/<flavour id>.webp. A flavour without a
// photo yet falls back to the cream-circle placeholder.
//
// TODO: coffee.webp is a mock-up, not a photograph: a real photo of a
// Blueberry bite with only its topping recoloured to a coffee glaze. Replace
// it with a real photo of the Coffee bite, cut out the same way, when one
// exists. The other four are real photos.
const photos = import.meta.glob<{ default: ImageMetadata }>('../assets/bites/*.webp', {
  eager: true,
});

export const biteImage = (id: FlavourId): ImageMetadata | undefined =>
  photos[`../assets/bites/${id}.webp`]?.default;
