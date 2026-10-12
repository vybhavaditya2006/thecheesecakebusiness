import {
  BoxGeometry,
  DoubleSide,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Vector3,
} from 'three';
import { BITE } from './bite';
import type { Stage } from './renderer';
import { shadowTexture } from './textures';

// The pack of five, as it is really handed over: a clear plastic box that
// holds five bites in a row, with a clear lid hinged along the back. It
// stands on the origin, centred, with the front towards +z.

export interface Box3D {
  group: Group;
  // Where each bite stands, left to right, in the box's own space.
  slots: readonly Vector3[];
  // 1 is fully open, 0 is shut.
  setLid: (open: number) => void;
}

const BITES = 5;
// The bites sit shoulder to shoulder, with a little room round them.
const PITCH = BITE.radius * 2 + 0.07;
const GAP = 0.09;
export const BOX = {
  width: BITES * PITCH + GAP * 2,
  height: 0.66,
  depth: BITE.radius * 2 + GAP * 2 + 0.07,
} as const;

const LID = { height: 0.3, openAngle: -1.9 };
const FLOOR = 0.02;

export function createBox(): Box3D {
  const group = new Group();
  const { width, height, depth } = BOX;

  // Clear plastic: almost nothing but its sheen, and a fine line at each edge.
  const clear = new MeshStandardMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.14,
    roughness: 0.05,
    side: DoubleSide,
    depthWrite: false,
  });
  const none = new MeshBasicMaterial({ visible: false });
  const edge = new LineBasicMaterial({ color: '#7a1f2b', transparent: true, opacity: 0.32 });
  const shine = new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.4, depthWrite: false, side: DoubleSide });

  // Box faces are ordered right, left, top, bottom, front, back.
  const faces = (top: Material, bottom: Material): Material[] => [clear, clear, top, bottom, clear, clear];
  const outlined = (mesh: Mesh): Mesh => {
    mesh.add(new LineSegments(new EdgesGeometry(mesh.geometry), edge));
    return mesh;
  };
  // A streak of light along a face, the way clear plastic catches it.
  const streak = (long: number, wide: number): Mesh => new Mesh(new PlaneGeometry(long, wide), shine);

  // The tray: four walls and a floor, open at the top.
  const tray = outlined(new Mesh(new BoxGeometry(width, height, depth), faces(none, clear)));
  tray.position.y = height / 2;
  const frontShine = streak(width * 0.5, 0.045);
  frontShine.position.set(-width * 0.18, height * 0.72, depth / 2 + 0.002);
  tray.add(frontShine.clone().translateY(-height / 2), frontShine.clone().translateY(-height / 2 - 0.09).translateX(width * 0.12));

  const slots: Vector3[] = [];
  for (let index = 0; index < BITES; index += 1) {
    slots.push(new Vector3((index - (BITES - 1) / 2) * PITCH, FLOOR, 0));
  }

  // The lid: a shallow clear cap that turns on a hinge along the back.
  const hinge = new Group();
  hinge.position.set(0, height, -depth / 2);
  const lid = outlined(new Mesh(new BoxGeometry(width + 0.03, LID.height, depth + 0.03), faces(clear, none)));
  lid.position.set(0, LID.height / 2, depth / 2);
  const lidShine = streak(width * 0.42, 0.05).rotateX(-Math.PI / 2);
  lidShine.position.set(width * 0.16, LID.height / 2 + 0.002, -depth * 0.18);
  lid.add(lidShine);
  hinge.add(lid);

  // The contact shadow: a soft blob on the table under the pack.
  const shadow = new Mesh(
    new PlaneGeometry(width * 1.22, depth * 2.1).rotateX(-Math.PI / 2),
    new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }),
  );
  shadow.position.set(0, 0.002, 0.1);

  group.add(shadow, tray, hinge);

  const box: Box3D = {
    group,
    slots,
    setLid: (open) => {
      hinge.rotation.x = LID.openAngle * open;
    },
  };
  box.setLid(1);
  return box;
}

// Points the camera at the pack from above the front, so it fills `fill` of
// the canvas width. `lower` moves it down the canvas (as a fraction of its
// height) to leave room above for bites to fall through.
export const frameBox = (stage: Stage, { fill, lower }: { fill: number; lower: number }): void => {
  const { camera } = stage;
  const elevation = 0.7;
  const halfHeight = Math.tan((camera.fov * Math.PI) / 360);
  const distance = BOX.width / fill / (2 * halfHeight * stage.aspect());
  const targetY = BOX.height / 2 + lower * 2 * halfHeight * distance;

  camera.position.set(0, targetY + Math.sin(elevation) * distance, Math.cos(elevation) * distance);
  camera.lookAt(0, targetY, 0);
  camera.updateMatrixWorld();
};
