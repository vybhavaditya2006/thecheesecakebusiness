import gsap from 'gsap';
import type { Group, Object3D } from 'three';
import type { Box3D } from './box';
import type { Stage } from './renderer';

// The moves the hero and the box builder share. Each one asks the stage for
// frames while it runs, so nothing renders once it has settled.

const FALL = { height: 3.4, seconds: 0.32 };

// A bite falls into place, squashes against the floor and springs back.
export const dropBite = (stage: Stage, bite: Group, restY: number, delay = 0): gsap.core.Timeline => {
  const spin = bite.rotation.y;
  bite.visible = false;

  return gsap
    .timeline({ delay, onUpdate: stage.invalidate })
    .set(bite, { visible: true }, 0)
    .fromTo(bite.position, { y: restY + FALL.height }, { y: restY, duration: FALL.seconds, ease: 'power2.in' }, 0)
    .fromTo(
      bite.rotation,
      { y: spin + 2.4, z: 0.5 },
      { y: spin, z: 0, duration: FALL.seconds, ease: 'none' },
      0,
    )
    .to(bite.scale, { x: 1.2, y: 0.68, z: 1.2, duration: 0.07, ease: 'power1.out' })
    .to(bite.scale, { x: 1, y: 1, z: 1, duration: 0.45, ease: 'elastic.out(1.1, 0.45)' });
};

// The ribbon wraps round the box, then the bow pops out of the knot.
export const tieBow = (stage: Stage, box: Box3D, delay = 0): gsap.core.Timeline =>
  gsap
    .timeline({ delay, onUpdate: stage.invalidate })
    .set([box.ribbon, box.bow], { visible: true }, 0)
    .fromTo(box.ribbon.scale, { x: 0.001 }, { x: 1, duration: 0.45, ease: 'power2.inOut' }, 0)
    .fromTo(
      box.bow.scale,
      { x: 0.001, y: 0.001, z: 0.001 },
      { x: 1, y: 1, z: 1, duration: 0.4, ease: 'back.out(3)' },
      0.4,
    );

export const hide = (...objects: Object3D[]): void => {
  for (const object of objects) object.visible = false;
};
