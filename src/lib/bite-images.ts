import type { ImageMetadata } from 'astro';
import type { FlavourId } from '../content/flavours';

// Bite photos live in src/assets/bites/<flavour id>.webp. A flavour without a
// photo yet falls back to the cream-circle placeholder.
//
// TODO: oreo.webp and coffee.webp are mock-ups, not photographs. Each is a real
// photo of another flavour with only its topping recoloured (Biscoff crumb to
// Oreo crumb, blueberry compote to a coffee glaze). Replace them with real
// photos of those two flavours, cut out the same way, when they exist.
const photos = import.meta.glob<{ default: ImageMetadata }>('../assets/bites/*.webp', {
  eager: true,
});

export const biteImage = (id: FlavourId): ImageMetadata | undefined =>
  photos[`../assets/bites/${id}.webp`]?.default;
