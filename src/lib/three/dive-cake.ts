import {
  Color,
  DodecahedronGeometry,
  Euler,
  type Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { flavours } from '../../content/flavours';
import { createBite } from './photo-bite';
import { BOX, createBox } from './box';
import { around, CAKE, createCake, LAYER, type LayerId, scatter, WEDGE } from './cake';
import { DIVE } from './dive-beats';
import { createStage } from './renderer';
import { isPhone } from './support';

// The whole-cake scene on Home, driven entirely by scroll. Every frame is
// worked out from one number, how far through the scene the page is, so
// scrolling back plays it exactly in reverse.
//
// Act one: the whole cake from above, the cut, the wedge sliding out, and the
// camera coming down into the gap. Act two, behind the cream circle: the
// wedge alone from the side, its layers lifting apart and the crust breaking
// into crumbs. Act three: everything swirls into one bite, which drops into
// the box of five.

export interface DiveCake {
  // `at` is the position in the scene, from 0 to 1.
  setProgress: (at: number) => void;
  dispose: () => void;
}

export type LabelPoints = Record<LayerId, { x: number; y: number }>;

interface Options {
  // Where each layer meets the rim of the slice, as fractions of the canvas,
  // for the page to hang its labels on. Sent again whenever the canvas resizes.
  onLabels: (points: LabelPoints) => void;
  onFallback: () => void;
}

type Span = readonly [number, number];
const between = (value: number, [from, to]: Span): number => Math.max(0, Math.min(1, (value - from) / (to - from)));
const ease = (value: number): number => value * value * (3 - 2 * value);
const mix = (from: number, to: number, amount: number): number => from + (to - from) * amount;

// How far the cake turns over the top-down beats (radians).
const TURN = 1.1;
const CRUMBS = { desktop: 400, phone: 150 };
// How far the box of five sits below the slice, out of sight until it is needed.
const BOX_BELOW = 9;
const UP = new Vector3(0, 1, 0);

export function mountDiveCake(container: HTMLElement, { onLabels, onFallback }: Options): DiveCake {
  const stage = createStage(container, { onFallback });
  const { camera } = stage;
  const cake = createCake();
  stage.scene.add(cake.group);

  // Once the camera stops, the cake holds at TURN; these are where the
  // slice's side face is from then on, in the scene's own space.
  const turned = (point: Vector3): Vector3 => point.clone().applyAxisAngle(UP, TURN);
  const side = {
    centre: turned(cake.side.centre),
    normal: turned(cake.side.normal),
    alongRim: turned(cake.side.alongRim),
  };
  const facing = Math.atan2(side.normal.x, side.normal.z);

  // ---- The crumbs: one instanced mesh, crust crumbs and cream flecks.
  const count = isPhone() ? CRUMBS.phone : CRUMBS.desktop;
  const crumbs = new InstancedMesh(
    new DodecahedronGeometry(0.028, 0),
    new MeshStandardMaterial({ roughness: 0.9 }),
    count,
  );
  crumbs.frustumCulled = false;
  const tints = ['#c79a5b', '#9a6e3a', '#e3c08a', '#7d5527'].map((tint) => new Color(tint));
  const creamTint = new Color('#f7e8c4');
  // Each crumb: where it starts inside the slice, where it is thrown, how it tumbles.
  const flight = Array.from({ length: count }, (_, index) => {
    const fleck = index % 4 === 3;
    const layer = fleck ? LAYER.filling : LAYER.crust;
    crumbs.setColorAt(index, fleck ? creamTint : tints[index % tints.length]!);
    return {
      fleck,
      home: around(
        Math.sqrt(scatter(index, 11)) * (CAKE.radius - 0.1),
        scatter(index, 12) * WEDGE,
        layer.from + scatter(index, 13) * layer.thick,
      ),
      // Every way outwards, but mostly towards the camera, off the cut face.
      out: around(1, WEDGE / 2 + (scatter(index, 14) - 0.5) * 3.2)
        .add(cake.side.normal)
        .normalize(),
      reach: 0.5 + scatter(index, 15) * 2.2,
      lift: 0.3 + scatter(index, 16) * 1.3,
      spin: new Vector3(scatter(index, 17) - 0.5, scatter(index, 18) - 0.5, scatter(index, 19) - 0.5).multiplyScalar(14),
      size: (fleck ? 0.6 : 0.7) + scatter(index, 20) * 0.9,
    };
  });
  cake.cake.add(crumbs);

  // ---- The ending: the box of five with one cavity empty, and the bite for it.
  const box = createBox();
  box.group.rotation.y = facing;
  box.group.position.copy(side.centre).addScaledVector(side.alongRim, 0.8).setY(-BOX_BELOW);
  stage.scene.add(box.group);
  flavours.slice(1).forEach((flavour, index) => {
    const waiting = createBite(flavour.id);
    waiting.group.position.copy(box.slots[index + 1]!);
    waiting.group.rotation.y = (index + 1) * 1.1;
    box.group.add(waiting.group);
  });
  const bite = createBite(flavours[0]!.id);
  stage.scene.add(bite.group);
  // The first cavity, and the point above it where the bite forms.
  const cavity = box.slots[0]!.clone().applyAxisAngle(UP, facing).add(box.group.position);
  const hover = cavity.clone().setY(cavity.y + 2.4);
  // The same point as the cake sees it, for the crumbs and layers to swirl towards.
  const gather = hover.clone().applyAxisAngle(UP, -TURN);
  const sliceMiddle = around(CAKE.radius * 0.6, WEDGE / 2, CAKE.height / 2);

  // ---- Camera positions for the second and third acts.
  const pose = { position: new Vector3(), target: new Vector3() };
  const sidePose = { position: new Vector3(), target: new Vector3() };
  const boxPose = { position: new Vector3(), target: new Vector3() };
  const half = Math.tan((camera.fov * Math.PI) / 360);
  const placeCameras = (): void => {
    const aspect = stage.aspect();
    // The slice fills about half the width, on the left; labels go on the right.
    const across = Math.max(CAKE.radius * 2, 2.4 * aspect);
    const back = across / (2 * half * aspect);
    sidePose.target.copy(side.centre).addScaledVector(side.alongRim, across * 0.2);
    sidePose.position.copy(sidePose.target).addScaledVector(side.normal, back).addScaledVector(UP, back * 0.1);

    // The box fills most of the width, sitting high to leave room beneath.
    const away = Math.max(BOX.width / 0.66 / (2 * half * aspect), 12.5);
    boxPose.target.copy(box.group.position).setY(box.group.position.y - away * half * 0.12);
    boxPose.position
      .copy(boxPose.target)
      .addScaledVector(side.normal, Math.cos(0.7) * away)
      .addScaledVector(UP, Math.sin(0.7) * away);
  };

  const look = (from: Vector3, to: Vector3): void => {
    camera.position.copy(from);
    camera.lookAt(to);
    camera.updateMatrixWorld();
  };

  // Tells the page where the layer labels go.
  const point = new Vector3();
  const placeLabels = (): void => {
    look(sidePose.position, sidePose.target);
    const on = (id: LayerId): { x: number; y: number } => {
      point.copy(turned(cake.side.rim[id])).project(camera);
      return { x: (point.x + 1) / 2, y: (1 - point.y) / 2 };
    };
    onLabels({ topping: on('topping'), filling: on('filling'), crust: on('crust') });
  };

  const target = new Vector3();
  const gapCentre = new Vector3();
  const gapOutward = new Vector3();
  const matrix = new Matrix4();
  const place = new Vector3();
  const turn = new Quaternion();
  const tumble = new Euler();
  const size = new Vector3();
  const rel = new Vector3();
  let position = 0;

  const render = (): void => {
    const at = position;
    const inside = at >= DIVE.enter[1];

    // ---- Act one.
    // The cake turns until the camera starts to move, then holds still.
    cake.cake.rotation.y = (Math.min(at, DIVE.sweep[0]) / DIVE.sweep[0]) * TURN;
    cake.setting.visible = !inside;
    cake.setCut(between(at, DIVE.cut));
    cake.setCutVisible(1 - between(at, [DIVE.slide[0] + 0.03, DIVE.slide[1]]));
    const sweep = ease(between(at, DIVE.sweep));
    // Out a little as it is cut free, right away as the camera comes down,
    // and back in its place (alone) for the second act.
    cake.setWedge(inside ? 0 : ease(between(at, DIVE.slide)) * 0.55 + sweep * 4);
    cake.setCrumbs(between(at, DIVE.slide));

    // ---- Act two: the layers lift apart and the crust breaks up.
    const apart = ease(between(at, DIVE.explode));
    const shatter = between(at, DIVE.shatter);
    const thrown = 1 - (1 - shatter) * (1 - shatter);
    const swirl = ease(between(at, DIVE.swirl));
    const drop = between(at, DIVE.drop);
    const shrink = 1 - swirl;
    const crustDown = -0.4 * apart;

    // Towards the gathering point a layer spirals in and shrinks away. The
    // layer shrinks about the cake's centre, so its place is set to keep the
    // middle of the slice on the spiral.
    const drawIn = (layer: Group, lift: number): void => {
      rel
        .copy(sliceMiddle)
        .setY(sliceMiddle.y + lift)
        .sub(gather)
        .applyAxisAngle(UP, swirl * 5)
        .multiplyScalar(shrink * shrink);
      layer.scale.setScalar(Math.max(0.0001, shrink));
      layer.position.copy(gather).add(rel).addScaledVector(sliceMiddle, -shrink);
      layer.visible = shrink > 0.001;
    };
    drawIn(cake.layers.topping, 0.5 * apart);
    drawIn(cake.layers.filling, 0);
    cake.layers.crust.position.set(0, crustDown, 0);
    cake.layers.crust.visible = shatter === 0;

    crumbs.visible = shatter > 0 && swirl < 1;
    if (crumbs.visible) {
      const tumbled = thrown + swirl;
      flight.forEach((crumb, index) => {
        // Thrown out and up from where it sat, falling as it goes...
        place.copy(crumb.home).addScaledVector(crumb.out, crumb.reach * thrown);
        place.y += (crumb.fleck ? 0 : crustDown) + crumb.lift * thrown - 0.9 * thrown * thrown;
        // ...then wound in on a spiral to where the bite forms.
        rel
          .copy(place)
          .sub(gather)
          .applyAxisAngle(UP, swirl * 6)
          .multiplyScalar(shrink * shrink);
        place.copy(gather).add(rel);

        tumble.set(crumb.spin.x * tumbled, crumb.spin.y * tumbled, crumb.spin.z * tumbled);
        size.setScalar(crumb.size * (1 - swirl * swirl * swirl));
        crumbs.setMatrixAt(index, matrix.compose(place, turn.setFromEuler(tumble), size));
      });
      crumbs.instanceMatrix.needsUpdate = true;
    }

    // ---- Act three: the bite forms, then drops into the box.
    box.group.visible = at >= DIVE.swirl[0];
    const formed = ease(between(swirl, [0.6, 1]));
    bite.group.visible = formed > 0;
    bite.group.position.copy(hover).lerp(cavity, drop * drop);
    bite.group.rotation.y = (1 - formed) * 4;
    // A slight give as it lands.
    const give = Math.sin(Math.PI * between(at, [DIVE.drop[1], DIVE.drop[1] + 0.02])) * 0.08;
    bite.group.scale.set(formed * (1 + give * 0.6), Math.max(0.0001, formed * (1 - give)), formed * (1 + give * 0.6));

    // ---- The camera.
    if (!inside) {
      // From straight above the middle of the cake, down and round to look
      // into the gap, between the two cut faces, closing in on where they meet.
      gapCentre.copy(cake.gap.centre).applyAxisAngle(UP, cake.cake.rotation.y);
      gapOutward.copy(cake.gap.outward).applyAxisAngle(UP, cake.cake.rotation.y);
      const towards = Math.atan2(gapOutward.x, gapOutward.z);
      const above = (CAKE.radius * 6.2) / Math.min(1, stage.aspect());
      const elevation = mix(Math.PI / 2 - 0.02, 0.08, sweep);
      const bearing = towards - (1 - sweep) * 1.3;
      const distance = mix(above, CAKE.radius * 0.75, sweep);

      target.set(0, CAKE.height / 2, 0).lerp(gapCentre, sweep);
      pose.position.set(
        target.x + Math.cos(elevation) * Math.sin(bearing) * distance,
        target.y + Math.sin(elevation) * distance,
        target.z + Math.cos(elevation) * Math.cos(bearing) * distance,
      );
      look(pose.position, target);
    } else {
      // Side on to the slice, then down to the box as everything swirls in.
      pose.position.copy(sidePose.position).lerp(boxPose.position, swirl);
      pose.target.copy(sidePose.target).lerp(boxPose.target, swirl);
      look(pose.position, pose.target);
    }
  };

  const resize = (): void => {
    placeCameras();
    placeLabels();
    render();
  };
  stage.onResize(resize);
  resize();

  return {
    setProgress: (at) => {
      position = at;
      render();
      stage.invalidate();
    },
    dispose: () => stage.dispose(),
  };
}
