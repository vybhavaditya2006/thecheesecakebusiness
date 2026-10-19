import clsx from 'clsx';
import { createContext, useContext, type ReactNode } from 'react';
import type { Flavour, FlavourId } from '../../content/flavours';

// Bite photo URLs per flavour, optimised by Astro in box.astro and handed
// to the island (React cannot use Astro's <Image> itself): an AVIF and a WebP
// srcset, and one WebP for browsers that read neither.
export type BiteImages = Partial<Record<FlavourId, { avif: string; webp: string; webpSet: string }>>;
// How wide a bite is drawn on /box, so the browser picks the right file.
const BITE_SIZES = '(min-width: 48rem) 80px, 17vw';
export const BiteImagesContext = createContext<BiteImages>({});

// One bite: a cut-out photo standing on a soft shadow. Without a photo for
// the flavour it is the placeholder: cream circle + flavour name, with a
// faint ring of the flavour's accent.
// `eager` only for the bites in the page's first screen.
export function Bite({ flavour, className, eager = false }: { flavour: Flavour; className?: string; eager?: boolean }) {
  const photo = useContext(BiteImagesContext)[flavour.id];

  if (photo) {
    return (
      <span className={clsx('bite-cutout relative block aspect-square', className)}>
        <span className="bite-cutout-shadow" aria-hidden="true" />
        <picture className="relative block size-full">
          <source srcSet={photo.avif} sizes={BITE_SIZES} type="image/avif" />
          <img
            src={photo.webp}
            srcSet={photo.webpSet}
            sizes={BITE_SIZES}
            alt={`${flavour.name} cheesecake bite`}
            width={192}
            height={192}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            className="size-full object-contain"
          />
        </picture>
      </span>
    );
  }

  return (
    <span
      className={clsx(
        'flex aspect-square items-center justify-center rounded-full border-[1.5px] border-wine bg-cream p-[6%] text-center font-display leading-none font-semibold',
        className,
      )}
      style={{ boxShadow: `inset 0 0 0 3px ${flavour.accent}40` }}
    >
      {flavour.name}
    </span>
  );
}

interface ChipProps {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

// A pill toggle used for every choice in the custom forms.
export function Chip({ selected, disabled, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'rounded-full border border-wine px-4 py-2 text-sm transition-colors disabled:opacity-35',
        selected ? 'bg-wine text-cream' : 'bg-cream text-wine',
      )}
    >
      {children}
    </button>
  );
}

// The pack of five, small: the paper tray with its five pieces, in the clear
// sleeve. For the list of packed boxes.
export function PackSketch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="none" stroke="currentColor" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="16" width="112" height="18" rx="4" fill="#fbf8f3" strokeWidth="1.5" />
      {[16, 38, 60, 82, 104].map((x) => (
        <ellipse key={x} cx={x} cy="21" rx="8" ry="6" fill="currentColor" fillOpacity="0.18" stroke="none" />
      ))}
      <rect x="2" y="6" width="116" height="30" rx="3" fill="#fff" fillOpacity="0.25" strokeWidth="1" strokeOpacity="0.5" />
      <path d="M8 11h34" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
