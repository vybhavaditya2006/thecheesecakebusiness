import { useEffect, useRef, useState, type RefObject } from 'react';
import type { FlavourId } from '../../content/flavours';
import type { BuilderBox } from '../../lib/three/builder-box';
import { canUse3D, whenNear } from '../../lib/three/support';

// Where the 3D pack's cups and front edge are, in percent of the 2D stage,
// so the tap targets can sit exactly over them.
export interface Stage3D {
  slots: { left: string; top: string; width: string }[];
  rim: number;
}

// Mounts the 3D pack into `mount` (a child of `stage`) once it is near the
// screen, and keeps it in step with the order: `bites` in the tray, `sleeved`
// once it is full, and `boxNumber` to bring in a fresh tray. Returns null
// while the 2D pack should show: before it has loaded, or when 3D is not used
// on this device.
export function useBox3D(
  stage: RefObject<HTMLElement | null>,
  mount: RefObject<HTMLElement | null>,
  bites: readonly FlavourId[],
  sleeved: boolean,
  boxNumber: number,
  enabled: boolean,
): Stage3D | null {
  const [layout, setLayout] = useState<Stage3D | null>(null);
  const box = useRef<BuilderBox | null>(null);
  const latest = useRef({ bites, sleeved, boxNumber });
  latest.current = { bites, sleeved, boxNumber };

  useEffect(() => {
    const frame = stage.current;
    const target = mount.current;
    if (!enabled || !frame || !target || !canUse3D()) return;
    let gone = false;

    const stopWaiting = whenNear(frame, async () => {
      try {
        const { mountBuilderBox } = await import('../../lib/three/builder-box');
        if (gone) return;
        const mounted = mountBuilderBox(target, {
          onLayout: ({ slots, rim }) => {
            const percentX = (x: number): number =>
              ((target.offsetLeft + x * target.offsetWidth) / frame.offsetWidth) * 100;
            const percentY = (y: number): number =>
              ((target.offsetTop + y * target.offsetHeight) / frame.offsetHeight) * 100;
            setLayout({
              slots: slots.map((slot) => {
                const size = slot.size * target.offsetWidth;
                return {
                  left: `${percentX(slot.x) - (size / 2 / frame.offsetWidth) * 100}%`,
                  top: `${percentY(slot.y) - (size / 2 / frame.offsetHeight) * 100}%`,
                  width: `${(size / frame.offsetWidth) * 100}%`,
                };
              }),
              rim: percentY(rim),
            });
          },
          dragSurface: frame,
          // Too slow here: back to the drawn pack.
          onFallback: () => {
            box.current = null;
            setLayout(null);
          },
        });
        box.current = mounted;
        mounted.sync(latest.current.bites, latest.current.sleeved, latest.current.boxNumber, true);
      } catch {
        // The kit failed to load: the drawn pack stays.
      }
    });

    return () => {
      gone = true;
      stopWaiting();
      box.current?.dispose();
      box.current = null;
      setLayout(null);
    };
  }, [stage, mount, enabled]);

  const key = bites.join();
  useEffect(() => {
    box.current?.sync(latest.current.bites, sleeved, boxNumber);
  }, [key, sleeved, boxNumber]);

  return layout;
}
