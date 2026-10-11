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
// be cut and pulled out, and that wedge's three layers can be lifted apart.
// The cake stands on the origin; angles are measured round the upright axis,
// and the wedge runs from 0 to WEDGE.

export type LayerId = 'topping' | 'filling' | 'crust';

export interface Cake3D {
  group: Group;
  // The cake and its wedge, without the cloth: turn this to turn the cake.
  cake: Group;
  // Everything except the wedge: the rest of the cake, the cloth, the shadow.
  setting: Group;
  // The wedge's layers, each its own group so they can be moved apart.
  layers: Record<LayerId, Group>;
  // The gap the wedge leaves (in the cake's own space): a point inside it,
  // between the two cut faces, and the way out of it past the rim.
  gap: { centre: Vector3; outward: Vector3 };
  // The wedge's own cut face, seen from the side (in the cake's own space):
  // its middle, the way it faces, the way along it to the rim, and where
  // each layer meets the rim.
  side: { centre: Vector3; normal: Vector3; alongRim: Vector3; rim: Record<LayerId, Vector3> };
  // 0 to 1: the knife line being drawn, first one side of the wedge then the other.
  setCut: (drawn: number) => void;
  setCutVisible: (opacity: number) => void;
  // How far the wedge has slid out, in cake radii.
  setWedge: (out: number) => void;
  // 0 to 1: the puff of crumbs as the wedge comes free.
  setCrumbs: (puff: number) => void;
}

export const CAKE = { radius: 2, height: 0.95 } as const;
export const WEDGE = Math.PI / 3;
// How thick each layer is, and where it starts.
export const LAYER = {
  crust: { from: 0, thick: 0.22 },
  filling: { from: 0.22, thick: 0.66 },
  topping: { from: 0.88, thick: 0.07 },
} as const satisfies Record<LayerId, { from: number; thick: number }>;
const WINE = '#7a1f2b';

// Where a point at `radius` and `angle` lies on the table.
export const around = (radius: number, angle: number, y = 0): Vector3 =>
  new Vector3(Math.sin(angle) * radius, y, Math.cos(angle) * radius);

// A steady stand-in for random numbers, so the cake is the same every visit.
export const scatter = (index: number, salt: number): number => {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

export function createCake(): Cake3D {
  const group = new Group();
  const cake = new Group();
  const setting = new Group();
  const wedge = new Group();
  const { radius, height } = CAKE;

  const crumb = new MeshStandardMaterial({
    map: crumbTexture('#c79a5b', ['#9a6e3a', '#e3c08a', '#7d5527'], 3),
    roughness: 0.9,
    side: DoubleSide,
  });
  const cream = new MeshStandardMaterial({ map: bakedCreamTexture(), roughness: 0.7 });
  const creamCut = new MeshStandardMaterial({
    map: crumbTexture('#f7e8c4', ['#ecd7a4', '#fff6dc'], 19),
    roughness: 0.8,
    side: DoubleSide,
  });
  const fruitMap = compoteTexture();
  fruitMap.wrapS = fruitMap.wrapT = RepeatWrapping;
  fruitMap.repeat.set(4, 4);
  const fruit = new MeshStandardMaterial({ map: fruitMap, roughness: 0.25, side: DoubleSide });
  const berry = new MeshStandardMaterial({ color: '#2f2152', roughness: 0.35 });
  const cut = new MeshStandardMaterial({ map: cutFaceTexture(), roughness: 0.8, side: DoubleSide });

  // What each layer looks like round its edge, and where it has been cut.
  const look = {
    crust: { inset: 0, edge: crumb, cut: crumb },
    filling: { inset: 0.03, edge: cream, cut: creamCut },
    topping: { inset: 0.1, edge: fruit, cut: fruit },
  } as const;

  // One layer through an arc. With `faces`, its own cut ends are closed too.
  const layer = (id: LayerId, from: number, arc: number, faces: boolean): Group => {
    const part = new Group();
    const { from: y, thick } = LAYER[id];
    const r = radius - look[id].inset;
    const segments = Math.max(8, Math.round((arc / (Math.PI * 2)) * 72));
    const round = new Mesh(new CylinderGeometry(r, r, thick, segments, 1, false, from, arc), look[id].edge);
    round.position.y = y + thick / 2;
    part.add(round);

    if (faces) {
      for (const angle of [from, from + arc]) {
        const face = new Mesh(new PlaneGeometry(r, thick), look[id].cut);
        face.position.copy(around(r / 2, angle, y + thick / 2));
        face.rotation.y = angle - Math.PI / 2;
        part.add(face);
      }
    }
    return part;
  };

  // The rest of the cake: three layers, and one painted face at each cut.
  const rest = new Group();
  for (const id of ['crust', 'filling', 'topping'] as const) rest.add(layer(id, WEDGE, Math.PI * 2 - WEDGE, false));
  for (const angle of [WEDGE, Math.PI * 2]) {
    const face = new Mesh(new PlaneGeometry(radius, height), cut);
    face.position.copy(around(radius / 2, angle, height / 2));
    face.rotation.y = angle - Math.PI / 2;
    rest.add(face);
  }

  // The wedge: the same three layers, each on its own.
  const layers: Record<LayerId, Group> = {
    crust: layer('crust', 0, WEDGE, true),
    filling: layer('filling', 0, WEDGE, true),
    topping: layer('topping', 0, WEDGE, true),
  };
  wedge.add(layers.crust, layers.filling, layers.topping);

  // Whole berries over the top, each on whichever piece it sits over.
  const berryShape = new SphereGeometry(0.11, 12, 8);
  for (let index = 0; index < 46; index += 1) {
    const angle = scatter(index, 1) * Math.PI * 2;
    const reach = Math.sqrt(scatter(index, 2)) * (radius - 0.35);
    const one = new Mesh(berryShape, berry);
    one.position.copy(around(reach, angle, height + 0.06));
    one.scale.setScalar(0.8 + scatter(index, 3) * 0.5);
    (angle < WEDGE ? layers.topping : rest).add(one);
  }

  // The knife line: one wine stroke along each side of the wedge, drawn from
  // the rim to the middle and then out again.
  const ink = new MeshBasicMaterial({ color: WINE, transparent: true });
  const lineUp = height + 0.015;
  // The first stroke runs inwards from the rim, the second outwards from the middle.
  const inwards = new Mesh(new BoxGeometry(radius, 0.01, 0.045).translate(-radius / 2, 0, 0), ink);
  inwards.position.copy(around(radius, 0, lineUp));
  inwards.rotation.y = -Math.PI / 2;
  const outwardsStroke = new Mesh(new BoxGeometry(radius, 0.01, 0.045).translate(radius / 2, 0, 0), ink);
  outwardsStroke.position.y = lineUp;
  outwardsStroke.rotation.y = WEDGE - Math.PI / 2;
  const strokes = [inwards, outwardsStroke];
  strokes.forEach((stroke) => (stroke.visible = false));

  // Crumbs that puff out of the cut as the wedge comes free.
  const crumbShape = new DodecahedronGeometry(0.05, 0);
  const crumbs = Array.from({ length: 16 }, (_, index) => {
    const one = new Mesh(crumbShape, crumb);
    one.visible = false;
    const angle = scatter(index, 4) > 0.5 ? 0 : WEDGE;
    return {
      mesh: one,
      from: around(radius * (0.25 + scatter(index, 5) * 0.7), angle, height * (0.3 + scatter(index, 6) * 0.6)),
      drift: around(0.5 + scatter(index, 7) * 0.9, WEDGE / 2 + (scatter(index, 8) - 0.5) * 2.4),
      lift: 0.5 + scatter(index, 9) * 0.9,
    };
  });

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

  // The setting turns with the cake, so the rest of the cake keeps its place.
  setting.add(cloth, shadow, rest, ...strokes, ...crumbs.map((one) => one.mesh));
  cake.add(setting, wedge);
  group.add(cake);

  const outwards = around(1, WEDGE / 2);
  const middle = (id: LayerId): number => LAYER[id].from + LAYER[id].thick / 2;

  return {
    group,
    cake,
    setting,
    layers,
    gap: { centre: around(radius * 0.3, WEDGE / 2, height * 0.5), outward: outwards.clone() },
    side: {
      centre: around(radius / 2, 0, height / 2),
      // Square to the wedge's first cut face, pointing away from the wedge.
      normal: around(1, -Math.PI / 2),
      alongRim: around(1, 0),
      rim: {
        topping: around(radius - look.topping.inset, 0, middle('topping')),
        filling: around(radius - look.filling.inset, 0, middle('filling')),
        crust: around(radius, 0, middle('crust')),
      },
    },
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
