import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { booking } from '../../content/site';
import CrumbMonster, { EATING_SECONDS } from './CrumbMonster';

// Shown after "Book": the Crumb Monster eats the order, then WhatsApp opens
// with the message written out. The link stays on screen in case the browser
// did not open it by itself.
export default function BookingScreen({ link, onClose }: { link: string; onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  const [eaten, setEaten] = useState(Boolean(reduceMotion));
  const open = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setTimeout(() => setEaten(true), EATING_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  // Once it has eaten: hand over to WhatsApp and put focus on the link.
  useEffect(() => {
    if (!eaten) return;
    open.current?.focus();
    // Phones hand the link to the app; elsewhere it opens in a new tab.
    if (window.matchMedia('(pointer: coarse)').matches) window.location.href = link;
    else window.open(link, '_blank', 'noopener');
  }, [eaten, link]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[95] flex flex-col items-center justify-center gap-6 overflow-hidden bg-wine-deep px-5 text-center text-cream"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-heading"
      data-lenis-prevent
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <CrumbMonster eating={!reduceMotion} className="w-56 sm:w-64" />

      <motion.div
        className="flex flex-col items-center gap-4"
        initial={false}
        animate={{ opacity: eaten ? 1 : 0, y: eaten ? 0 : 12 }}
        transition={{ duration: 0.25 }}
        // Kept in the layout from the start so nothing jumps when it appears.
        inert={!eaten}
      >
        <h2 id="booking-heading" className="text-4xl" aria-live="polite">
          {eaten ? booking.heading : ''}
          {!eaten && <span className="invisible">{booking.heading}</span>}
        </h2>
        <p className="max-w-xs text-sm">{booking.detail}</p>
        <a
          ref={open}
          href={link}
          target="_blank"
          rel="noopener"
          className="label-caps rounded-full bg-cream px-8 py-4 text-wine"
        >
          {booking.open}
        </a>
        <button type="button" className="label-caps underline underline-offset-4" onClick={onClose}>
          {booking.back}
        </button>
      </motion.div>
    </motion.div>
  );
}
