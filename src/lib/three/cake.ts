import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  Vector3,
} from 'three';
import {
  bakedCreamTexture,
  compoteTexture,
  crumbTexture,
  cutFaceTexture,
  linenTexture,
  shadowTexture,
} from './textures';

// A whole round blueberry cheesecake on cream linen, with one wedge that can
// be cut and pulled out. The cake stands on the origin; angles are measured
// round the upright axis, and the wedge runs from 0 to WEDGE.

export interface Cake3D {
  group: Group;
  // The cake and its wedge, without the cloth: turn this to turn the cake.
  cake: Group;
  // The gap the wedge leaves (in the cake's own space): a point inside it,
  // between the two cut faces, and the way out of it past the rim.
  gap: { centre: Vector3; outward: Vector3 };
  // 0 to 1: the knife line being drawn, first one side of the wedge then the other.
  setCut: (drawn: number) => void;
  setCutVisible: (opacity: number) => void;
  // How far the wedge has slid out, in cake radii.
  setWedge: (out: number) => void;
  // 0 to 1: the puff of crumbs as the wedge comes free.
  setCrumbs: (puff: number) => void;
}

export const CAKE = { radius: 2, height: 0.95 } as const;
const WEDGE = Math.PI / 3;
const CRUST = 0.22;
const TOPPING = 0.07;
const WINE = '#7a1f2b';

// Where a point at `radius` and `angle` lies on the table.
const around = (radius: number, angle: number, y = 0): Vector3 =>
  new Vector3(Math.sin(angle) * radius, y, Math.cos(angle) * radius);

// A steady stand-in for random numbers, so the cake is the same every visit.
const scatter = (index: number, salt: number): number => {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

export function createCake(): Cake3D {
  const group = new Group();
  const cake = new Group();
  const wedge = new Group();
  const { radius, height } = CAKE;

  const crumb = new MeshStandardMaterial({
    map: crumbTexture('#c79a5b', ['#9a6e3a', '#e3c08a', '#7d5527'], 3),
    roughness: 0.9,
  });
  const cream = new MeshStandardMaterial({ map: bakedCreamTexture(), roughness: 0.7 });
  const fruitMap = compoteTexture();
  fruitMap.wrapS = fruitMap.wrapT = RepeatWrapping;
  fruitMap.repeat.set(4, 4);
  const fruit = new MeshStandardMaterial({ map: fruitMap, roughness: 0.25 });
  const berry = new MeshStandardMaterial({ color: '#2f2152', roughness: 0.35 });
  const cut = new MeshStandardMaterial({ map: cutFaceTexture(), roughness: 0.8, side: DoubleSide });

  // One piece of cake: the three layers through an arc, and its two cut faces.
  const piece = (from: number, arc: number): Group => {
    const part = new Group();
    const segments = Math.max(8, Math.round((arc / (Math.PI * 2)) * 72));
    const layer = (r: number, h: number, y: number, material: MeshStandardMaterial): void => {
      const mesh = new Mesh(new CylinderGeometry(r, r, h, segments, 1, false, from, arc), material);
      mesh.position.y = y + h / 2;
      part.add(mesh);
    };
    layer(radius, CRUST, 0, crumb);
    layer(radius - 0.03, height - CRUST - TOPPING, CRUST, cream);
    layer(radius - 0.1, TOPPING, height - TOPPING, fruit);

    for (const angle of [from, from + arc]) {
      const face = new Mesh(new PlaneGeometry(radius, height), cut);
      face.position.copy(around(radius / 2, angle, height / 2));
      face.rotation.y = angle - Math.PI / 2;
      part.add(face);
    }
    return part;
  };

  const rest = piece(WEDGE, Math.PI * 2 - WEDGE);
  wedge.add(piece(0, WEDGE));

  // Whole berries over the top, each on whichever piece it sits over.
  const berryShape = new SphereGeometry(0.11, 12, 8);
  for (let index = 0; index < 46; index += 1) {
    const angle = scatter(index, 1) * Math.PI * 2;
    const reach = Math.sqrt(scatter(index, 2)) * (radius - 0.35);
    const one = new Mesh(berryShape, berry);
    one.position.copy(around(reach, angle, height + 0.06));
    one.scale.setScalar(0.8 + scatter(index, 3) * 0.5);
    (angle < WEDGE ? wedge : rest).add(one);
  }

  // The knife line: one wine stroke along each side of the wedge, drawn from
  // the rim to the middle and then out again.
  const ink = new MeshBasicMaterial({ color: WINE, transparent: true });
  const strokes = [0, WEDGE].map((angle) => {
    const stroke = new Mesh(new BoxGeometry(radius, 0.01, 0.045).translate(radius / 2, 0, 0), ink);
    stroke.position.y = height + 0.015;
    // The box runs along x; turn it to lie along the radius.
    stroke.rotation.y = angle - Math.PI / 2;
    stroke.scale.x = 0.0001;
    cake.add(stroke);
    return stroke;
  });
  // The first stroke is drawn inwards, so it grows from the rim.
  strokes[0]!.geometry = new BoxGeometry(radius, 0.01, 0.045).translate(-radius / 2, 0, 0);
  strokes[0]!.position.copy(around(radius, 0, height + 0.015));

  // Crumbs that puff out of the cut as the wedge comes free.
  const crumbShape = new DodecahedronGeometry(0.05, 0);
  const crumbs = Array.from({ length: 16 }, (_, index) => {
    const one = new Mesh(crumbShape, crumb);
    one.visible = false;
    cake.add(one);
    const angle = scatter(index, 4) > 0.5 ? 0 : WEDGE;
    return {
      mesh: one,
      from: around(radius * (0.25 + scatter(index, 5) * 0.7), angle, height * (0.3 + scatter(index, 6) * 0.6)),
      drift: around(0.5 + scatter(index, 7) * 0.9, WEDGE / 2 + (scatter(index, 8) - 0.5) * 2.4),
      lift: 0.5 + scatter(index, 9) * 0.9,
    };
  });

  cake.add(rest, wedge);

  // The table: cream linen, and a soft shadow where the cake stands.
  const cloth = new Mesh(
    new CircleGeometry(30, 48).rotateX(-Math.PI / 2),
    new MeshStandardMaterial({ map: linenTexture(), roughness: 1 }),
  );
  cloth.position.y = -0.01;
  const shadow = new Mesh(
    new PlaneGeometry(radius * 3.3, radius * 3.3).rotateX(-Math.PI / 2),
    new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }),
  );
  shadow.position.y = 0.002;

  group.add(cloth, shadow, cake);

  const outwards = around(1, WEDGE / 2);

  return {
    group,
    cake,
    gap: { centre: around(radius * 0.3, WEDGE / 2, height * 0.5), outward: outwards.clone() },
    setCut: (drawn) => {
      strokes.forEach((stroke, order) => {
        const length = Math.min(1, drawn * 2 - order);
        stroke.visible = length > 0;
        stroke.scale.x = Math.max(0.0001, length);
      });
    },
    setCutVisible: (opacity) => {
      ink.opacity = opacity;
    },
    setWedge: (out) => {
      wedge.position.copy(outwards).multiplyScalar(out * radius);
    },
    setCrumbs: (puff) => {
      const flying = puff > 0 && puff < 1;
      for (const { mesh, from, drift, lift } of crumbs) {
        mesh.visible = flying;
        if (!flying) continue;
        // Out and up, then down again as it fades to nothing.
        mesh.position.copy(from).addScaledVector(drift, puff);
        mesh.position.y += lift * puff - 1.6 * puff * puff;
        mesh.scale.setScalar(1 - puff * puff);
      }
    },
  };
}
