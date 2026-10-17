import type { ImageMetadata } from 'astro';
import type { FlavourId } from '../content/flavours';

// Bite cut-outs live in src/assets/bites/<flavour id>.png, made from the real
// photos by scripts/process-photos.mjs.
//
// TODO: Coffee has no photo yet. Until it does, it is shown as the modelled
// 3D bite: live in the 3D scenes, and as a still of it
// (src/assets/bites/renders/coffee.png, drawn by the same script) everywhere
// else. Once Shlok has made and photographed a Coffee bite, add it to the
// script's `pieces` and remove it from `stills`.
const photos = import.meta.glob<{ default: ImageMetadata }>('../assets/bites/*.png', { eager: true });
const renders = import.meta.glob<{ default: ImageMetadata }>('../assets/bites/renders/*.png', { eager: true });

// The real photo of the bite, if there is one.
export const bitePhoto = (id: FlavourId): ImageMetadata | undefined => photos[`../assets/bites/${id}.png`]?.default;

// What to show for the bite: its photo, or else the still of the 3D bite.
export const biteImage = (id: FlavourId): ImageMetadata | undefined =>
  bitePhoto(id) ?? renders[`../assets/bites/renders/${id}.png`]?.default;
