import { flavours } from '../../content/flavours';
import { createBite } from './bite';
import { createBox, frameBox } from './box';
import { dropBite, hide, tieBow } from './moves';
import { createStage } from './renderer';

// The Home hero in 3D: the box of five, one bite of each flavour. The bites
// drop in with a squash, the bow ties, then the box sways gently and can be
// dragged to spin within limits.

export interface HeroBox {
  // The intro, from an empty box. Resolves when the bow is tied.
  playIntro: () => Promise<void>;
  // Straight to the finished box, for when the 2D intro has already played.
  showFinished: () => void;
  dispose: () => void;
}

interface Options {
  // The element that takes the drag (the canvas itself ignores the pointer).
  handle: HTMLElement;
  onFallback: () => void;
}

const BITE_GAP = 0.18;
const SPIN_LIMIT = { y: 0.6, x: 0.12 };
const clamp = (value: number, limit: number): number => Math.max(-limit, Math.min(limit, value));

export function mountHeroBox(container: HTMLElement, { handle, onFallback }: Options): HeroBox {
  const stage = createStage(container, { onFallback });
  const box = createBox();
  stage.scene.add(box.group);

  const bites = flavours.map((flavour, index) => {
    const bite = createBite(flavour.id);
    bite.group.position.copy(box.slots[index]!);
    bite.group.rotation.y = index * 1.1;
    box.group.add(bite.group);
    return bite;
  });

  // The canvas reaches above the box, so the box sits low in it.
  const frame = (): void => frameBox(stage, { fill: 0.84, lower: 0.25 });
  frame();
  stage.onResize(frame);

  // Idle sway, plus whatever the drag adds; letting go eases back to rest.
  const spin = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let grabbed: { x: number; y: number } | null = null;
  stage.onFrame((seconds) => {
    spin.x += (spin.targetX - spin.x) * 0.12;
    spin.y += (spin.targetY - spin.y) * 0.12;
    box.group.rotation.y = Math.sin(seconds * 0.7) * 0.07 + spin.y;
    box.group.rotation.x = Math.sin(seconds * 0.5) * 0.015 + spin.x;
  });

  const grab = (event: PointerEvent): void => {
    grabbed = { x: event.clientX, y: event.clientY };
    handle.setPointerCapture(event.pointerId);
    handle.style.cursor = 'grabbing';
  };
  const drag = (event: PointerEvent): void => {
    if (!grabbed) return;
    spin.targetY = clamp(spin.targetY + (event.clientX - grabbed.x) * 0.008, SPIN_LIMIT.y);
    spin.targetX = clamp(spin.targetX + (event.clientY - grabbed.y) * 0.003, SPIN_LIMIT.x);
    grabbed = { x: event.clientX, y: event.clientY };
  };
  const release = (): void => {
    grabbed = null;
    spin.targetX = spin.targetY = 0;
    handle.style.cursor = 'grab';
  };
  // Sideways drags spin the box; up and down still scrolls the page.
  handle.style.touchAction = 'pan-y';
  handle.style.cursor = 'grab';
  handle.addEventListener('pointerdown', grab);
  handle.addEventListener('pointermove', drag);
  handle.addEventListener('pointerup', release);
  handle.addEventListener('pointercancel', release);

  const playing: ReturnType<typeof dropBite>[] = [];

  return {
    playIntro: () =>
      new Promise((resolve) => {
        hide(box.ribbon, box.bow);
        bites.forEach((bite, index) => {
          playing.push(dropBite(stage, bite.group, box.slots[index]!.y, index * BITE_GAP));
        });
        playing.push(tieBow(stage, box, bites.length * BITE_GAP + 0.3).eventCallback('onComplete', resolve));
      }),
    showFinished: () => stage.invalidate(),
    dispose: () => {
      playing.forEach((timeline) => timeline.kill());
      handle.removeEventListener('pointerdown', grab);
      handle.removeEventListener('pointermove', drag);
      handle.removeEventListener('pointerup', release);
      handle.removeEventListener('pointercancel', release);
      handle.style.touchAction = handle.style.cursor = '';
      stage.dispose();
    },
  };
}
