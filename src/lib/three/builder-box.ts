import gsap from 'gsap';
import { Vector3 } from 'three';
import type { FlavourId } from '../../content/flavours';
import { BITE, createBite, type Bite3D } from './bite';
import { BOX, createBox, frameBox } from './box';
import { dropBite, hide, tieBow } from './moves';
import { createStage } from './renderer';

// The box on /box in 3D. It mirrors the order: whatever is in the current box
// is in the cavities, each new bite drops in, and the lid swings shut when
// the box is full.

// Where things land on the canvas, as fractions of its width and height, so
// the page can line its tap targets up with the cavities.
export interface BoxLayout {
  slots: { x: number; y: number; size: number }[];
  // The top of the box's front wall.
  rim: number;
}

export interface BuilderBox {
  // `bites` is what the current box holds; `shut` closes the lid over it.
  sync: (bites: readonly FlavourId[], shut: boolean, instant?: boolean) => void;
  dispose: () => void;
}

interface Options {
  onLayout: (layout: BoxLayout) => void;
  onFallback: () => void;
}

// The lid waits for the last bite to land before it closes (seconds).
const LANDING = 0.5;

export function mountBuilderBox(container: HTMLElement, { onLayout, onFallback }: Options): BuilderBox {
  const stage = createStage(container, { onFallback });
  const box = createBox();
  stage.scene.add(box.group);
  hide(box.ribbon, box.bow);

  const placed: (Bite3D | undefined)[] = [];
  const spare: Bite3D[] = [];
  const moving = new Map<object, gsap.core.Animation>();
  const lid = { open: 1 };
  let shutNow = false;

  // Camera first, then tell the page where the cavities ended up.
  const frame = (): void => {
    frameBox(stage, { fill: 0.9, lower: 0.17 });
    const point = new Vector3();
    const project = (x: number, y: number, z: number): { x: number; y: number } => {
      point.set(x, y, z).project(stage.camera);
      return { x: (point.x + 1) / 2, y: (1 - point.y) / 2 };
    };
    onLayout({
      slots: box.slots.map((slot) => {
        const top = slot.y + BITE.height;
        const centre = project(slot.x, top, slot.z);
        const edge = project(slot.x + BITE.radius, top, slot.z);
        return { ...centre, size: (edge.x - centre.x) * 2 };
      }),
      rim: project(0, BOX.height, BOX.depth / 2).y,
    });
  };
  frame();
  stage.onResize(frame);

  const stop = (target: object): void => {
    moving.get(target)?.kill();
    moving.delete(target);
  };

  const take = (slot: number, instant: boolean): void => {
    const bite = placed[slot];
    if (!bite) return;
    placed[slot] = undefined;
    stop(bite);
    const away = (): void => {
      box.group.remove(bite.group);
      bite.group.scale.set(1, 1, 1);
      spare.push(bite);
    };
    if (instant) return away();
    // Plucked out: up, shrinking.
    moving.set(
      bite,
      gsap
        .timeline({ onUpdate: stage.invalidate, onComplete: away })
        .to(bite.group.position, { y: '+=0.9', duration: 0.22, ease: 'power2.out' }, 0)
        .to(bite.group.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.22, ease: 'power2.in' }, 0),
    );
  };

  const put = (slot: number, flavour: FlavourId, instant: boolean): void => {
    const bite = spare.pop() ?? createBite(flavour);
    bite.setFlavour(flavour);
    stop(bite);
    const home = box.slots[slot]!;
    bite.group.position.copy(home);
    bite.group.rotation.set(0, slot * 1.1, 0);
    bite.group.scale.set(1, 1, 1);
    bite.group.visible = true;
    box.group.add(bite.group);
    placed[slot] = bite;
    if (!instant) moving.set(bite, dropBite(stage, bite.group, home.y));
  };

  const setLid = (shut: boolean, instant: boolean, wait: number): void => {
    shutNow = shut;
    stop(lid);
    const apply = (): void => {
      box.setLid(lid.open);
      stage.invalidate();
    };
    if (instant) {
      lid.open = shut ? 0 : 1;
      if (!shut) hide(box.ribbon, box.bow);
      return apply();
    }
    const timeline = gsap.timeline({ delay: wait });
    if (shut) {
      // Swing shut, then tie the bow.
      timeline.to(lid, { open: 0, duration: 0.5, ease: 'power2.inOut', onUpdate: apply }).add(tieBow(stage, box));
    } else {
      timeline
        .call(() => hide(box.ribbon, box.bow))
        .to(lid, { open: 1, duration: 0.45, ease: 'power2.inOut', onUpdate: apply });
    }
    moving.set(lid, timeline);
  };

  return {
    sync: (bites, shut, instant = false) => {
      let dropped = false;
      box.slots.forEach((_, slot) => {
        const want = bites[slot];
        if (placed[slot]?.flavour === want) return;
        // Under a shut lid nothing can be seen, so there is nothing to animate.
        take(slot, instant || shutNow);
        if (want) {
          put(slot, want, instant);
          dropped ||= !instant;
        }
      });
      if (shut !== shutNow) setLid(shut, instant, dropped ? LANDING : 0);
      stage.invalidate();
    },
    dispose: () => {
      moving.forEach((animation) => animation.kill());
      stage.dispose();
    },
  };
}
