import gsap from "gsap";
import { motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { booking } from "../../content/site";
import CrumbMonster from "../monster/CrumbMonster";
import { monsterMouth, type Mood } from "../monster/markup";

// A bite taken out of the order card, in the card's own coordinates (px).
export interface BiteMark {
  x: number;
  y: number;
  radius: number;
  // Which way the card lies from the bitten edge: 1 below it, -1 above it.
  inward: 1 | -1;
}

interface Props {
  // The order card the monster bites, and the edge it bites from.
  card: HTMLElement;
  edge: "top" | "bottom";
  link: string;
  message: string;
  onBite: (mark: BiteMark) => void;
  onClose: () => void;
}

// How long to wait for WhatsApp before offering another way (ms).
const STUCK_AFTER = 2000;

// After "Book": the Crumb Monster pops up from the bottom, sniffs, chomps a
// chunk out of the order card, chews and gives a thumbs up; then WhatsApp
// opens. About 1.5 s, a tap skips it, and reduced motion skips it entirely.
export default function BookingStage({
  card,
  edge,
  link,
  message,
  onBite,
  onClose,
}: Props) {
  const reduceMotion = Boolean(useReducedMotion());
  const [mood, setMood] = useState<Mood>(reduceMotion ? "thumbs-up" : "hungry");
  const [sent, setSent] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [copied, setCopied] = useState(false);
  const monster = useRef<HTMLDivElement>(null);
  const sequence = useRef<gsap.core.Timeline | null>(null);
  // The bubble appears once the order is sent; focus goes to its way out.
  const focusOnArrival = useCallback(
    (button: HTMLButtonElement | null) => button?.focus(),
    [],
  );

  // Where the monster stands: its mouth on the edge of the card.
  const place = useMemo(() => {
    const box = card.getBoundingClientRect();
    const size = Math.min(160, window.innerWidth * 0.4);
    const mouthX = box.left + box.width * (edge === "top" ? 0.41 : 0.72);
    const mouthY =
      edge === "top"
        ? box.top
        : Math.min(box.bottom, window.innerHeight - size * 0.35);
    const left = mouthX - size * monsterMouth.x;
    const top = mouthY - size * monsterMouth.y;
    const mark: BiteMark = {
      x: mouthX - box.left,
      y: mouthY - box.top,
      radius: size * 0.17,
      inward: edge === "top" ? 1 : -1,
    };
    // The speech bubble: above the monster on phones, beside the card on desktop.
    const bubble: CSSProperties =
      edge === "top"
        ? { left: 16, right: 16, bottom: window.innerHeight - top + 4 }
        : {
            right: window.innerWidth - box.left + 16,
            bottom: 32,
            width: "17rem",
          };
    return {
      size,
      left,
      top,
      mark,
      bubble,
      rise: window.innerHeight - top + 20,
    };
  }, [card, edge]);

  // Hands the order to WhatsApp, and watches whether it actually opened.
  const send = (): void => {
    setSent(true);
    let left = false;
    const leaving = (): void => {
      left = true;
    };
    const hidden = (): void => {
      if (document.hidden) left = true;
    };
    window.addEventListener("blur", leaving, { once: true });
    window.addEventListener("pagehide", leaving, { once: true });
    document.addEventListener("visibilitychange", hidden);
    window.setTimeout(() => {
      document.removeEventListener("visibilitychange", hidden);
      if (!left) setStuck(true);
    }, STUCK_AFTER);

    // Phones hand the link to the app; elsewhere it opens in a new tab.
    if (window.matchMedia("(pointer: coarse)").matches)
      window.location.href = link;
    else window.open(link, "_blank", "noopener");
  };

  useLayoutEffect(() => {
    if (reduceMotion) {
      onBite(place.mark);
      send();
      return;
    }

    const timeline = gsap.timeline();
    sequence.current = timeline;
    timeline
      .fromTo(
        monster.current,
        { y: place.rise },
        { y: 0, duration: 0.3, ease: "back.out(1.5)" },
      )
      // Sniff: three quick nudges towards the card.
      .to(monster.current, { rotation: -7, y: -4, duration: 0.07 })
      .to(monster.current, { rotation: 6, y: 0, duration: 0.07 })
      .to(monster.current, { rotation: -4, y: -4, duration: 0.07 })
      .to(monster.current, { rotation: 0, y: 0, duration: 0.07 })
      .call(() => setMood("chomp"), [], 0.6)
      .call(() => onBite(place.mark), [], 0.72)
      .call(() => setMood("chew"), [], 0.82)
      .call(() => setMood("thumbs-up"), [], 1.2)
      .call(send, [], 1.5);

    return () => {
      timeline.kill();
    };
    // Runs once, for the order as it stood when "Book" was pressed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A tap skips the animation; after that it closes.
  const skipOrClose = (): void => {
    if (sent) onClose();
    else sequence.current?.progress(1);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") skipOrClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

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
      className="fixed inset-0 z-[95]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="absolute inset-0 bg-wine-deep/25" onClick={skipOrClose} />

      <div
        ref={monster}
        className="pointer-events-none fixed"
        style={{ left: place.left, top: place.top, width: place.size }}
      >
        <CrumbMonster mood={mood} className="block w-full" />
      </div>

      {sent && (
        <div
          className="fixed rounded-3xl border-[1.5px] border-wine bg-cream p-5 text-center text-wine shadow-[0_8px_24px_rgb(74_15_24/0.18)]"
          style={place.bubble}
          role="dialog"
          aria-labelledby="booking-sent"
        >
          <p
            id="booking-sent"
            className="font-display text-3xl leading-tight font-semibold"
          >
            {booking.sent}
          </p>
          {stuck && (
            <div className="mt-3 flex flex-col items-center gap-3">
              <p className="text-sm">{booking.stuck}</p>
              <button
                type="button"
                className="label-caps rounded-full bg-wine px-6 py-3 text-cream"
                onClick={copy}
              >
                <span role="status">
                  {copied ? booking.copied : booking.copy}
                </span>
              </button>
              <a
                href={link}
                target="_blank"
                rel="noopener"
                className="text-sm underline underline-offset-4"
              >
                {booking.open}
              </a>
            </div>
          )}
          <button
            ref={focusOnArrival}
            type="button"
            className="label-caps mt-4 underline underline-offset-4"
            onClick={onClose}
          >
            {booking.back}
          </button>
        </div>
      )}
    </motion.div>
  );
}
