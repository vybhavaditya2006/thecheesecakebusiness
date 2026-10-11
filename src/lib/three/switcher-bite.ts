import gsap from 'gsap';
import { Group } from 'three';
import type { FlavourId } from '../../content/flavours';
import { BITE, createBite } from './bite';
import { createStage } from './renderer';

// The switcher bite on /flavours: one small bite, seen from just above. To
// change flavour it makes a quick half-turn, and at the moment it is edge-on
// its topping is swapped, so it comes round as the new flavour.

export interface SwitcherBite {
  // Turn to a flavour (null for a plain bite). `onEdge` runs at the edge-on moment.
  flip: (flavour: FlavourId | null, onEdge: () => void) => void;
  // Dragging: turn by this many radians. Letting go eases back to rest.
  spinBy: (radians: number) => void;
  release: () => void;
  dispose: () => void;
}

const HALF_TURN = 0.22; // seconds for each half of the flip
const EDGE_ON = Math.PI / 2;

export function mountSwitcherBite(
  container: HTMLElement,
  flavour: FlavourId | null,
  { onFallback }: { onFallback: () => void },
): SwitcherBite {
  const stage = createStage(container, { onFallback });
  const bite = createBite(flavour ?? 'blueberry');
  bite.setPlain(flavour === null);

  // The bite leans its top towards the camera; the spinner turns it about
  // the upright axis of the screen.
  const spinner = new Group();
  bite.group.position.y = -BITE.height / 2;
  const lean = new Group();
  lean.rotation.x = 0.95;
  lean.add(bite.group);
  spinner.add(lean);
  stage.scene.add(spinner);

  const frame = (): void => {
    stage.camera.position.set(0, 0, 3.4 / Math.min(1, stage.aspect()));
    stage.camera.lookAt(0, 0, 0);
  };
  frame();
  stage.onResize(frame);

  let flipping: gsap.core.Timeline | undefined;
  let settling: gsap.core.Tween | undefined;

  return {
    flip: (next, onEdge) => {
      flipping?.kill();
      settling?.kill();
      flipping = gsap
        .timeline({ onUpdate: stage.invalidate })
        .to(spinner.rotation, { y: EDGE_ON, duration: HALF_TURN, ease: 'power2.in' })
        .call(() => {
          if (next) bite.setFlavour(next);
          bite.setPlain(next === null);
          onEdge();
        })
        // Carry on round from the far side, so it reads as one half-turn.
        .fromTo(spinner.rotation, { y: -EDGE_ON }, { y: 0, duration: HALF_TURN, ease: 'power2.out' });
    },
    spinBy: (radians) => {
      if (flipping?.isActive()) return;
      settling?.kill();
      spinner.rotation.y += radians;
      stage.invalidate();
    },
    release: () => {
      if (flipping?.isActive()) return;
      // Back to rest by the shorter way round.
      const turns = Math.round(spinner.rotation.y / (Math.PI * 2)) * Math.PI * 2;
      settling = gsap.to(spinner.rotation, { y: turns, duration: 0.6, ease: 'power3.out', onUpdate: stage.invalidate });
    },
    dispose: () => {
      flipping?.kill();
      settling?.kill();
      stage.dispose();
    },
  };
}
