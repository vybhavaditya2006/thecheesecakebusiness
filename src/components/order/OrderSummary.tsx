import { useStore } from '@nanostores/react';
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';
import { customPriceNote } from '../../content/custom';
import { formatPrice, priceBreakdown, pricing, saleActive } from '../../content/pricing';
import { delivery } from '../../content/site';
import { $bites, $custom, clearOrder, countByFlavour, removeCustom } from '../../lib/order-store';

const plural = (count: number, word: string, many = `${word}s`): string =>
  `${count} ${count === 1 ? word : many}`;

// The total, counting up or down to its new value whenever it changes.
function Total({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const amount = useMotionValue(value);
  const text = useTransform(amount, (current) => formatPrice(Math.round(current)));

  useEffect(() => {
    if (reduceMotion) return amount.set(value);
    const counting = animate(amount, value, { duration: 0.5, ease: 'easeOut' });
    return () => counting.stop();
  }, [amount, value, reduceMotion]);

  return <motion.span>{text}</motion.span>;
}

// The itemised order, shared by the desktop panel and the mobile sheet.
function Lines() {
  const bites = useStore($bites);
  const custom = useStore($custom);
  const { boxes, singles, total, regularTotal } = priceBreakdown(bites.length);
  const key = saleActive ? 'offer' : 'regular';

  if (!bites.length && !custom.length) {
    return <p className="text-sm opacity-80">Nothing in your order yet.</p>;
  }

  return (
    <div className="space-y-4 text-sm">
      {bites.length > 0 && (
        <div>
          <ul className="space-y-1">
            {countByFlavour(bites).map(({ flavour, count }) => (
              <li key={flavour.id} className="flex justify-between gap-4">
                <span>{flavour.name}</span>
                <span>× {count}</span>
              </li>
            ))}
          </ul>
          <ul className="mt-3 space-y-1 border-t border-wine/25 pt-3">
            {boxes > 0 && (
              <li className="flex justify-between gap-4">
                <span>{plural(boxes, 'box', 'boxes')} of {pricing.box.bites}</span>
                <span>{formatPrice(boxes * pricing.box[key])}</span>
              </li>
            )}
            {singles > 0 && (
              <li className="flex justify-between gap-4">
                <span>{plural(singles, 'single')}</span>
                <span>{formatPrice(singles * pricing.single[key])}</span>
              </li>
            )}
          </ul>
        </div>
      )}

      {custom.map((request) => (
        <div key={request.id} className="rounded-2xl border border-wine/25 p-3">
          <div className="flex items-start justify-between gap-3">
            <strong className="font-display text-lg leading-tight">{request.title}</strong>
            <button
              type="button"
              className="size-7 shrink-0 rounded-full border border-wine leading-none"
              aria-label={`Remove ${request.title}`}
              onClick={() => removeCustom(request.id)}
            >
              ×
            </button>
          </div>
          <ul className="mt-1 space-y-0.5">
            {request.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
          <p className="label-caps mt-2 text-[0.6rem]">{customPriceNote}</p>
        </div>
      ))}

      <p className="flex items-baseline justify-between gap-4 border-t border-wine/25 pt-3">
        <span className="label-caps">Total</span>
        <span className="font-display text-3xl font-semibold">
          {saleActive && regularTotal > total && (
            <s className="mr-2 text-lg font-normal opacity-60">{formatPrice(regularTotal)}</s>
          )}
          <Total value={total} />
          {custom.length > 0 && <span className="text-base font-normal"> + custom</span>}
        </span>
      </p>
      <p className="text-xs opacity-80">
        {delivery.freeNote} {delivery.paidNote}
      </p>
      <button type="button" className="label-caps underline underline-offset-4" onClick={clearOrder}>
        Clear order
      </button>
    </div>
  );
}

export default function OrderSummary() {
  const bites = useStore($bites);
  const custom = useStore($custom);
  const [open, setOpen] = useState(false);
  const { total } = priceBreakdown(bites.length);
  const count = [bites.length && plural(bites.length, 'bite'), custom.length && `${custom.length} custom`]
    .filter(Boolean)
    .join(' + ');

  return (
    <>
      {/* Desktop: a panel that stays in view beside the builder. */}
      <aside className="sticky top-32 hidden rounded-3xl border border-wine/25 p-6 lg:block" aria-label="Your order">
        <h2 className="text-3xl">Your order</h2>
        <div className="mt-4">
          <Lines />
        </div>
      </aside>

      {/* Phones: a bar pinned to the bottom that opens into the full order. */}
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden" data-order-bar>
        <AnimatePresence>
          {open && (
            <motion.div
              id="order-sheet"
              className="max-h-[60svh] overflow-y-auto rounded-t-3xl border-t border-wine/25 bg-cream p-5 shadow-[0_-8px_24px_rgb(74_15_24/0.12)]"
              data-lenis-prevent
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            >
              <h2 className="text-2xl">Your order</h2>
              <div className="mt-3">
                <Lines />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-center justify-between gap-4 bg-wine-deep px-5 py-3 text-cream">
          <p aria-live="polite">
            <span className="label-caps block text-[0.65rem] opacity-80">{count || 'Your order is empty'}</span>
            <span className="font-display text-2xl leading-none font-semibold">
              <Total value={total} />
              {custom.length > 0 && <span className="text-sm font-normal"> + custom</span>}
            </span>
          </p>
          <button
            type="button"
            className="label-caps shrink-0 rounded-full bg-cream px-4 py-3 whitespace-nowrap text-wine"
            aria-expanded={open}
            aria-controls="order-sheet"
            onClick={() => setOpen(!open)}
          >
            {open ? 'Close' : 'Review order'}
          </button>
        </div>
      </div>
    </>
  );
}
