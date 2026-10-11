import { useEffect, useRef, useState, type RefObject } from 'react';
import type { FlavourId } from '../../content/flavours';
import type { BuilderBox } from '../../lib/three/builder-box';
import { canUse3D, whenNear } from '../../lib/three/support';

// Where the 3D box's cavities and front rim are, in percent of the 2D stage,
// so the tap targets can sit exactly over them.
export interface Stage3D {
  slots: { left: string; top: string; width: string }[];
  rim: number;
}

// Mounts the 3D box into `mount` (a child of `stage`) once it is near the
// screen, and keeps it in step with the order. Returns null while the 2D box
// should show: before it has loaded, or when 3D is not used on this device.
export function useBox3D(
  stage: RefObject<HTMLElement | null>,
  mount: RefObject<HTMLElement | null>,
  bites: readonly FlavourId[],
  shut: boolean,
  enabled: boolean,
): Stage3D | null {
  const [layout, setLayout] = useState<Stage3D | null>(null);
  const box = useRef<BuilderBox | null>(null);
  const latest = useRef({ bites, shut });
  latest.current = { bites, shut };

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
          // Too slow here: back to the drawn box.
          onFallback: () => {
            box.current = null;
            setLayout(null);
          },
        });
        box.current = mounted;
        mounted.sync(latest.current.bites, latest.current.shut, true);
      } catch {
        // The kit failed to load: the drawn box stays.
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
    box.current?.sync(latest.current.bites, shut);
  }, [key, shut]);

  return layout;
}
