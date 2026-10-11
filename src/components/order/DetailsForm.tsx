import { useStore } from '@nanostores/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { formatPrice, priceBreakdown } from '../../content/pricing';
import { delivery, deliveryVerdict } from '../../content/site';
import { haversineKm } from '../../lib/distance';
import {
  emptyDetails,
  lastOrderDate,
  localDate,
  normalisePhone,
  NOTES_LIMIT,
  validateDetails,
  type OrderDetails,
} from '../../lib/order-details';
import { $bites, $custom, clearOrder } from '../../lib/order-store';
import { sendOrder } from '../../lib/send-order';
import { orderLines, orderLink, orderMessage, whatsappLink } from '../../lib/whatsapp';
import { ClosedBox } from './parts';

type Field = keyof OrderDetails;

type Check =
  | { state: 'idle' | 'locating' }
  | { state: 'done'; km: number; free: boolean }
  | { state: 'error'; message: string };

type Stage = 'form' | 'sending' | 'leaving' | 'sent';

// How long the closed box takes to slide away (s).
const SEND_OFF = 1.3;

const inputClass =
  'mt-2 block w-full rounded-2xl border border-wine/40 bg-cream px-4 py-3 text-base aria-[invalid=true]:border-2 aria-[invalid=true]:border-wine';

export default function DetailsForm() {
  const bites = useStore($bites);
  const custom = useStore($custom);
  const reduceMotion = useReducedMotion();

  const [details, setDetails] = useState<OrderDetails>(emptyDetails);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [check, setCheck] = useState<Check>({ state: 'idle' });
  const [stage, setStage] = useState<Stage>('form');
  const [notice, setNotice] = useState('');
  const [sentLink, setSentLink] = useState('');
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const errors = validateDetails(details);
  const empty = !bites.length && !custom.length;
  const errorFor = (field: Field): string | undefined => (touched[field] ? errors[field] : undefined);
  const verdict =
    check.state === 'done'
      ? `${check.km.toFixed(1)} km from our kitchen. ${check.free ? deliveryVerdict.free : deliveryVerdict.outside}`
      : undefined;

  const field = (name: Field) => ({
    id: `order-${name}`,
    name,
    value: details[name],
    'aria-invalid': Boolean(errorFor(name)),
    'aria-describedby': errorFor(name) ? `order-${name}-error` : undefined,
    onChange: (event: { target: { value: string } }) => setDetails({ ...details, [name]: event.target.value }),
    onBlur: () => setTouched((seen) => ({ ...seen, [name]: true })),
  });

  const problem = (name: Field) =>
    errorFor(name) && (
      <p id={`order-${name}-error`} className="mt-1 text-sm font-semibold">
        {errorFor(name)}
      </p>
    );

  // Reads the visitor's position (the browser asks first) and measures the
  // straight-line distance to the kitchen. Only the distance is kept.
  const checkAddress = (): void => {
    if (!('geolocation' in navigator)) {
      return setCheck({ state: 'error', message: 'This browser cannot share a location. We will confirm delivery on WhatsApp.' });
    }
    setCheck({ state: 'locating' });

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const km = haversineKm(delivery.kitchen, [coords.latitude, coords.longitude]);
        setCheck({ state: 'done', km, free: km <= delivery.freeRadiusKm });
      },
      (error) =>
        setCheck({
          state: 'error',
          message:
            error.code === error.PERMISSION_DENIED
              ? 'Location was not shared, and that is fine. We will confirm delivery on WhatsApp.'
              : 'We could not find your location. We will confirm delivery on WhatsApp.',
        }),
      // Always a fresh reading: a cached one could be from somewhere else.
      { timeout: 10_000, maximumAge: 0 },
    );
  };

  const placeOrder = async (event: { preventDefault: () => void }): Promise<void> => {
    event.preventDefault();
    if (stage !== 'form') return;
    setTouched({ name: true, phone: true, address: true, date: true, notes: true });

    const invalid = (Object.keys(errors) as Field[])[0];
    if (invalid) {
      setNotice('Please fix the highlighted details.');
      form.current?.querySelector<HTMLElement>(`#order-${invalid}`)?.focus();
      return;
    }
    if (empty) return setNotice('Add something to your order first.');

    setNotice('');
    setStage('sending');

    const tidy: OrderDetails = { ...details, phone: normalisePhone(details.phone) ?? details.phone };
    const link = whatsappLink(orderMessage(bites, custom, tidy, verdict));
    const result = await sendOrder({
      Name: tidy.name.trim(),
      Phone: tidy.phone,
      Address: tidy.address.trim(),
      'Delivery date': tidy.date,
      Delivery: verdict ?? 'Not checked',
      Notes: tidy.notes.trim() || 'None',
      Order: orderLines(bites, custom).join('\n'),
      Total: `${formatPrice(priceBreakdown(bites.length).total)}${custom.length ? ' + custom' : ''}`,
    });

    // The WhatsApp message carries the whole order, so a failed email never
    // stops it; the customer is told to make sure they send the message.
    if (result === 'failed') setNotice('We could not email your order, so please be sure to send the WhatsApp message.');
    setSentLink(link);
    setStage('leaving');

    timer.current = window.setTimeout(
      () => {
        clearOrder();
        setStage('sent');
        // A new tab if the browser allows it this long after the tap,
        // otherwise this tab.
        if (!window.open(link, '_blank')) window.location.assign(link);
      },
      reduceMotion ? 200 : SEND_OFF * 1000,
    );
  };

  const startAgain = (): void => {
    setDetails(emptyDetails);
    setTouched({});
    setCheck({ state: 'idle' });
    setNotice('');
    setStage('form');
  };

  if (stage === 'sent') {
    return (
      <section className="mx-auto mt-14 max-w-xl rounded-3xl border border-wine/25 p-8 text-center" aria-live="polite">
        <h2 className="text-4xl">Almost there</h2>
        <p className="mt-3">
          Your order is ready in WhatsApp. Press send there and we will confirm it with you.
        </p>
        {notice && <p className="mt-3 text-sm font-semibold">{notice}</p>}
        <a
          href={sentLink}
          target="_blank"
          rel="noopener"
          className="label-caps mt-6 inline-block rounded-full bg-wine px-8 py-4 text-cream"
        >
          Open WhatsApp
        </a>
        <button type="button" className="label-caps mt-5 block w-full underline underline-offset-4" onClick={startAgain}>
          Start a new order
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-14 max-w-xl" aria-labelledby="details-heading">
      <h2 id="details-heading" className="text-center text-4xl">
        Your details
      </h2>

      <form ref={form} className="mt-6 space-y-5" noValidate onSubmit={placeOrder}>
        <div>
          <label htmlFor="order-name" className="label-caps">
            Name
          </label>
          <input type="text" autoComplete="name" required className={inputClass} {...field('name')} />
          {problem('name')}
        </div>

        <div>
          <label htmlFor="order-phone" className="label-caps">
            Phone
          </label>
          <input type="tel" inputMode="tel" autoComplete="tel" required className={inputClass} {...field('phone')} />
          {problem('phone')}
        </div>

        <div>
          <label htmlFor="order-address" className="label-caps">
            Delivery address
          </label>
          <textarea rows={3} autoComplete="street-address" required className={inputClass} {...field('address')} />
          {problem('address')}

          <button
            type="button"
            className="label-caps mt-3 rounded-full border border-wine px-5 py-3 disabled:opacity-50"
            disabled={check.state === 'locating'}
            onClick={checkAddress}
          >
            {check.state === 'locating' ? 'Finding you…' : 'Check my address'}
          </button>
          <p className="mt-2 text-sm" role="status">
            {check.state === 'done' && <strong>{verdict}.</strong>}
            {check.state === 'error' && check.message}
            {(check.state === 'idle' || check.state === 'locating') &&
              'Uses where you are right now, with your permission. We only keep the distance.'}
          </p>
        </div>

        <div>
          <label htmlFor="order-date" className="label-caps">
            Delivery date
          </label>
          <input type="date" min={localDate()} max={lastOrderDate()} required className={inputClass} {...field('date')} />
          {problem('date')}
        </div>

        <div>
          <label htmlFor="order-notes" className="label-caps">
            Notes (optional)
          </label>
          <textarea rows={3} maxLength={NOTES_LIMIT} className={inputClass} {...field('notes')} />
          {problem('notes')}
        </div>

        <div className="flex flex-col items-center gap-4 pt-2">
          <motion.button
            type="submit"
            className="label-caps rounded-full bg-wine px-10 py-4 text-cream disabled:opacity-50"
            disabled={stage !== 'form'}
            whileTap={{ scaleX: 1.07, scaleY: 0.88 }}
          >
            {stage === 'form' ? 'Place order' : 'Sending…'}
          </motion.button>
          <p className="min-h-5 text-center text-sm font-semibold" role="alert">
            {notice}
          </p>
          <a
            href={orderLink(bites, custom, details, verdict)}
            target="_blank"
            rel="noopener"
            className="text-sm underline underline-offset-4"
          >
            Order on WhatsApp instead
          </a>
        </div>
      </form>

      {/* The send-off: the closed box slides away. */}
      <AnimatePresence>
        {stage === 'leaving' && (
          <motion.div
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 overflow-hidden bg-cream/95 text-wine"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="status"
          >
            <motion.div
              className="w-64"
              // A little wind-up, then off to the right.
              animate={{ x: [0, -28, 900], rotate: [0, -3, 6] }}
              transition={{ duration: SEND_OFF, times: [0, 0.3, 1], ease: ['easeOut', 'easeIn'] }}
            >
              <ClosedBox className="w-full" />
            </motion.div>
            <p className="font-display text-3xl italic">Off it goes…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
