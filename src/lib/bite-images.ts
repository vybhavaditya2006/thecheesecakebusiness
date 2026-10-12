import type { ImageMetadata } from 'astro';
import type { FlavourId } from '../content/flavours';

// Bite photos live in src/assets/bites/<flavour id>.webp. A flavour without a
// photo yet falls back to the cream-circle placeholder.
//
// TODO: coffee.webp is a mock-up, not a photograph: a real photo of a
// Blueberry bite with the compote painted out of its top and the cream turned
// light brown, which is how Coffee is described (light brown, nothing on
// top). Replace it with a real photo, cut out the same way, once Shlok has
// made and photographed one. The other four are real photos.
const photos = import.meta.glob<{ default: ImageMetadata }>('../assets/bites/*.webp', {
  eager: true,
});

export const biteImage = (id: FlavourId): ImageMetadata | undefined =>
  photos[`../assets/bites/${id}.webp`]?.default;
