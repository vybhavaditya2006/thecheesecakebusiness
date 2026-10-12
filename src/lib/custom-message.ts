import { brand } from '../content/brand';
import { customPage } from '../content/custom';

// The WhatsApp message for a custom order: what it is, each choice on its own
// line, and the occasion if one was picked.
export const customMessage = (option: string, choices: readonly string[], occasion?: string): string =>
  [
    `Hi ${brand.maker}! ${customPage.opening}`,
    '',
    option,
    ...choices,
    ...(occasion ? [`Occasion: ${occasion}`] : []),
    '',
    customPage.closing,
  ].join('\n');
