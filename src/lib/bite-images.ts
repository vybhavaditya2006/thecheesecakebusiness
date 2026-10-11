import type { ImageMetadata } from 'astro';
import type { FlavourId } from '../content/flavours';

// Bite photos live in src/assets/bites/<flavour id>.webp. A flavour without a
// photo yet falls back to the cream-circle placeholder.
const photos = import.meta.glob<{ default: ImageMetadata }>('../assets/bites/*.webp', {
  eager: true,
});

export const biteImage = (id: FlavourId): ImageMetadata | undefined =>
  photos[`../assets/bites/${id}.webp`]?.default;
