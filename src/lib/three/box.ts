import {
  type BufferGeometry,
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  ExtrudeGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  Vector3,
} from 'three';
import { BITE } from './photo-bite';
import { studioLight, type Stage } from './renderer';
import { paperTexture, shadowTexture } from './textures';

// The pack of five, as it is handed over: a long white paper tray with five
// round cups in a single row, and a clear PET sleeve the tray slides into.
// It stands on the origin, centred, with the front towards +z; the sleeve
// slides in from +x.
//
// TODO: the shape is a first guess from a description. Correct the sizes and
// the cups when Shlok's packaging photos arrive.

export interface Pack3D {
  group: Group;
  // Where each piece stands, left to right, in the pack's own space.
  slots: readonly Vector3[];
  // 0: the sleeve is off to the side; 1: the tray is all the way in.
  setSleeve: (inside: number) => void;
}

const PIECES = 5;
const PITCH = BITE.radius * 2 + 0.12;
const MARGIN = 0.16;
const CUP = { radius: BITE.radius - 0.03, depth: 0.13 };
export const TRAY = {
  width: PIECES * PITCH + MARGIN * 2,
  depth: BITE.radius * 2 + MARGIN * 2,
  height: 0.17,
} as const;
// Clear room round the tray and over the pieces.
export const SLEEVE = {
  width: TRAY.width + 0.06,
  depth: TRAY.depth + 0.08,
  height: TRAY.height + BITE.height + 0.08,
} as const;
// How far to the side the sleeve waits before it slides over the tray.
const SLEEVE_AWAY = SLEEVE.width + 0.6;

const corners = (width: number, depth: number, radius: number): Shape => {
  const shape = new Shape();
  const x = width / 2;
  const z = depth / 2;
  shape.moveTo(-x + radius, -z);
  shape.lineTo(x - radius, -z);
  shape.quadraticCurveTo(x, -z, x, -z + radius);
  shape.lineTo(x, z - radius);
  shape.quadraticCurveTo(x, z, x - radius, z);
  shape.lineTo(-x + radius, z);
  shape.quadraticCurveTo(-x, z, -x, z - radius);
  shape.lineTo(-x, -z + radius);
  shape.quadraticCurveTo(-x, -z, -x + radius, -z);
  return shape;
};

export function createPack(): Pack3D {
  const group = new Group();
  const centres = Array.from({ length: PIECES }, (_, index) => (index - (PIECES - 1) / 2) * PITCH);

  // ---- The tray: a slab of white card with five round holes, and a shallow
  // cup under each hole.
  const paper = new MeshStandardMaterial({ map: paperTexture(), color: '#fbf8f3', roughness: 0.92, side: DoubleSide });
  const outline = corners(TRAY.width, TRAY.depth, 0.12);
  for (const x of centres) {
    const hole = new Shape();
    hole.absarc(x, 0, CUP.radius, 0, Math.PI * 2, true);
    outline.holes.push(hole);
  }
  const slab: BufferGeometry = new ExtrudeGeometry(outline, {
    depth: TRAY.height,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 40,
  }).rotateX(Math.PI / 2);
  slab.translate(0, TRAY.height, 0);
  const tray = new Group();
  tray.add(new Mesh(slab, paper));

  const floor = TRAY.height - CUP.depth;
  const wall = new CylinderGeometry(CUP.radius, CUP.radius - 0.05, CUP.depth, 48, 1, true).translate(0, floor + CUP.depth / 2, 0);
  const base = new CircleGeometry(CUP.radius - 0.05, 48).rotateX(-Math.PI / 2).translate(0, floor, 0);
  // The inside of a cup is a touch darker: it is in its own shade.
  const inside = new MeshStandardMaterial({ map: paper.map, color: '#efe8de', roughness: 0.95, side: DoubleSide });
  for (const x of centres) {
    const cup = new Group();
    cup.add(new Mesh(wall, inside), new Mesh(base, inside));
    cup.position.x = x;
    tray.add(cup);
  }
  group.add(tray);

  // ---- The sleeve: an open-ended clear tube. Transmission lets the tray and
  // the pieces show through it as through real plastic, bent a little at
  // the edges; the studio map gives it something soft to reflect.
  const clear = new MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 0,
    roughness: 0,
    transmission: 1,
    thickness: 0.03,
    ior: 1.45,
    specularIntensity: 1,
    clearcoat: 0.4,
    clearcoatRoughness: 0.12,
    envMap: studioLight(),
    envMapIntensity: 0.55,
    // One-sided: three.js draws double-sided transmission twice, recompiling
    // it on the way, which stalls a phone; the inner walls add little here.
  });
  const none = new MeshBasicMaterial({ visible: false });
  // Box faces: right, left, top, bottom, front, back. The two ends are open.
  const faces: Material[] = [none, none, clear, clear, clear, clear];
  const tube = new BoxGeometry(SLEEVE.width, SLEEVE.height, SLEEVE.depth);
  const sleeveBody = new Mesh(tube, faces);
  sleeveBody.position.y = SLEEVE.height / 2 - 0.01;
  // Soft highlights along the folded edges, and a faint wine line so the
  // sleeve still reads on cream.
  const rim = new LineSegments(new EdgesGeometry(tube), new LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 }));
  const ink = new LineSegments(new EdgesGeometry(tube), new LineBasicMaterial({ color: '#7a1f2b', transparent: true, opacity: 0.16 }));
  ink.scale.setScalar(1.002);
  sleeveBody.add(rim, ink);
  // Two long streaks of light on the front face, as a window catches it.
  const streakMaterial = new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.28, depthWrite: false });
  for (const [x, y, long, wide] of [
    [-0.12, 0.3, 0.55, 0.035],
    [0.08, -0.22, 0.32, 0.022],
  ] as const) {
    const streak = new Mesh(new PlaneGeometry(SLEEVE.width * long, wide), streakMaterial);
    streak.position.set(SLEEVE.width * x, SLEEVE.height * y, SLEEVE.depth / 2 + 0.003);
    sleeveBody.add(streak);
  }
  const sleeve = new Group();
  sleeve.add(sleeveBody);
  group.add(sleeve);

  // ---- The contact shadow, soft on the cream table.
  const shadow = new Mesh(
    new PlaneGeometry(TRAY.width * 1.2, TRAY.depth * 2.4).rotateX(-Math.PI / 2),
    new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }),
  );
  shadow.position.set(0, 0.002, 0.06);
  group.add(shadow);

  const slots = centres.map((x) => new Vector3(x, floor, 0));

  const pack: Pack3D = {
    group,
    slots,
    setSleeve: (amount) => {
      sleeve.position.x = (1 - amount) * SLEEVE_AWAY;
      // Out of the way, it costs nothing to draw.
      sleeve.visible = amount > 0.001;
    },
  };
  pack.setSleeve(0);
  return pack;
}

// Points the camera at the pack from above the front, so it fills `fill` of
// the canvas width. `lower` moves it down the canvas (as a fraction of its
// height) to leave room above for pieces to drop in.
export const framePack = (
  stage: Stage,
  { fill, lower, elevation = 0.62 }: { fill: number; lower: number; elevation?: number },
): void => {
  const { camera } = stage;
  const halfHeight = Math.tan((camera.fov * Math.PI) / 360);
  const distance = SLEEVE.width / fill / (2 * halfHeight * stage.aspect());
  const targetY = SLEEVE.height / 2 + lower * 2 * halfHeight * distance;

  camera.position.set(0, targetY + Math.sin(elevation) * distance, Math.cos(elevation) * distance);
  camera.lookAt(0, targetY, 0);
  camera.updateMatrixWorld();
};
