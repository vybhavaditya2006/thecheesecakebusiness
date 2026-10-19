import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from 'motion/react';
import { useRef } from 'react';
import { flavourById, flavours } from '../../content/flavours';
import { formatPrice, priceBreakdown, pricing } from '../../content/pricing';
import {
  $bites,
  $singlesMode,
  addBite,
  countByFlavour,
  removeBite,
  removeBiteAt,
  removeBox,
} from '../../lib/order-store';
import { Bite, PackSketch } from './parts';
import { useBox3D } from './useBox3D';

const BOX = pricing.box.bites;

// Pack artwork units, shared by the SVG layers and the piece slots.
const STAGE = { width: 360, height: 250 };
const SLOT = { size: 58, pitch: 62, centreY: 112 };

const cupX = (slot: number): number => STAGE.width / 2 + (slot - (BOX - 1) / 2) * SLOT.pitch;
const slotStyle = (slot: number) => ({
  left: `${((cupX(slot) - SLOT.size / 2) / STAGE.width) * 100}%`,
  top: `${((SLOT.centreY - SLOT.size / 2) / STAGE.height) * 100}%`,
  width: `${(SLOT.size / STAGE.width) * 100}%`,
});

const svgProps = {
  viewBox: `0 0 ${STAGE.width} ${STAGE.height}`,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
  'aria-hidden': true,
} as const;

// Calm easing for everything here (v3): out, no bounce.
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export default function BoxBuilder() {
  const bites = useStore($bites);
  const singles = useStore($singlesMode);

  const packedCount = Math.floor(bites.length / BOX);
  const current = bites.slice(packedCount * BOX);
  const packed = Array.from({ length: packedCount }, (_, box) => bites.slice(box * BOX, (box + 1) * BOX));

  // A full box stays on show, in its sleeve, until a piece is taken out of it
  // or a flavour starts the next one.
  const sleeved = current.length === 0 && packedCount > 0;
  const shown = sleeved ? packed[packedCount - 1]! : current;
  const boxNumber = sleeved ? packedCount - 1 : packedCount;
  const visiblePacked = sleeved ? packed.slice(0, -1) : packed;
  const { toNextBox } = priceBreakdown(bites.length);

  const stage = useRef<HTMLDivElement>(null);
  const mount3D = useRef<HTMLDivElement>(null);

  // The 3D pack, when this device can run it; the drawn pack otherwise.
  const three = useBox3D(stage, mount3D, shown, sleeved, boxNumber, !singles);
  const flat = three ? 'opacity-0' : '';

  return (
    <div data-box-builder>
      {singles ? (
        <ul className="mx-auto max-w-md space-y-3">
          {flavours.map((flavour) => {
            const count = bites.filter((id) => id === flavour.id).length;
            return (
              <li key={flavour.id} className="flex items-center gap-4 rounded-2xl border border-wine/25 p-3">
                <Bite flavour={flavour} className="w-14 shrink-0 text-[0.6rem]" />
                <span className="flex-1 font-display text-xl">{flavour.name}</span>
                <button
                  type="button"
                  className="size-10 rounded-full border border-wine text-xl leading-none disabled:opacity-30"
                  aria-label={`Remove one ${flavour.name}`}
                  disabled={count === 0}
                  onClick={() => removeBite(flavour.id)}
                >
                  −
                </button>
                <motion.span
                  key={count}
                  className="w-6 text-center font-display text-2xl font-semibold"
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                  aria-label={`${count} ${flavour.name}`}
                >
                  {count}
                </motion.span>
                <button
                  type="button"
                  className="size-10 rounded-full bg-wine text-xl leading-none text-cream"
                  aria-label={`Add one ${flavour.name}`}
                  onClick={() => addBite(flavour.id)}
                >
                  +
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <>
          {/* The pack: the tray behind, pieces in its cups, the sleeve over them. */}
          <div
            ref={stage}
            className="relative mx-auto w-full max-w-[19rem] touch-pan-y text-wine select-none sm:mt-6 sm:max-w-[26rem]"
            style={{ aspectRatio: `${STAGE.width}/${STAGE.height}` }}
          >
            {/* The 3D pack mounts here. It reaches above the tray so pieces can drop in. */}
            <div ref={mount3D} className="pointer-events-none absolute -inset-x-[5%] -top-[40%] -bottom-[4%]" />

            {/* The paper tray: a long white card with five round cups. */}
            <svg className={`absolute inset-0 size-full overflow-visible ${flat}`} {...svgProps}>
              <ellipse cx="180" cy="160" rx="166" ry="8" fill="currentColor" stroke="none" opacity="0.1" />
              <rect x="16" y="86" width="328" height="64" rx="10" fill="#fbf8f3" />
              {Array.from({ length: BOX }, (_, slot) => (
                <ellipse key={slot} cx={cupX(slot)} cy="118" rx="26" ry="17" fill="#efe8de" strokeWidth="1.2" />
              ))}
            </svg>

            {/* A new box slides in as the full one slides away. */}
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={boxNumber}
                className="absolute inset-0"
                initial={{ x: '110%' }}
                animate={{ x: 0 }}
                exit={{ x: '-110%' }}
                transition={{ duration: 0.5, ease: EASE_OUT }}
              >
                {Array.from({ length: BOX }, (_, slot) => {
                  const id = shown[slot];
                  const flavour = id && flavourById(id);
                  return (
                    <div key={slot} className="absolute aspect-square" style={three?.slots[slot] ?? slotStyle(slot)}>
                      <AnimatePresence initial={false}>
                        {flavour && (
                          <motion.button
                            key={`${slot}-${flavour.id}`}
                            type="button"
                            className="absolute inset-0"
                            aria-label={`Take ${flavour.name} out of the box`}
                            onClick={(event) => {
                              // The piece's button is about to vanish; hand keyboard
                              // focus to that flavour's "add" button instead.
                              const builder = event.currentTarget.closest('[data-box-builder]');
                              removeBiteAt(boxNumber * BOX + slot);
                              builder?.querySelector<HTMLElement>(`[data-add="${flavour.id}"]`)?.focus();
                            }}
                            // Drops into its cup and settles: ease out, no bounce.
                            initial={{ y: '-70%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '-60%', opacity: 0 }}
                            transition={{ duration: 0.45, ease: EASE_OUT }}
                          >
                            <Bite flavour={flavour} className={`size-full text-[clamp(0.5rem,2.4vw,0.72rem)] ${flat}`} />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* The clear sleeve: waits off to the side and slides over the full tray. */}
            <div className={`pointer-events-none absolute -inset-y-[10%] inset-x-0 overflow-hidden ${flat}`}>
              <motion.svg
                className="absolute inset-0 size-full overflow-visible"
                viewBox={`0 -25 ${STAGE.width} ${STAGE.height * 1.2}`}
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
                initial={false}
                animate={{ x: sleeved ? '0%' : '105%' }}
                transition={{ duration: sleeved ? 1 : 0.7, ease: sleeved ? EASE_OUT : EASE_IN_OUT }}
              >
                <rect x="10" y="58" width="340" height="98" rx="6" fill="#fff" fillOpacity="0.22" strokeWidth="1.2" strokeOpacity="0.45" />
                <path d="M28 70h110M222 146h100" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
              </motion.svg>
            </div>
          </div>

          <p className="mt-3 text-center text-sm sm:mt-6" aria-live="polite">
            {sleeved
              ? 'Box of five packed. Tap a piece to take it out, or a flavour to start the next box.'
              : shown.length === 0
                ? 'Tap a flavour to drop it in the box.'
                : `${shown.length} of ${BOX} in the box. Tap a piece to take it out.`}
          </p>

          <ul className="mx-auto mt-3 flex max-w-md justify-center gap-2 sm:mt-5 sm:gap-4">
            {flavours.map((flavour) => (
              <li key={flavour.id} className="w-1/5 max-w-20">
                <motion.button
                  type="button"
                  className="block w-full"
                  aria-label={`Add ${flavour.name} to the box`}
                  data-add={flavour.id}
                  onClick={() => addBite(flavour.id)}
                >
                  <Bite flavour={flavour} eager className="w-full text-[clamp(0.55rem,2.6vw,0.8rem)]" />
                </motion.button>
              </li>
            ))}
          </ul>
        </>
      )}

      <label className="mx-auto mt-6 flex w-fit cursor-pointer items-center gap-3">
        <span className="label-caps">Just singles</span>
        <button
          type="button"
          role="switch"
          aria-checked={singles}
          onClick={() => $singlesMode.set(!singles)}
          className={`relative h-7 w-12 rounded-full border border-wine transition-colors ${singles ? 'bg-wine' : 'bg-cream'}`}
        >
          <motion.span
            className={`absolute top-1 left-1 size-[1.125rem] rounded-full ${singles ? 'bg-cream' : 'bg-wine'}`}
            animate={{ x: singles ? 20 : 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          />
        </button>
      </label>

      {toNextBox > 0 && (
        <p className="mx-auto mt-6 w-fit rounded-full bg-wine px-4 py-2 text-center text-sm text-cream">
          Add {toNextBox} more and they become a box for {formatPrice(priceBreakdown(BOX).total)}.
        </p>
      )}

      {!singles && visiblePacked.length > 0 && (
        <ul className="mx-auto mt-8 max-w-md space-y-2" aria-label="Packed boxes">
          <AnimatePresence initial={false}>
            {visiblePacked.map((box, index) => (
              <motion.li
                key={index}
                className="flex items-center gap-3 rounded-2xl border border-wine/25 px-4 py-3"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
              >
                <PackSketch className="w-12 shrink-0" />
                <span className="flex-1 text-sm">
                  <strong className="label-caps block">{pricing.box.name}</strong>
                  {countByFlavour(box)
                    .map(({ flavour, count }) => `${flavour.name} × ${count}`)
                    .join(', ')}
                </span>
                <button
                  type="button"
                  className="size-8 rounded-full border border-wine leading-none"
                  aria-label={`Remove box ${index + 1}`}
                  onClick={() => removeBox(index)}
                >
                  ×
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

    </div>
  );
}
