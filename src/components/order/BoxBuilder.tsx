import { useStore } from '@nanostores/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { flavourById, flavours, type FlavourId } from '../../content/flavours';
import { formatPrice, priceBreakdown, pricing } from '../../content/pricing';
import { booking } from '../../content/site';
import {
  $bites,
  $singlesMode,
  addBite,
  countByFlavour,
  removeBite,
  removeBiteAt,
  removeBox,
} from '../../lib/order-store';
import CrumbMonster from '../monster/CrumbMonster';
import { Bite, BowPaths } from './parts';
import { useBox3D } from './useBox3D';

const BOX = pricing.box.bites;

// Box artwork units, shared by the SVG layers and the bite slots.
const STAGE = { width: 360, height: 250 };
const SLOT = { size: 58, pitch: 62, centreY: 112 };

const slotStyle = (slot: number) => ({
  left: `${((STAGE.width / 2 + (slot - (BOX - 1) / 2) * SLOT.pitch - SLOT.size / 2) / STAGE.width) * 100}%`,
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

// How long the packed box stays on show before a fresh one opens (ms).
const CLOSING = { hideBites: 1900, reopen: 2300 };
// How long a bite is in the air between a flavour button and its slot (s).
const FLIGHT = 0.55;

interface Flyer {
  key: number;
  id: FlavourId;
  from: { x: number; y: number };
  to: { x: number; y: number };
  size: number;
}

const centre = (element: Element) => {
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2, width: box.width };
};

export default function BoxBuilder() {
  const bites = useStore($bites);
  const singles = useStore($singlesMode);
  const reduceMotion = useReducedMotion();

  const packedCount = Math.floor(bites.length / BOX);
  const current = bites.slice(packedCount * BOX);
  const packed = Array.from({ length: packedCount }, (_, box) => bites.slice(box * BOX, (box + 1) * BOX));

  // While a just-filled box is being closed, it stays on show.
  const [closing, setClosing] = useState<FlavourId[] | null>(null);
  const [lidShut, setLidShut] = useState(false);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const slots = useRef<(HTMLDivElement | null)[]>([]);
  const stage = useRef<HTMLDivElement>(null);
  const mount3D = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const nextKey = useRef(0);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const shown = closing ?? current;
  const boxNumber = closing ? packedCount - 1 : packedCount;
  const visiblePacked = closing ? packed.slice(0, -1) : packed;
  const { toNextBox } = priceBreakdown(bites.length);

  // The 3D box, when this device can run it; the drawn box otherwise.
  const three = useBox3D(stage, mount3D, shown, lidShut, !singles);
  const flat = three ? 'opacity-0' : '';
  // The top of the box's front wall, in percent of the stage's height.
  const rim = three?.rim ?? 56;

  // A bite has landed: add it, and close the box if that was the fifth.
  const land = (id: FlavourId): void => {
    const all = $bites.get();
    const inBox = all.length % BOX;

    if (inBox === BOX - 1 && !reduceMotion) {
      setClosing([...all.slice(all.length - inBox), id]);
      setLidShut(true);
      timers.current.push(
        window.setTimeout(() => setClosing(null), CLOSING.hideBites),
        window.setTimeout(() => setLidShut(false), CLOSING.reopen),
      );
    }
    addBite(id);
  };

  // Tapping a flavour flings a bite from the button into the next free slot.
  const add = (id: FlavourId, event: MouseEvent<HTMLButtonElement>): void => {
    if (lidShut) return;
    const slotIndex = current.length + flyers.length;
    if (slotIndex >= BOX) return;

    const slot = slots.current[slotIndex];
    // In 3D the bite drops into the box by itself; nothing flies across the page.
    if (reduceMotion || three || !slot) return land(id);

    const from = centre(event.currentTarget);
    const to = centre(slot);
    const flyer: Flyer = { key: nextKey.current++, id, from, to, size: to.width };
    setFlyers((flying) => [...flying, flyer]);

    // Land on a timer, not on the animation's callback, so a bite is never
    // lost if the browser skips the animation (a hidden tab, for instance).
    timers.current.push(
      window.setTimeout(() => {
        setFlyers((flying) => flying.filter((other) => other.key !== flyer.key));
        land(id);
      }, FLIGHT * 1000),
    );
  };

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
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
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
          {/* The box: lid and inside behind, bites in the slots, front on top. */}
          <div ref={stage} className="relative mx-auto w-full max-w-[19rem] text-wine sm:mt-6 sm:max-w-[26rem]" style={{ aspectRatio: `${STAGE.width}/${STAGE.height}` }}>
            {/* The 3D box mounts here. It reaches above the box so bites can fall in. */}
            <div ref={mount3D} className="pointer-events-none absolute -inset-x-[5%] -top-[40%] -bottom-[4%]" />

            <svg className={`absolute inset-0 size-full overflow-visible ${flat}`} {...svgProps}>
              <ellipse cx="180" cy="231" rx="158" ry="7" fill="currentColor" stroke="none" opacity="0.1" />
              <motion.path
                d="M34 82L48 26H312L326 82Z"
                className="fill-cream"
                style={{ transformBox: 'fill-box', originX: 0.5, originY: 1 }}
                animate={{ scaleY: lidShut ? 0 : 1 }}
                transition={{ duration: 0.3, ease: 'easeIn' }}
              />
              <path d="M34 82H326L346 140H14Z" fill="currentColor" fillOpacity="0.1" />
            </svg>

            {Array.from({ length: BOX }, (_, slot) => {
              const id = shown[slot];
              const flavour = id && flavourById(id);
              return (
                <div
                  key={slot}
                  ref={(element) => {
                    slots.current[slot] = element;
                  }}
                  className="absolute aspect-square"
                  style={three?.slots[slot] ?? slotStyle(slot)}
                >
                  <span className={`absolute inset-[8%] rounded-full border border-dashed border-wine/40 ${flat}`} aria-hidden="true" />
                  <AnimatePresence initial={false}>
                    {flavour && (
                      <motion.button
                        key={`${boxNumber}-${slot}-${flavour.id}`}
                        type="button"
                        className="absolute inset-0"
                        style={{ originY: 1 }}
                        aria-label={`Take ${flavour.name} out of the box`}
                        disabled={lidShut}
                        onClick={(event) => {
                          // The bite's button is about to vanish; hand keyboard
                          // focus to that flavour's "add" button instead.
                          const builder = event.currentTarget.closest('[data-box-builder]');
                          removeBiteAt(boxNumber * BOX + slot);
                          builder?.querySelector<HTMLElement>(`[data-add="${flavour.id}"]`)?.focus();
                        }}
                        // Squash on landing, then spring back.
                        initial={{ scaleX: 1.25, scaleY: 0.68 }}
                        animate={{ scaleX: 1, scaleY: 1 }}
                        exit={lidShut ? { opacity: 0 } : { y: '-90%', scale: 0, rotate: 120 }}
                        transition={{ type: 'spring', stiffness: 520, damping: 13 }}
                      >
                        <Bite flavour={flavour} className={`size-full text-[clamp(0.5rem,2.4vw,0.72rem)] ${flat}`} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* An empty box has the Crumb Monster waiting in it, cut off at the
                front wall so it looks out from inside. */}
            <div className="pointer-events-none absolute inset-x-0 -top-1/2 overflow-hidden" style={{ bottom: `${100 - rim}%` }}>
              <AnimatePresence initial={false}>
                {shown.length === 0 && flyers.length === 0 && !lidShut && (
                  <motion.div
                    key="monster"
                    className="absolute -bottom-[7%] left-[33%] w-[34%]"
                    initial={{ y: '60%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '60%', opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  >
                    <CrumbMonster mood="hungry" className="block w-full" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <svg className={`pointer-events-none absolute inset-0 size-full overflow-visible ${flat}`} {...svgProps}>
              <clipPath id="order-box-front">
                <path d="M14 140H346L338 228H22Z" />
              </clipPath>
              {/* The lid, folded down over the bites once the box is full. */}
              <motion.path
                d="M34 82H326L346 140H14Z"
                className="fill-cream"
                style={{ transformBox: 'fill-box', originX: 0.5, originY: 0 }}
                initial={false}
                animate={{ scaleY: lidShut ? 1 : 0, opacity: lidShut ? 1 : 0 }}
                transition={{ duration: 0.3, delay: lidShut ? 0.3 : 0, ease: 'easeOut' }}
              />
              <path d="M14 140H346L338 228H22Z" className="fill-cream" />
              <path d="M30 151l12-6M30 159l20-10M312 216l16-9M320 220l10-6" strokeWidth="1" opacity="0.45" />
              {/* The ribbon wraps the box and the bow ties. */}
              <g clipPath="url(#order-box-front)">
                <motion.path
                  d="M10 183H350"
                  strokeWidth="24"
                  strokeLinecap="butt"
                  initial={false}
                  animate={{ pathLength: lidShut ? 1 : 0, opacity: lidShut ? 1 : 0 }}
                  transition={{ duration: lidShut ? 0.4 : 0.15, delay: lidShut ? 0.6 : 0 }}
                />
              </g>
              <motion.g
                style={{ transformBox: 'fill-box', originX: 0.5, originY: 0.5 }}
                initial={false}
                animate={{ scale: lidShut ? 1 : 0 }}
                transition={
                  lidShut ? { type: 'spring', stiffness: 400, damping: 12, delay: 0.95 } : { duration: 0.15 }
                }
              >
                <svg x="125" y="158" width="110" height="57" viewBox="0 0 120 62">
                  <BowPaths />
                </svg>
              </motion.g>
            </svg>

            {/* Crumb confetti when the bow ties. */}
            {lidShut && (
              <div className="pointer-events-none absolute top-[60%] left-1/2" aria-hidden="true">
                {Array.from({ length: 18 }, (_, crumb) => {
                  const angle = (crumb / 18) * Math.PI * 2;
                  const reach = 90 + (crumb % 3) * 45;
                  const colour = closing ? flavourById(closing[crumb % BOX] ?? 'oreo').accent : undefined;
                  return (
                    <motion.span
                      key={crumb}
                      className="absolute size-2 rounded-[40%_60%_55%_45%] bg-wine"
                      style={{ backgroundColor: crumb % 2 ? colour : undefined }}
                      initial={{ x: 0, y: 0, opacity: 0, scale: 1 }}
                      animate={{
                        x: Math.cos(angle) * reach,
                        y: Math.sin(angle) * reach - 50,
                        opacity: [0, 1, 1, 0],
                        rotate: 240,
                        scale: 0.6,
                      }}
                      transition={{ duration: 0.9, delay: 1.05, ease: 'easeOut' }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <p className="mt-3 text-center text-sm sm:mt-6" aria-live="polite">
            {lidShut
              ? 'Box packed!'
              : shown.length === 0
                ? `${booking.hungry}. Tap one to drop it in the box.`
                : `${shown.length} of ${BOX} in the box. Tap a bite to take it out.`}
          </p>

          <ul className="mx-auto mt-3 flex max-w-md justify-center gap-2 sm:mt-5 sm:gap-4">
            {flavours.map((flavour) => (
              <li key={flavour.id} className="w-1/5 max-w-20">
                <motion.button
                  type="button"
                  className="block w-full"
                  aria-label={`Add ${flavour.name} to the box`}
                  data-add={flavour.id}
                  whileTap={{ scale: 0.88 }}
                  onClick={(event) => add(flavour.id, event)}
                >
                  <Bite flavour={flavour} className="w-full text-[clamp(0.55rem,2.6vw,0.8rem)]" />
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
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
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
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <svg className="w-9 shrink-0" viewBox="0 0 120 62" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <BowPaths />
                </svg>
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

      {/* Bites in flight from a flavour button to their slot. */}
      {flyers.map((flyer) => (
        <motion.span
          key={flyer.key}
          className="pointer-events-none fixed top-0 left-0 z-[60]"
          style={{ width: flyer.size, height: flyer.size, marginLeft: -flyer.size / 2, marginTop: -flyer.size / 2 }}
          initial={{ x: flyer.from.x, y: flyer.from.y, scale: 0.7, rotate: 0 }}
          animate={{
            x: flyer.to.x,
            // Up and over: an arc that peaks above both ends.
            y: [flyer.from.y, Math.min(flyer.from.y, flyer.to.y) - 90, flyer.to.y],
            scale: 1,
            rotate: 360,
          }}
          transition={{
            duration: FLIGHT,
            x: { duration: FLIGHT, ease: 'linear' },
            y: { duration: FLIGHT, times: [0, 0.45, 1], ease: ['easeOut', 'easeIn'] },
          }}
        >
          <Bite flavour={flavourById(flyer.id)} className="size-full text-[0.6rem]" />
        </motion.span>
      ))}
    </div>
  );
}
