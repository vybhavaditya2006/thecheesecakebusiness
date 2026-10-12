import {
  type BufferGeometry,
  BoxGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  type Material,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector2,
} from 'three';
import type { FlavourId } from '../../content/flavours';
import { onStageDispose } from './renderer';
import {
  bakedCreamTexture,
  compoteTexture,
  crumbTexture,
  paperCupTexture,
  waferTexture,
} from './textures';

// A round cheesecake bite in a fluted paper cup: digestive crumb crust, baked
// cream body, and a topping that changes with the flavour. It stands on its
// base at the origin, 1 unit across, so it squashes against the floor.

export interface Bite3D {
  group: Group;
  flavour: FlavourId;
  setFlavour: (flavour: FlavourId) => void;
  // A plain bite has no topping on it.
  setPlain: (plain: boolean) => void;
}

export const BITE = { radius: 0.5, height: 0.56 } as const;

const FOLDS = 30;
const TOP = BITE.height;

// Geometry and materials are built once and shared by every bite.
const cache = new Map<string, BufferGeometry | Material>();
onStageDispose(() => cache.clear());

const once = <Kind extends BufferGeometry | Material>(name: string, build: () => Kind): Kind => {
  if (!cache.has(name)) cache.set(name, build());
  return cache.get(name) as Kind;
};

const matte = (
  name: string,
  build: () => ConstructorParameters<typeof MeshStandardMaterial>[0],
): MeshStandardMaterial =>
  // Materials are filed apart from geometry, which may share a name.
  once(`material:${name}`, () => new MeshStandardMaterial({ roughness: 0.85, ...build() }));

// The cup: a flared tube whose wall is pushed in and out to make the folds.
const cupGeometry = (): BufferGeometry =>
  once('cup', () => {
    const geometry = new CylinderGeometry(BITE.radius, 0.41, 0.44, FOLDS * 8, 4, true);
    const position = geometry.getAttribute('position');
    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const z = position.getZ(index);
      const y = position.getY(index);
      // Deeper folds towards the rim.
      const depth = 0.012 + (y + 0.22) * 0.05;
      const push = 1 + (Math.cos(Math.atan2(z, x) * FOLDS) * depth) / Math.hypot(x, z);
      position.setXYZ(index, x * push, y, z * push);
    }
    geometry.translate(0, 0.22, 0);
    geometry.computeVertexNormals();
    return geometry;
  });

// The body: straight sides and a softly rounded top edge.
const bodyGeometry = (): BufferGeometry =>
  once('body', () => {
    const radius = 0.455;
    const profile = [new Vector2(0.43, 0.13), new Vector2(radius, 0.2), new Vector2(radius, TOP - 0.07)];
    for (let step = 1; step <= 6; step += 1) {
      const angle = (step / 6) * (Math.PI / 2);
      profile.push(new Vector2(radius - 0.07 + Math.cos(angle) * 0.07, TOP - 0.07 + Math.sin(angle) * 0.07));
    }
    profile.push(new Vector2(0, TOP));
    return new LatheGeometry(profile, 80);
  });

const mesh = (geometry: BufferGeometry, material: Material): Mesh => new Mesh(geometry, material);

// A ring of small pieces scattered over the top.
const scatter = (pieces: number, place: (piece: Mesh, index: number) => void, build: () => Mesh): Group => {
  const group = new Group();
  for (let index = 0; index < pieces; index += 1) {
    const piece = build();
    place(piece, index);
    group.add(piece);
  }
  return group;
};

const ringPlace =
  (radius: number, lift: number) =>
  (piece: Mesh, index: number): void => {
    // The golden angle spreads the pieces without lining them up.
    const angle = index * 2.4;
    const reach = radius * (0.25 + ((index * 0.37) % 0.75));
    piece.position.set(Math.cos(angle) * reach, TOP + lift, Math.sin(angle) * reach);
    piece.rotation.set(index * 1.3, index * 2.1, index * 0.7);
  };

const toppings: Record<FlavourId, () => Group> = {
  // Blueberry: a glossy pool of compote, off to one side, as on the real bite.
  blueberry: () => {
    const group = new Group();
    const compote = matte('compote', () => ({ map: compoteTexture(), roughness: 0.22 }));
    const pool = (x: number, z: number, wide: number, long: number): Mesh => {
      const one = mesh(
        once('pool', () => new SphereGeometry(0.3, 48, 16).scale(1, 0.14, 1)),
        compote,
      );
      one.position.set(x, TOP + 0.008, z);
      one.scale.set(wide, 1, long);
      return one;
    };
    group.add(pool(-0.03, -0.06, 0.62, 0.8), pool(0.07, 0.12, 0.8, 0.62));
    group.rotation.y = 0.5;
    return group;
  },

  // KitKat: two pieces of a finger laid side by side, wafer showing at the break.
  kitkat: () => {
    const group = new Group();
    const chocolate = matte('chocolate', () => ({
      color: '#74442a',
      roughness: 0.4,
    }));
    const cut = matte('wafer', () => ({ map: waferTexture(), roughness: 0.9 }));
    for (const side of [-1, 1]) {
      const piece = new Mesh(
        once('finger', () => new BoxGeometry(0.22, 0.1, 0.3)),
        // Box faces: right, left, top, bottom, front, back. The break is at the front.
        [chocolate, chocolate, chocolate, chocolate, cut, chocolate],
      );
      piece.position.set(side * 0.125, TOP + 0.05, side * 0.02);
      piece.rotation.y = side * -0.14;
      group.add(piece);
    }
    group.rotation.y = 0.35;
    return group;
  },

  // Oreo: cookie broken over the bare top, in dark pieces of every size.
  oreo: () => {
    const cookie = matte('cookie', () => ({
      map: crumbTexture('#1a1716', ['#0c0b0b', '#3a3534'], 61),
      roughness: 0.95,
    }));
    return scatter(
      14,
      (piece, index) => {
        ringPlace(0.36, 0.03)(piece, index);
        const size = 0.8 + ((index * 0.53) % 1) * 1.2;
        piece.scale.set(size, size * 0.7, size);
      },
      () =>
        mesh(
          once('chunk', () => new DodecahedronGeometry(0.07, 0)),
          cookie,
        ),
    );
  },

  // Coffee: nothing on top. The flavour is in the cream itself.
  coffee: () => new Group(),

  // Biscoff: biscuit crumbled over the bare top, in pieces of every size.
  biscoff: () => {
    const crumb = matte('biscoff-crumb', () => ({
      map: crumbTexture('#b9753b', ['#8a5226', '#dba367', '#6e3f1c'], 71),
    }));
    return scatter(16, (piece, index) => {
      ringPlace(0.36, 0.02)(piece, index);
      const size = 0.7 + ((index * 0.61) % 1) * 1.1;
      piece.scale.set(size, size * 0.6, size);
    }, () =>
      mesh(
        once('chunk', () => new DodecahedronGeometry(0.07, 0)),
        crumb,
      ),
    );
  },
};

export function createBite(flavour: FlavourId): Bite3D {
  const group = new Group();

  const cup = mesh(
    cupGeometry(),
    matte('paper', () => ({
      map: paperCupTexture(FOLDS),
      side: DoubleSide,
      roughness: 0.95,
    })),
  );
  const crust = mesh(
    once('crust', () => new CylinderGeometry(0.44, 0.415, 0.13, 40).translate(0, 0.085, 0)),
    matte('crust', () => ({
      map: crumbTexture('#c79a5b', ['#9a6e3a', '#e3c08a', '#7d5527'], 3),
    })),
  );
  // The cream is the same for every flavour but Coffee, which is light
  // brown all the way through.
  const cream = (of: FlavourId): Material =>
    of === 'coffee'
      ? matte('coffee-cream', () => ({ map: bakedCreamTexture(), color: '#cda27c', roughness: 0.7 }))
      : matte('cream', () => ({ map: bakedCreamTexture(), roughness: 0.7 }));
  const body = mesh(bodyGeometry(), cream(flavour));
  group.add(cup, crust, body);

  let topping = toppings[flavour]();
  group.add(topping);

  const bite: Bite3D = {
    group,
    flavour,
    setFlavour: (next) => {
      if (next === bite.flavour) return;
      group.remove(topping);
      const shown = topping.visible;
      topping = toppings[next]();
      topping.visible = shown;
      group.add(topping);
      body.material = cream(next);
      bite.flavour = next;
    },
    setPlain: (plain) => {
      topping.visible = !plain;
    },
  };
  return bite;
}
