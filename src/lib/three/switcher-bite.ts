import gsap from 'gsap';
import {
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  type Object3D,
  PlaneGeometry,
  ShadowMaterial,
} from 'three';
import type { FlavourId } from '../../content/flavours';
import { createModelBite, MODEL_BITE } from './bite-model';
import { createStage, studioLight } from './renderer';
import { shadowTexture } from './textures';

// The switcher on /flavours: one modelled bite that stays where it is and
// spins about its upright axis. As the page scrolls from one flavour to the
// next it makes one full turn, and during that turn it becomes the next
// flavour: the old topping shrinks away, the new one grows in, and the cream
// shifts colour where the flavours differ.
//
// Everything is set by the page's scroll, so it runs backwards just as well.

export interface SwitcherBite {
  // Where the page is among the flavours: 0 is the first, 1 the second, and
  // anything between is part way through the change.
  setPosition: (position: number) => void;
  // A small lift, for the moment a flavour is reached.
  pulse: () => void;
  dispose: () => void;
}

const MIDDLE = MODEL_BITE.height / 2 + 0.03;

export function mountSwitcherBite(
  container: HTMLElement,
  // The flavour at each stop, in order; null is a plain bite with nothing on it.
  stops: readonly (FlavourId | null)[],
  { onFallback }: { onFallback: () => void },
): SwitcherBite {
  const stage = createStage(container, { onFallback, sharp: true });
  const { scene, camera, key } = stage;
  scene.environment = studioLight();
  scene.environmentIntensity = 0.16;
  // Warm light, and not much of it: the bite should sit on the page like a
  // printed picture, not glow as if lit from inside.
  key.color.set('#ffe2bd');
  key.intensity = 1.45;
  scene.traverse((light: Object3D) => {
    if (light instanceof HemisphereLight) light.intensity = 1.3;
  });

  const bite = createModelBite();
  const spinner = new Group();
  spinner.add(bite.group);

  // The ground shows only the shadow that falls on it, with a soft dark
  // patch where the bite stands.
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -1.4, right: 1.4, top: 1.4, bottom: -1.4, near: 1, far: 20 });
  const ground = new Mesh(
    new PlaneGeometry(6, 6).rotateX(-Math.PI / 2),
    new ShadowMaterial({ color: '#5a2414', opacity: 0.2 }),
  );
  ground.receiveShadow = true;
  const contact = new Mesh(
    new PlaneGeometry(1.7, 1.7).rotateX(-Math.PI / 2),
    new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.7 }),
  );
  contact.position.y = 0.002;
  scene.add(spinner, ground, contact);

  // A three-quarter view from a little above, to see the top and the side.
  const frame = (): void => {
    const away = 3.5 / Math.min(1, stage.aspect());
    camera.position.set(0, MIDDLE + Math.sin(0.4) * away, Math.cos(0.4) * away);
    camera.lookAt(0, MIDDLE + 0.04, 0);
  };
  frame();
  stage.onResize(frame);

  const lift = { by: 0 };
  let position = 0;
  let clock = 0;

  const place = (seconds = clock): void => {
    clock = seconds;
    // One full turn for every stop, so it always comes to rest facing the same way.
    spinner.rotation.y = position * Math.PI * 2;
    // A slow breath, and a lift as a flavour is reached.
    spinner.position.y = Math.sin(seconds * 1.5) * 0.02 + lift.by;
    contact.material.opacity = 0.7 - lift.by * 1.5;

    // Between stop k and stop k + 1 it is k turning into k + 1.
    const from = Math.max(0, Math.min(stops.length - 2, Math.floor(position)));
    bite.blend(stops[from] ?? null, stops[from + 1] ?? null, Math.max(0, Math.min(1, position - from)));
    // Anything new on top casts and takes shadows like the rest.
    bite.group.traverse((part: Object3D) => {
      part.castShadow = part.receiveShadow = true;
    });
  };
  stage.onFrame(place);
  place();

  let pulsing: gsap.core.Timeline | undefined;

  return {
    setPosition: (next) => {
      position = next;
      place();
    },
    pulse: () => {
      pulsing?.kill();
      pulsing = gsap
        .timeline()
        .to(lift, { by: 0.09, duration: 0.2, ease: 'power2.out' })
        .to(lift, { by: 0, duration: 0.55, ease: 'power2.inOut' });
    },
    dispose: () => {
      pulsing?.kill();
      stage.dispose();
    },
  };
}
