import type { ImageMetadata } from 'astro';
import type { Flavour } from '../content/flavours';

// Ingredient cut-outs live in src/assets/ingredients/<name>.png, made from
// photos in photodump/ingredients/ by scripts/process-photos.mjs. A flavour
// whose ingredient has no photo yet shows none.
const photos = import.meta.glob<{ default: ImageMetadata }>('../assets/ingredients/*.png', { eager: true });

export const ingredientImage = (flavour: Flavour): ImageMetadata | undefined =>
  photos[`../assets/ingredients/${flavour.ingredientPhoto}.png`]?.default;
