import {
  BackSide,
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Path,
  PlaneGeometry,
  Shape,
  Vector3,
} from 'three';
import { BITE } from './bite';
import type { Stage } from './renderer';
import { boxPaperTexture, shadowTexture } from './textures';

// The box of five: a cream box with a cavity for each bite, a lid hinged
// along the back, and a slim wine ribbon with a flat bow on the front. It stands on
// the origin, centred, with the front towards +z.

export interface Box3D {
  group: Group;
  // The floor of each cavity, left to right, in the box's own space.
  slots: readonly Vector3[];
  ribbon: Mesh;
  bow: Group;
  // 1 is fully open, 0 is shut.
  setLid: (open: number) => void;
}

const CAVITIES = 5;
const CAVITY = { radius: BITE.radius + 0.035, depth: 0.4, pitch: 1.13 };
export const BOX = {
  width: (CAVITIES - 1) * CAVITY.pitch + CAVITY.radius * 2 + 0.3,
  height: 0.82,
  depth: CAVITY.radius * 2 + 0.3,
} as const;

const LID = { height: 0.42, openAngle: -1.9 };
const WINE = '#7a1f2b';

export function createBox(): Box3D {
  const group = new Group();
  const { width, height, depth } = BOX;

  const paper = new MeshStandardMaterial({ map: boxPaperTexture(), roughness: 0.92 });
  const inside = new MeshStandardMaterial({ color: '#e6d4c2', roughness: 1, side: BackSide });
  const floor = new MeshStandardMaterial({ color: '#dcc7b3', roughness: 1 });
  const none = new MeshBasicMaterial({ visible: false });

  // Box faces are ordered right, left, top, bottom, front, back.
  const sides = (top: Material, bottom: Material, wall: Material): Material[] => [wall, wall, top, bottom, wall, wall];

  // The walls and base; the top is the plate with the cavities cut in it.
  const body = new Mesh(new BoxGeometry(width, height, depth), sides(none, paper, paper));
  body.position.y = height / 2;

  const outline = new Shape();
  outline.moveTo(-width / 2, -depth / 2);
  outline.lineTo(width / 2, -depth / 2);
  outline.lineTo(width / 2, depth / 2);
  outline.lineTo(-width / 2, depth / 2);
  outline.closePath();

  const slots: Vector3[] = [];
  const wall = new CylinderGeometry(CAVITY.radius, CAVITY.radius, CAVITY.depth, 40, 1, true);
  const base = new CircleGeometry(CAVITY.radius, 40).rotateX(-Math.PI / 2);
  for (let index = 0; index < CAVITIES; index += 1) {
    const x = (index - (CAVITIES - 1) / 2) * CAVITY.pitch;
    const hole = new Path();
    hole.absarc(x, 0, CAVITY.radius, 0, Math.PI * 2, true);
    outline.holes.push(hole);

    const cavityWall = new Mesh(wall, inside);
    cavityWall.position.set(x, height - CAVITY.depth / 2, 0);
    const cavityFloor = new Mesh(base, floor);
    cavityFloor.position.set(x, height - CAVITY.depth, 0);
    group.add(cavityWall, cavityFloor);
    slots.push(cavityFloor.position.clone());
  }
  const plate = new Mesh(
    new ExtrudeGeometry(outline, { depth: 0.02, bevelEnabled: false, curveSegments: 20 }).rotateX(-Math.PI / 2),
    paper,
  );
  plate.position.y = height - 0.02;

  // The lid turns on a hinge along the top of the back wall.
  const hinge = new Group();
  hinge.position.set(0, height, -depth / 2);
  const lidPaper = new MeshStandardMaterial({ map: paper.map, roughness: 0.92, side: DoubleSide });
  const lid = new Mesh(new BoxGeometry(width + 0.06, LID.height, depth + 0.06), sides(lidPaper, none, lidPaper));
  lid.position.set(0, LID.height / 2, depth / 2);
  hinge.add(lid);

  // The ribbon: a band around the walls. The bow sits on the front of it.
  const satin = new MeshStandardMaterial({ color: WINE, roughness: 0.4 });
  const ribbon = new Mesh(new BoxGeometry(width + 0.02, 0.15, depth + 0.02), sides(none, none, satin));
  ribbon.position.y = height * 0.45;

  // The bow: flat satin, cut as two loops, two tails and a knot.
  const bow = new Group();
  bow.position.set(0, ribbon.position.y, depth / 2 + 0.03);
  const flat = { depth: 0.02, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 1 };
  for (const side of [-1, 1]) {
    const loop = new Shape();
    loop.moveTo(0, 0);
    loop.bezierCurveTo(side * 0.12, 0.2, side * 0.5, 0.22, side * 0.5, 0.02);
    loop.bezierCurveTo(side * 0.5, -0.16, side * 0.14, -0.1, 0, 0);
    // The opening of the loop: the same outline, smaller, about its middle.
    const opening = new Path().setFromPoints(
      loop.getPoints(16).map((point) => point.clone().sub({ x: side * 0.3, y: 0.03 }).multiplyScalar(0.55).add({ x: side * 0.3, y: 0.03 })),
    );
    loop.holes.push(opening);

    const tail = new Shape();
    tail.moveTo(0, 0);
    tail.lineTo(side * 0.1, -0.02);
    tail.lineTo(side * 0.3, -0.4);
    tail.lineTo(side * 0.21, -0.33);
    tail.lineTo(side * 0.15, -0.43);
    tail.closePath();

    bow.add(new Mesh(new ExtrudeGeometry(loop, flat), satin), new Mesh(new ExtrudeGeometry(tail, flat), satin));
  }
  const knot = new Mesh(new ExtrudeGeometry(new Shape().absellipse(0, 0, 0.055, 0.075, 0, Math.PI * 2), { ...flat, depth: 0.04 }), satin);
  bow.add(knot);

  // The contact shadow: a soft blob on the table under the box.
  const shadow = new Mesh(
    new PlaneGeometry(width * 1.22, depth * 2).rotateX(-Math.PI / 2),
    new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }),
  );
  shadow.position.set(0, 0.002, 0.1);

  group.add(shadow, body, plate, hinge, ribbon, bow);

  const box: Box3D = {
    group,
    slots,
    ribbon,
    bow,
    setLid: (open) => {
      hinge.rotation.x = LID.openAngle * open;
    },
  };
  box.setLid(1);
  return box;
}

// Points the camera at the box from above the front, so the box fills `fill`
// of the canvas width. `lower` moves the box down the canvas (as a fraction
// of its height) to leave room above for bites to fall through.
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
