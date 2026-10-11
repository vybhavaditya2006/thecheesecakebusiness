import gsap from 'gsap';
import { Group, Mesh, MeshBasicMaterial, type Object3D, PlaneGeometry, ShadowMaterial } from 'three';
import type { FlavourId } from '../../content/flavours';
import { BITE, createBite } from './bite';
import { createStage, studioLight } from './renderer';
import { shadowTexture } from './textures';

// The switcher bite on /flavours: one bite on a slow turntable, lit like a
// product shot, with a soft shadow on the ground beneath it. To change
// flavour it lifts and tumbles once, and while its underside faces the
// camera the topping is swapped, so it lands as the new flavour.

export interface SwitcherBite {
  // Turn to a flavour (null for a plain bite). `onEdge` runs as the topping swaps.
  flip: (flavour: FlavourId | null, onEdge: () => void) => void;
  // Dragging: turn by this many radians. Letting go lets it coast.
  spinBy: (radians: number) => void;
  release: () => void;
  dispose: () => void;
}

const TUMBLE_SECONDS = 0.95;
// Radians a second on the turntable.
const IDLE_TURN = 0.4;
const MIDDLE = BITE.height / 2 + 0.03;

export function mountSwitcherBite(
  container: HTMLElement,
  flavour: FlavourId | null,
  { onFallback }: { onFallback: () => void },
): SwitcherBite {
  const stage = createStage(container, { onFallback, sharp: true });
  const { scene, camera, key } = stage;
  scene.environment = studioLight();
  scene.environmentIntensity = 0.22;

  const bite = createBite(flavour ?? 'blueberry');
  bite.setPlain(flavour === null);
  const shade = (object: Object3D): void =>
    object.traverse((part) => {
      part.castShadow = part.receiveShadow = true;
    });
  shade(bite.group);

  // The turntable spins it upright; the tumble turns it over about its middle.
  const turntable = new Group();
  const tumble = new Group();
  tumble.position.y = MIDDLE;
  bite.group.position.y = -MIDDLE;
  tumble.add(bite.group);
  turntable.add(tumble);

  // The ground only shows the shadow that falls on it, with a soft dark
  // patch where the bite stands.
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -1.4, right: 1.4, top: 1.4, bottom: -1.4, near: 1, far: 20 });
  const ground = new Mesh(new PlaneGeometry(6, 6).rotateX(-Math.PI / 2), new ShadowMaterial({ color: '#4a0f18', opacity: 0.22 }));
  ground.receiveShadow = true;
  const contact = new Mesh(
    new PlaneGeometry(1.7, 1.7).rotateX(-Math.PI / 2),
    new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.7 }),
  );
  contact.position.y = 0.002;
  scene.add(turntable, ground, contact);

  // A three-quarter view from a little above, with room to lift and tumble.
  const frame = (): void => {
    const back = 3.9 / Math.min(1, stage.aspect());
    camera.position.set(0, MIDDLE + Math.sin(0.5) * back, Math.cos(0.5) * back);
    camera.lookAt(0, MIDDLE + 0.08, 0);
  };
  frame();
  stage.onResize(frame);

  // The turntable: a steady idle turn, plus whatever a drag has added.
  let dragged = 0;
  let lastDrag = 0;
  let coasting: gsap.core.Tween | undefined;
  const drag = { extra: 0 };
  stage.onFrame((seconds) => {
    turntable.rotation.y = seconds * IDLE_TURN + dragged + drag.extra;
  });

  let tumbling: gsap.core.Tween | undefined;
  const turnOver = { amount: 0 };

  return {
    flip: (next, onEdge) => {
      tumbling?.kill();
      let swapped = false;
      turnOver.amount = 0;
      tumbling = gsap.to(turnOver, {
        amount: 1,
        duration: TUMBLE_SECONDS,
        ease: 'power2.inOut',
        onUpdate: () => {
          // Up, over once, and down again.
          tumble.rotation.x = turnOver.amount * Math.PI * 2;
          tumble.position.y = MIDDLE + Math.sin(turnOver.amount * Math.PI) * 0.3;
          contact.material.opacity = 0.7 - Math.sin(turnOver.amount * Math.PI) * 0.35;
          // Half way round its underside faces the camera: the moment to swap.
          if (!swapped && turnOver.amount >= 0.5) {
            swapped = true;
            if (next) bite.setFlavour(next);
            bite.setPlain(next === null);
            shade(bite.group);
            onEdge();
          }
        },
      });
    },
    spinBy: (radians) => {
      coasting?.kill();
      dragged += radians + drag.extra;
      drag.extra = 0;
      lastDrag = radians;
    },
    release: () => {
      // Carries on a little in the direction it was pushed.
      coasting = gsap.to(drag, { extra: lastDrag * 8, duration: 1.1, ease: 'power3.out' });
      lastDrag = 0;
    },
    dispose: () => {
      tumbling?.kill();
      coasting?.kill();
      stage.dispose();
    },
  };
}
