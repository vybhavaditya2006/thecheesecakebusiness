import gsap from 'gsap';
import {
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  type Object3D,
  PlaneGeometry,
  Raycaster,
  ShadowMaterial,
  Vector2,
} from 'three';
import { flavours } from '../../content/flavours';
import { createBite } from './bite';
import { createStage, studioLight } from './renderer';
import { shadowTexture } from './textures';

// The flavour turntable on Home: the five bites in a ring, turning slowly,
// lit like a product shot. One bite at a time can be lifted out of the ring.

export interface Turntable {
  // Which bite is under this point of the screen, if any.
  pick: (clientX: number, clientY: number) => number | null;
  // Lift a bite (by its place in the flavour list), or set them all down.
  lift: (index: number | null) => void;
  dispose: () => void;
}

const RING = 1.45;
// Radians a second: unhurried. The table stops while a bite is held up, so
// the bite stays under the pointer until the second tap.
const TURN = { idle: 0.22, held: 0 };

export function mountTurntable(container: HTMLElement, { onFallback }: { onFallback: () => void }): Turntable {
  const stage = createStage(container, { onFallback });
  const { scene, camera, key, canvas } = stage;
  scene.environment = studioLight();
  scene.environmentIntensity = 0.22;

  const table = new Group();
  const bites = flavours.map((flavour, index) => {
    const bite = createBite(flavour.id);
    const angle = (index / flavours.length) * Math.PI * 2;
    bite.group.position.set(Math.sin(angle) * RING, 0, Math.cos(angle) * RING);
    bite.group.rotation.y = angle;
    bite.group.traverse((part: Object3D) => {
      part.castShadow = part.receiveShadow = true;
    });

    // The soft patch each bite stands on stays on the table when it lifts.
    const patch = new Mesh(
      new PlaneGeometry(1.6, 1.6).rotateX(-Math.PI / 2),
      new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.65 }),
    );
    patch.position.set(bite.group.position.x, 0.002, bite.group.position.z);

    // What the pointer is tested against: a column that takes in the bite
    // both resting and lifted, so lifting it does not move it out from under
    // the pointer. It is drawn, but writes nothing to the picture.
    const reach = new Mesh(
      new CylinderGeometry(0.6, 0.6, 1.5, 16).translate(0, 0.75, 0),
      new MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
    );
    reach.position.set(bite.group.position.x, 0, bite.group.position.z);
    table.add(bite.group, patch, reach);
    return { group: bite.group, patch, reach };
  });

  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -3.2, right: 3.2, top: 3.2, bottom: -3.2, near: 1, far: 24 });
  const ground = new Mesh(
    new PlaneGeometry(14, 14).rotateX(-Math.PI / 2),
    new ShadowMaterial({ color: '#4a0f18', opacity: 0.2 }),
  );
  ground.receiveShadow = true;
  scene.add(table, ground);

  // Looking down on the ring from the front, close enough to fill the width.
  const frame = (): void => {
    const half = Math.tan((camera.fov * Math.PI) / 360);
    const back = Math.max((RING + 1.25) / (half * stage.aspect()), 6.4);
    camera.position.set(0, 0.35 + Math.sin(0.42) * back, Math.cos(0.42) * back);
    camera.lookAt(0, 0.3, 0);
    camera.updateMatrixWorld();
  };
  frame();
  stage.onResize(frame);

  let held: number | null = null;
  let last = 0;
  let speed = TURN.idle;
  stage.onFrame((seconds) => {
    const passed = last ? Math.min(0.1, seconds - last) : 0;
    last = seconds;
    // Eases between turning and still, never a sudden stop.
    speed += ((held === null ? TURN.idle : TURN.held) - speed) * Math.min(1, passed * 6);
    table.rotation.y += passed * speed;
  });

  const ray = new Raycaster();
  const pointer = new Vector2();

  return {
    pick: (clientX, clientY) => {
      const box = canvas.getBoundingClientRect();
      pointer.set(((clientX - box.left) / box.width) * 2 - 1, -((clientY - box.top) / box.height) * 2 + 1);
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(bites.map((bite) => bite.reach))[0]?.object;
      const found = bites.findIndex((bite) => bite.reach === hit);
      return found < 0 ? null : found;
    },
    lift: (index) => {
      if (index === held) return;
      held = index;
      bites.forEach((bite, place) => {
        const up = place === index;
        const size = up ? 1.14 : 1;
        gsap.to(bite.group.position, { y: up ? 0.5 : 0, duration: 0.6, ease: 'power3.out', overwrite: true });
        gsap.to(bite.group.scale, { x: size, y: size, z: size, duration: 0.6, ease: 'power3.out', overwrite: true });
        gsap.to(bite.patch.material, { opacity: up ? 0.3 : 0.65, duration: 0.6, overwrite: true });
      });
    },
    dispose: () => {
      for (const bite of bites) gsap.killTweensOf([bite.group.position, bite.group.scale, bite.patch.material]);
      stage.dispose();
    },
  };
}
