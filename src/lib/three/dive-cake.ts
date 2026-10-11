import { Vector3 } from 'three';
import { CAKE, createCake } from './cake';
import { DIVE } from './dive-beats';
import { createStage } from './renderer';

// The whole-cake scene on Home, driven entirely by scroll. Every frame is
// worked out from one number, how far through the scene the page is, so
// scrolling back plays it exactly in reverse.

export interface DiveCake {
  // `at` is the position in the scene, as a fraction of the full scroll.
  setProgress: (at: number) => void;
  dispose: () => void;
}

const between = (value: number, [from, to]: readonly [number, number]): number =>
  Math.max(0, Math.min(1, (value - from) / (to - from)));
const ease = (value: number): number => value * value * (3 - 2 * value);
const mix = (from: number, to: number, amount: number): number => from + (to - from) * amount;

// How far the cake turns over the top-down beats (radians).
const TURN = 1.1;

export function mountDiveCake(container: HTMLElement, { onFallback }: { onFallback: () => void }): DiveCake {
  const stage = createStage(container, { onFallback });
  const cake = createCake();
  stage.scene.add(cake.group);

  const target = new Vector3();
  const gapCentre = new Vector3();
  const gapOutward = new Vector3();
  const upright = new Vector3(0, 1, 0);
  let position = 0;

  const render = (): void => {
    const at = position;

    // The cake turns until the camera starts to move, then holds still.
    cake.cake.rotation.y = (Math.min(at, DIVE.sweep[0]) / DIVE.sweep[0]) * TURN;

    cake.setCut(between(at, DIVE.cut));
    cake.setCutVisible(1 - between(at, [DIVE.slide[0] + 0.03, DIVE.slide[1]]));
    const slid = ease(between(at, DIVE.slide));
    const sweep = ease(between(at, DIVE.sweep));
    // Out a little as it is cut free, then right away as the camera comes down.
    cake.setWedge(slid * 0.55 + sweep * 4);
    cake.setCrumbs(between(at, DIVE.slide));

    // From straight above the middle of the cake, down and round to look
    // into the gap, between the two cut faces, closing in on where they meet.
    gapCentre.copy(cake.gap.centre).applyAxisAngle(upright, cake.cake.rotation.y);
    gapOutward.copy(cake.gap.outward).applyAxisAngle(upright, cake.cake.rotation.y);
    const facing = Math.atan2(gapOutward.x, gapOutward.z);

    const above = (CAKE.radius * 6.2) / Math.min(1, stage.aspect());
    const elevation = mix(Math.PI / 2 - 0.02, 0.08, sweep);
    const bearing = facing - (1 - sweep) * 1.3;
    const distance = mix(above, CAKE.radius * 0.75, sweep);

    target.set(0, CAKE.height / 2, 0).lerp(gapCentre, sweep);
    stage.camera.position.set(
      target.x + Math.cos(elevation) * Math.sin(bearing) * distance,
      target.y + Math.sin(elevation) * distance,
      target.z + Math.cos(elevation) * Math.cos(bearing) * distance,
    );
    stage.camera.lookAt(target);
  };

  stage.onResize(render);
  render();

  return {
    setProgress: (at) => {
      position = at;
      render();
      stage.invalidate();
    },
    dispose: () => stage.dispose(),
  };
}
