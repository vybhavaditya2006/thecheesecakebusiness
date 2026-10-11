import clsx from 'clsx';
import { createContext, useContext, type ReactNode } from 'react';
import type { Flavour, FlavourId } from '../../content/flavours';

// Bite photo URLs per flavour, optimised by Astro in order.astro and handed
// to the island (React cannot use Astro's <Image> itself).
export type BiteImages = Partial<Record<FlavourId, { avif: string; webp: string }>>;
export const BiteImagesContext = createContext<BiteImages>({});

// One bite: a cut-out photo standing on a soft shadow. Without a photo for
// the flavour it is the placeholder: cream circle + flavour name, with a
// faint ring of the flavour's accent.
export function Bite({ flavour, className }: { flavour: Flavour; className?: string }) {
  const photo = useContext(BiteImagesContext)[flavour.id];

  if (photo) {
    return (
      <span className={clsx('bite-cutout relative block aspect-square', className)}>
        <span className="bite-cutout-shadow" aria-hidden="true" />
        <picture className="relative block size-full">
          <source srcSet={photo.avif} type="image/avif" />
          <img
            src={photo.webp}
            alt={`${flavour.name} cheesecake bite`}
            width={192}
            height={192}
            loading="lazy"
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
        'rounded-full border border-wine px-4 py-2 text-sm transition-transform active:scale-95 disabled:opacity-35',
        selected ? 'bg-wine text-cream' : 'bg-cream text-wine',
      )}
    >
      {children}
    </button>
  );
}

// The box of five, closed and tied, for the send-off.
export function ClosedBox({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 60 360 180"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path className="fill-cream" d="M34 82H326L346 140H14Z" />
      <path className="fill-cream" d="M14 140H346L338 228H22Z" />
      <path d="M22 183H338" strokeWidth="24" strokeLinecap="butt" />
      <svg x="125" y="158" width="110" height="57" viewBox="0 0 120 62">
        <BowPaths />
      </svg>
    </svg>
  );
}

// The bow from Bow.astro, for use inside React-rendered SVGs (120 × 62 units).
export function BowPaths() {
  return (
    <>
      <path className="fill-cream" d="M54 26C40 6 14 4 10 18C7 30 34 38 54 29Z" />
      <path className="fill-cream" d="M66 26C80 6 106 4 110 18C113 30 86 38 66 29Z" />
      <path d="M52 26C42 20 30 16 20 19" strokeWidth="1.2" />
      <path d="M68 26C78 20 90 16 100 19" strokeWidth="1.2" />
      <path className="fill-cream" d="M56 33C51 43 43 51 33 58L40 44" />
      <path className="fill-cream" d="M64 33C69 43 77 51 87 58L80 44" />
      <ellipse className="fill-wine" cx="60" cy="27" rx="6.5" ry="7.5" />
    </>
  );
}
