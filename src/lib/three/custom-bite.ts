import gsap from 'gsap';
import {
  CylinderGeometry,
  DodecahedronGeometry,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
  PlaneGeometry,
  ShadowMaterial,
  SphereGeometry,
} from 'three';
import { bodyGeometry, cupGeometry, MODEL_BITE } from './bite-model';
import { createStage, studioLight } from './renderer';
import { paperCupTexture, shadowTexture } from './textures';

// "Build your own bite" on Custom & Gifts: a bite that is put together layer
// by layer as each choice is made. Base, filling, centre and topping each
// drop into the paper cup in the colour of what was chosen.

export type CustomLayer = 'base' | 'filling' | 'centre' | 'topping';

export interface CustomBite {
  // Sets a layer to a colour, dropping it into place; null takes it away.
  set: (layer: CustomLayer, colour: string | null) => void;
  dispose: () => void;
}

const TOP = MODEL_BITE.height;
const MIDDLE = TOP / 2 + 0.03;
// How far above its place a layer starts its drop.
const DROP = 1.5;

export function mountCustomBite(container: HTMLElement, { onFallback }: { onFallback: () => void }): CustomBite {
  const stage = createStage(container, { onFallback, sharp: true });
  const { scene, camera, key } = stage;
  scene.environment = studioLight();
  scene.environmentIntensity = 0.16;
  // The same warm, quiet light as the Flavours bite.
  key.color.set('#ffe2bd');
  key.intensity = 1.45;
  scene.traverse((light: Object3D) => {
    if (light instanceof HemisphereLight) light.intensity = 1.3;
  });

  const turntable = new Group();
  const cup = new Mesh(
    cupGeometry(),
    new MeshStandardMaterial({ map: paperCupTexture(38), color: '#f6e9d8', side: DoubleSide, roughness: 0.92 }),
  );
  turntable.add(cup);

  // Each layer is a group that stands in its own place and can be dropped in.
  const layer = (build: (material: MeshStandardMaterial) => Object3D[], roughness = 0.75) => {
    const material = new MeshStandardMaterial({ roughness });
    const group = new Group();
    group.add(...build(material));
    group.visible = false;
    turntable.add(group);
    return { group, material, colour: undefined as string | null | undefined };
  };
  const layers = {
    base: layer(
      (material) => [new Mesh(new CylinderGeometry(0.425, 0.4, 0.13, 40).translate(0, 0.085, 0), material)],
      0.9,
    ),
    filling: layer((material) => [new Mesh(bodyGeometry(), material)], 0.62),
    // The centre shows as a pool in the middle of the top.
    centre: layer(
      (material) => [new Mesh(new SphereGeometry(0.17, 28, 12).scale(1, 0.2, 1).translate(0, TOP + 0.006, 0), material)],
      0.3,
    ),
    // The topping is scattered in a ring round it.
    topping: layer((material) =>
      Array.from({ length: 12 }, (_, index) => {
        const piece = new Mesh(new DodecahedronGeometry(0.055, 0), material);
        const angle = index * 2.4;
        const reach = 0.24 + ((index * 0.37) % 0.14);
        piece.position.set(Math.cos(angle) * reach, TOP + 0.035, Math.sin(angle) * reach);
        piece.rotation.set(index * 1.3, index * 2.1, index * 0.7);
        piece.scale.setScalar(0.8 + ((index * 0.61) % 0.7));
        return piece;
      }),
    ),
  } satisfies Record<CustomLayer, ReturnType<typeof layer>>;

  const shade = (): void =>
    turntable.traverse((part: Object3D) => {
      part.castShadow = part.receiveShadow = true;
    });
  shade();

  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -1.4, right: 1.4, top: 2.4, bottom: -1.4, near: 1, far: 20 });
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
  scene.add(turntable, ground, contact);

  // Room above the bite for a layer to fall through.
  const frame = (): void => {
    const away = 3.7 / Math.min(1, stage.aspect());
    camera.position.set(0, MIDDLE + 0.2 + Math.sin(0.42) * away, Math.cos(0.42) * away);
    camera.lookAt(0, MIDDLE + 0.22, 0);
  };
  frame();
  stage.onResize(frame);

  // A slow turn, so every side of what has been built comes round.
  stage.onFrame((seconds) => {
    turntable.rotation.y = seconds * 0.35;
  });

  return {
    set: (name, colour) => {
      const one = layers[name];
      if (colour === one.colour) return;
      one.colour = colour;
      gsap.killTweensOf([one.group.position, one.group.scale]);

      if (!colour) {
        // Lifted out and away.
        gsap.to(one.group.scale, {
          x: 0.001,
          y: 0.001,
          z: 0.001,
          duration: 0.25,
          ease: 'power2.in',
          onComplete: () => {
            one.group.visible = false;
          },
        });
        return;
      }

      one.material.color.set(colour);
      one.group.visible = true;
      one.group.scale.set(1, 1, 1);
      // Falls into the cup and settles.
      gsap
        .timeline()
        .fromTo(one.group.position, { y: DROP }, { y: 0, duration: 0.42, ease: 'power2.in' })
        .to(one.group.scale, { x: 1.04, y: 0.93, z: 1.04, duration: 0.08, ease: 'power1.out' })
        .to(one.group.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: 'power2.out' });
    },
    dispose: () => {
      for (const one of Object.values(layers)) gsap.killTweensOf([one.group.position, one.group.scale]);
      stage.dispose();
    },
  };
}
