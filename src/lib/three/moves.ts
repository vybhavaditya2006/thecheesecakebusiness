import gsap from 'gsap';
import type { Group } from 'three';
import type { Stage } from './renderer';

// The moves the box builder uses. Each one asks the stage for frames while
// it runs, so nothing renders once it has settled. All ease out, with no
// bounce (v3).

const FALL = { height: 1.5, seconds: 0.5 };

// A piece drops into its cup and settles.
export const dropBite = (stage: Stage, bite: Group, restY: number, delay = 0): gsap.core.Timeline => {
  bite.visible = false;
  return gsap
    .timeline({ delay, onUpdate: stage.invalidate })
    .set(bite, { visible: true }, 0)
    .fromTo(bite.position, { y: restY + FALL.height }, { y: restY, duration: FALL.seconds, ease: 'power3.out' }, 0);
};
