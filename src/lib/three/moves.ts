import gsap from 'gsap';
import type { Group } from 'three';
import type { Stage } from './renderer';

// The moves the box builder uses. Each one asks the stage for
// frames while it runs, so nothing renders once it has settled.

const FALL = { height: 3.4, seconds: 0.38 };

// A bite falls into place and settles with the slightest give.
export const dropBite = (stage: Stage, bite: Group, restY: number, delay = 0): gsap.core.Timeline => {
  const spin = bite.rotation.y;
  bite.visible = false;

  return gsap
    .timeline({ delay, onUpdate: stage.invalidate })
    .set(bite, { visible: true }, 0)
    .fromTo(bite.position, { y: restY + FALL.height }, { y: restY, duration: FALL.seconds, ease: 'power2.in' }, 0)
    .fromTo(
      bite.rotation,
      { y: spin + 0.9, z: 0 },
      { y: spin, z: 0, duration: FALL.seconds, ease: 'none' },
      0,
    )
    .to(bite.scale, { x: 1.05, y: 0.92, z: 1.05, duration: 0.08, ease: 'power1.out' })
    .to(bite.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: 'power2.out' });
};
