import gsap from 'gsap';
import { Vector3 } from 'three';
import type { FlavourId } from '../../content/flavours';
import { createPack, SLEEVE, TRAY } from './box';
import { createBite } from './photo-bite';
import { createStage } from './renderer';

// The pack on Home's "Box of five pieces" tile: a full tray, one piece of
// each flavour, that slides into its sleeve once, when the tile is in view.

export interface PackTile {
  // Slides the tray into the sleeve (once; later calls do nothing).
  play: () => void;
  dispose: () => void;
}

export function mountPackTile(
  container: HTMLElement,
  flavours: readonly FlavourId[],
  { onFallback }: { onFallback: () => void },
): PackTile {
  const stage = createStage(container, { onFallback, backdrop: '#f3e7da' });
  const pack = createPack();
  // Turned a little, so the long pack runs across the tile on a slant.
  pack.group.rotation.y = -0.42;
  stage.scene.add(pack.group);
  // The sleeve's clear plastic is the costliest material: compile it now, so
  // it does not stall the first time the sleeve slides in.
  pack.setSleeve(1);
  stage.prepare();
  pack.setSleeve(0);
  flavours.slice(0, pack.slots.length).forEach((flavour, slot) => {
    const bite = createBite(flavour, { solid: true });
    bite.group.position.copy(pack.slots[slot]!);
    pack.group.add(bite.group);
  });

  // Fit the whole pack (with its sleeve on) into the tile, seen from above
  // the front: the camera backs off until every corner is inside the frame.
  const corners = [-1, 1].flatMap((x) =>
    [0, 1].flatMap((y) => [-1, 1].map((z) => new Vector3((x * SLEEVE.width) / 2, y * SLEEVE.height, (z * SLEEVE.depth) / 2))),
  );
  const point = new Vector3();
  const frame = (): void => {
    const { camera } = stage;
    const elevation = 0.8;
    const targetY = TRAY.height + 0.25;
    const place = (distance: number): void => {
      camera.position.set(0, targetY + Math.sin(elevation) * distance, Math.cos(elevation) * distance);
      camera.lookAt(0, targetY, 0);
      camera.updateMatrixWorld();
    };
    const fits = (distance: number): boolean => {
      place(distance);
      pack.group.updateMatrixWorld();
      return corners.every((corner) => {
        point.copy(corner).applyMatrix4(pack.group.matrixWorld).project(camera);
        return Math.abs(point.x) < 0.9 && Math.abs(point.y) < 0.9;
      });
    };
    let near = 2;
    let far = 40;
    for (let step = 0; step < 24; step += 1) {
      const middle = (near + far) / 2;
      if (fits(middle)) far = middle;
      else near = middle;
    }
    place(far);
    stage.invalidate();
  };
  frame();
  stage.onResize(frame);

  const sleeve = { amount: 0 };
  let played = false;
  let tween: gsap.core.Tween | undefined;

  return {
    play: () => {
      if (played) return;
      played = true;
      tween = gsap.to(sleeve, {
        amount: 1,
        delay: 0.2,
        duration: 1,
        ease: 'power3.out',
        onUpdate: () => {
          pack.setSleeve(sleeve.amount);
          stage.invalidate();
        },
      });
    },
    dispose: () => {
      tween?.kill();
      stage.dispose();
    },
  };
}
