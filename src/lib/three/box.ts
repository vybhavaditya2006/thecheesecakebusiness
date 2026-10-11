import {
  BackSide,
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
  MeshStandardMaterial,
  Path,
  PlaneGeometry,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { BITE } from './bite';
import type { Stage } from './renderer';
import { boxPaperTexture, shadowTexture } from './textures';

// The box of five: a cream box with a cavity for each bite, a lid hinged
// along the back, and a wine ribbon tied in a bow on the front. It stands on
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
const CREAM = '#f3e7da';

export function createBox(): Box3D {
  const group = new Group();
  const { width, height, depth } = BOX;

  const paper = new MeshStandardMaterial({ map: boxPaperTexture(), roughness: 0.92 });
  const inside = new MeshStandardMaterial({ color: '#e6d4c2', roughness: 1, side: BackSide });
  const floor = new MeshStandardMaterial({ color: '#dcc7b3', roughness: 1 });
  const none = new MeshBasicMaterial({ visible: false });
  const ink = new LineBasicMaterial({ color: WINE, transparent: true, opacity: 0.55 });

  // Box faces are ordered right, left, top, bottom, front, back.
  const sides = (top: Material, bottom: Material, wall: Material): Material[] => [wall, wall, top, bottom, wall, wall];
  // The etched look: a fine wine line along every edge.
  const outlined = (mesh: Mesh): Mesh => {
    mesh.add(new LineSegments(new EdgesGeometry(mesh.geometry), ink));
    return mesh;
  };

  // The walls and base; the top is the plate with the cavities cut in it.
  const body = outlined(new Mesh(new BoxGeometry(width, height, depth), sides(none, paper, paper)));
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
  const lid = outlined(
    new Mesh(new BoxGeometry(width + 0.06, LID.height, depth + 0.06), sides(lidPaper, none, lidPaper)),
  );
  lid.position.set(0, LID.height / 2, depth / 2);
  hinge.add(lid);

  // The ribbon: a band around the walls. The bow sits on the front of it.
  const satin = new MeshStandardMaterial({ color: WINE, roughness: 0.45 });
  const ribbon = new Mesh(new BoxGeometry(width + 0.03, 0.24, depth + 0.03), sides(none, none, satin));
  ribbon.position.y = height * 0.45;

  const bow = new Group();
  bow.position.set(0, height * 0.45, depth / 2 + 0.07);
  // The bow group is scaled by the tying animation, so its size is set one level in.
  const bowShape = new Group();
  bowShape.scale.setScalar(1.5);
  bow.add(bowShape);
  const bowPaper = new MeshStandardMaterial({ color: CREAM, roughness: 0.6 });
  const loop = new TorusGeometry(0.17, 0.055, 10, 22);
  const tail = new BoxGeometry(0.1, 0.36, 0.02);
  for (const side of [-1, 1]) {
    const bowLoop = new Mesh(loop, bowPaper);
    bowLoop.scale.set(1.3, 0.8, 0.5);
    bowLoop.position.x = side * 0.25;
    bowLoop.rotation.z = side * -0.25;
    const bowTail = new Mesh(tail, bowPaper);
    bowTail.position.set(side * 0.13, -0.22, -0.01);
    bowTail.rotation.z = side * 0.5;
    bowShape.add(bowLoop, bowTail);
  }
  const knot = new Mesh(new SphereGeometry(0.085, 16, 12), satin);
  knot.scale.set(1, 1.1, 0.7);
  bowShape.add(knot);

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
