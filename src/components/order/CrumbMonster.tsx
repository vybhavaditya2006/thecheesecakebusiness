import { motion } from 'motion/react';

// The Crumb Monster: a round cream cheesecake bite with golden crust fur, a
// wide wine mouth, tiny arms and big eyes. With `eating` it rises, opens wide,
// swallows the bite dropped to it and chomps; otherwise it sits still, full.

export const EATING_SECONDS = 1.9;

const CENTRE = { x: 100, y: 108 };
const SPIKES = 26;

// The crust: a ring of fur tufts around the body.
const fur = Array.from({ length: SPIKES * 2 }, (_, index) => {
  const angle = (index / (SPIKES * 2)) * Math.PI * 2;
  const radius = index % 2 ? 76 : 88;
  const x = (CENTRE.x + Math.cos(angle) * radius).toFixed(1);
  const y = (CENTRE.y + Math.sin(angle) * radius).toFixed(1);
  return `${index ? 'L' : 'M'}${x} ${y}`;
}).join('') + 'Z';

const crumbs = [
  { x: -62, y: -30 },
  { x: -40, y: -58 },
  { x: -12, y: -70 },
  { x: 18, y: -66 },
  { x: 46, y: -52 },
  { x: 64, y: -24 },
] as const;

export default function CrumbMonster({ eating, className }: { eating: boolean; className?: string }) {
  const timing = (times: number[]) => ({ duration: EATING_SECONDS, times, ease: 'easeInOut' }) as const;
  // The same moments drive every part: rise, open, swallow, three chomps.
  const beats = [0, 0.26, 0.4, 0.52, 0.6, 0.7, 0.8, 0.9, 1];

  return (
    <svg
      className={className}
      viewBox="-14 0 228 210"
      fill="none"
      stroke="var(--color-wine-deep)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <motion.g
        initial={eating ? { y: 190 } : false}
        animate={
          eating
            ? {
                y: [190, 0, 0, 0, 0, 0, 0, 0, 0],
                scaleX: [1, 1, 1, 1, 1.07, 1, 1.05, 1, 1],
                scaleY: [1, 1, 1, 1, 0.92, 1, 0.95, 1, 1],
              }
            : { y: 0 }
        }
        transition={timing(beats)}
        style={{ transformOrigin: '50% 100%' }}
      >
        {/* Tiny arms, thrown up as it opens wide. */}
        {[-1, 1].map((side) => (
          <motion.path
            key={side}
            d={side < 0 ? 'M26 120c-14-4-22 2-24 14' : 'M174 120c14-4 22 2 24 14'}
            strokeWidth="6"
            stroke="var(--color-crust)"
            initial={{ rotate: 0 }}
            animate={eating ? { rotate: [0, 0, side * 55, side * 55, 0, side * 20, 0, 0, 0] } : { rotate: 0 }}
            transition={timing(beats)}
            style={{ transformOrigin: side < 0 ? '100% 0%' : '0% 0%' }}
          />
        ))}

        <path d={fur} fill="var(--color-crust)" strokeWidth="2" />
        <circle cx={CENTRE.x} cy={CENTRE.y} r="70" fill="var(--color-cream)" />
        {/* Etched shading. */}
        <path d="M44 138c6 12 14 20 24 26M52 132c5 10 11 16 19 21M150 150c-5 6-11 10-17 13" strokeWidth="1.5" opacity="0.5" />

        {/* Big eyes. */}
        {[76, 124].map((x) => (
          <g key={x}>
            <circle cx={x} cy="82" r="17" fill="#fff" />
            <motion.circle
              cx={x}
              cy="84"
              r="7.5"
              fill="var(--color-wine-deep)"
              stroke="none"
              initial={{ y: 0 }}
              animate={eating ? { y: [0, -9, -9, 0, 3, 0, 3, 0, 0] } : { y: 0 }}
              transition={timing(beats)}
            />
          </g>
        ))}

        {/* The wide mouth: a slit at rest, open for the bite, then chomping. */}
        <motion.path
          d="M56 132c8 38 80 38 88 0c-28 8-60 8-88 0z"
          fill="var(--color-wine)"
          initial={{ scaleY: eating ? 0.3 : 0.45 }}
          animate={eating ? { scaleY: [0.3, 0.3, 1.6, 1.6, 0.2, 1, 0.2, 0.8, 0.45] } : { scaleY: 0.45 }}
          transition={timing(beats)}
          style={{ transformOrigin: '50% 0%' }}
        />
      </motion.g>

      {/* The bite it is fed, dropped into the open mouth. */}
      {eating && (
        <motion.g
          initial={{ y: -150, scale: 1, opacity: 1 }}
          animate={{ y: [-150, -150, 20, 34], scale: [1, 1, 0.9, 0], opacity: [1, 1, 1, 0] }}
          transition={{ duration: EATING_SECONDS * 0.56, times: [0, 0.5, 0.9, 1], ease: 'easeIn' }}
        >
          <circle cx="100" cy="100" r="20" fill="var(--color-cream)" />
          <path d="M88 94c5-4 9 4 13 0s7-4 11 0" strokeWidth="2" />
        </motion.g>
      )}

      {/* Crumbs flying from the first chomp. */}
      {eating &&
        crumbs.map((crumb, index) => (
          <motion.circle
            key={index}
            cx="100"
            cy="140"
            r={index % 2 ? 3 : 4}
            fill="var(--color-crust)"
            stroke="none"
            initial={{ opacity: 0 }}
            animate={{ x: [0, crumb.x, crumb.x], y: [0, crumb.y, crumb.y + 46], opacity: [0, 1, 0] }}
            transition={{ duration: 0.7, times: [0, 0.45, 1], delay: EATING_SECONDS * 0.6, ease: 'easeOut' }}
          />
        ))}
    </svg>
  );
}
