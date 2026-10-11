import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { booking } from '../../content/site';

interface Props {
  link: string;
  message: string;
  onClose: () => void;
}

// How long to wait for WhatsApp before offering another way (ms).
const STUCK_AFTER = 2000;

// Shown after "Book": WhatsApp opens with the order written out. If it has
// not opened after a couple of seconds, the order can be copied or the link
// followed by hand.
export default function BookingNotice({ link, message, onClose }: Props) {
  const [stuck, setStuck] = useState(false);
  const [copied, setCopied] = useState(false);
  const focusOnArrival = useCallback((button: HTMLButtonElement | null) => button?.focus(), []);

  // Hand the order to WhatsApp, and watch whether it actually opened.
  useEffect(() => {
    let left = false;
    const leaving = (): void => {
      left = true;
    };
    const hidden = (): void => {
      if (document.hidden) left = true;
    };
    window.addEventListener('blur', leaving);
    window.addEventListener('pagehide', leaving);
    document.addEventListener('visibilitychange', hidden);
    const timer = window.setTimeout(() => {
      if (!left) setStuck(true);
    }, STUCK_AFTER);

    // Phones hand the link to the app; elsewhere it opens in a new tab.
    if (window.matchMedia('(pointer: coarse)').matches) window.location.href = link;
    else window.open(link, '_blank', 'noopener');

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('blur', leaving);
      window.removeEventListener('pagehide', leaving);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [link]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      // Clipboard blocked: the WhatsApp link beside it still works.
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[95] flex items-center justify-center px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-wine-deep/40" onClick={onClose} />

      <motion.div
        className="relative w-full max-w-sm rounded-3xl border border-wine/25 bg-cream p-8 text-center shadow-[0_16px_40px_rgb(74_15_24/0.2)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-heading"
        initial={{ y: 16 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <span className="mx-auto block h-0.5 w-10 bg-gold" aria-hidden="true" />
        <h2 id="booking-heading" className="mt-5 text-4xl leading-tight">
          {booking.heading}
        </h2>
        <p className="mt-3 text-sm">{booking.detail}</p>

        {stuck && (
          <div className="mt-6 flex flex-col items-center gap-3 border-t border-wine/25 pt-6">
            <p className="text-sm">{booking.stuck}</p>
            <button type="button" className="label-caps rounded-full bg-wine px-6 py-3 text-cream" onClick={copy}>
              <span role="status">{copied ? booking.copied : booking.copy}</span>
            </button>
            <a href={link} target="_blank" rel="noopener" className="text-sm underline underline-offset-4">
              {booking.open}
            </a>
          </div>
        )}

        <button
          ref={focusOnArrival}
          type="button"
          className="label-caps mt-6 underline underline-offset-4"
          onClick={onClose}
        >
          {booking.back}
        </button>
      </motion.div>
    </motion.div>
  );
}
