import gsap from 'gsap';
import { Group, Mesh, MeshBasicMaterial, type Object3D, PlaneGeometry, ShadowMaterial } from 'three';
import type { FlavourId } from '../../content/flavours';
import { createModelBite, MODEL_BITE } from './bite-model';
import { createStage, studioLight } from './renderer';
import { shadowTexture } from './textures';

// The switcher on /flavours: two modelled bites on opposite sides of a small
// ring that turns about its upright axis, like the two sides of a globe. The
// flavour in view is at the front; the next one is directly behind it, out of
// sight. Half a turn swings the next one round to the front, and the one that
// has gone behind is then changed to the flavour after that.
//
// The turn is set by the page's scroll, so it runs backwards just as well.

export interface SwitcherBite {
  // Where the page is among the flavours: 0 is the first, 1 the second, and
  // anything between is part way round.
  setPosition: (position: number) => void;
  // A small lift, for the moment a flavour comes to the front.
  pulse: () => void;
  dispose: () => void;
}

const MIDDLE = MODEL_BITE.height / 2 + 0.03;
// How far each bite stands from the ring's axis.
const RING = 0.56;
// A bite at the back is this much smaller, so the front one covers it.
const SMALLEST = 0.5;

export function mountSwitcherBite(
  container: HTMLElement,
  // The flavour at each stop, in order; null is a plain bite with nothing on it.
  stops: readonly (FlavourId | null)[],
  { onFallback }: { onFallback: () => void },
): SwitcherBite {
  const stage = createStage(container, { onFallback, sharp: true });
  const { scene, camera, key } = stage;
  scene.environment = studioLight();
  scene.environmentIntensity = 0.22;

  const ring = new Group();

  // One of the two bites. `side` is 1 for the one that starts at the front,
  // -1 for the one that starts behind it.
  const seat = (side: 1 | -1) => {
    const bite = createModelBite(stops[0] ?? 'blueberry');
    const shade = (): void =>
      bite.group.traverse((part: Object3D) => {
        part.castShadow = part.receiveShadow = true;
      });
    shade();

    // The soft patch it stands on travels with it.
    const patch = new Mesh(
      new PlaneGeometry(1.7, 1.7).rotateX(-Math.PI / 2),
      new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.65 }),
    );
    patch.position.y = 0.002;
    const holder = new Group();
    holder.position.z = side * RING;
    holder.add(bite.group, patch);
    ring.add(holder);

    let shown: FlavourId | null | undefined;
    return {
      side,
      holder,
      bite: bite.group,
      show: (flavour: FlavourId | null): void => {
        if (flavour === shown) return;
        shown = flavour;
        // A plain bite is the usual cream, whatever flavour stood here before.
        bite.setFlavour(flavour ?? stops.find((stop) => stop !== null && stop !== 'coffee') ?? 'blueberry');
        bite.setPlain(flavour === null);
        shade();
      },
    };
  };
  const seats = [seat(1), seat(-1)];

  // The ground shows only the shadows that fall on it.
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 1, far: 20 });
  const ground = new Mesh(
    new PlaneGeometry(8, 8).rotateX(-Math.PI / 2),
    new ShadowMaterial({ color: '#4a0f18', opacity: 0.2 }),
  );
  ground.receiveShadow = true;
  scene.add(ring, ground);

  // From the front, a little above: enough to see the top of the bite.
  const frame = (): void => {
    const away = 4.4 / Math.min(1, stage.aspect());
    camera.position.set(0, MIDDLE + Math.sin(0.36) * away, RING + Math.cos(0.36) * away);
    camera.lookAt(0, MIDDLE, RING * 0.6);
  };
  frame();
  stage.onResize(frame);

  const lift = { by: 0 };
  let position = 0;
  let clock = 0;

  const place = (seconds = clock): void => {
    clock = seconds;
    // Half a turn for every stop.
    const angle = position * Math.PI;
    ring.rotation.y = angle;

    for (const one of seats) {
      // 1 when this bite faces the camera, -1 when it is directly behind.
      const facing = Math.cos(angle) * one.side;
      const near = (facing + 1) / 2;
      // Smaller as it goes round the back, and gone while the front one
      // would not quite cover it.
      one.holder.scale.setScalar(SMALLEST + (1 - SMALLEST) * near * near);
      // It also sinks a little as it goes behind, so it never shows over the
      // top of the bite in front.
      one.holder.position.y = -0.5 * (1 - near) * (1 - near);
      one.holder.visible = facing > -0.94;
      // The bite itself keeps its face to the camera as the ring turns.
      one.bite.rotation.y = -angle;
      // A slow breath, and a lift for the one arriving at the front.
      one.bite.position.y = near * (Math.sin(seconds * 1.5) * 0.02 + lift.by);
    }

    // Between stop k and stop k + 1, the bite in front at k shows k and the
    // other shows k + 1. Which bite that is alternates from stop to stop.
    const from = Math.max(0, Math.min(stops.length - 2, Math.floor(position)));
    const even = from % 2 === 0;
    seats[0]!.show(stops[even ? from : from + 1] ?? null);
    seats[1]!.show(stops[even ? from + 1 : from] ?? null);
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
        .to(lift, { by: 0.1, duration: 0.2, ease: 'power2.out' })
        .to(lift, { by: 0, duration: 0.55, ease: 'power2.inOut' });
    },
    dispose: () => {
      pulsing?.kill();
      stage.dispose();
    },
  };
}
