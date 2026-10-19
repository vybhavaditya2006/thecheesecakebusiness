import gsap from 'gsap';
import { Vector3 } from 'three';
import type { FlavourId } from '../../content/flavours';
import { BITE, createBite, type Bite3D } from './photo-bite';
import { createPack, framePack, TRAY } from './box';
import { dropBite } from './moves';
import { createStage } from './renderer';

// The pack on /box in 3D. It mirrors the order: whatever is in the current
// box is in the tray's cups, each new piece drops into the next cup, and at
// five the tray slides into its clear sleeve. Taking a piece out slides it
// back out first. Starting a new box moves the full one off to the side and
// brings an empty tray in. A drag turns the pack a little, within limits.

// Where things land on the canvas, as fractions of its width and height, so
// the page can line its tap targets up with the cups.
export interface BoxLayout {
  slots: { x: number; y: number; size: number }[];
  // The top of the tray's front edge.
  rim: number;
}

export interface BuilderBox {
  // `bites` is what the current box holds, `sleeved` puts the tray in its
  // sleeve, and a new `box` number brings in a fresh tray.
  sync: (bites: readonly FlavourId[], sleeved: boolean, box: number, instant?: boolean) => void;
  dispose: () => void;
}

interface Options {
  onLayout: (layout: BoxLayout) => void;
  onFallback: () => void;
  // Where a drag turns the pack (the 2D stage, which also holds the tap targets).
  dragSurface?: HTMLElement;
}

// The sleeve waits for the last piece to land (s), then takes this long.
const LANDING = 0.45;
const SLEEVE_IN = 1;
const SLEEVE_OUT = 0.7;
// A drag turns the pack at most this far (radians).
const TURN = { y: 0.42, x: 0.16 };
const SIDEWAYS = TRAY.width * 1.6;

export function mountBuilderBox(container: HTMLElement, { onLayout, onFallback, dragSurface }: Options): BuilderBox {
  const stage = createStage(container, { onFallback, backdrop: '#f3e7da' });
  const pack = createPack();
  const turner = pack.group;
  stage.scene.add(turner);
  // The sleeve's clear plastic is the costliest material: compile it now, so
  // it does not stall the first time the sleeve slides in.
  pack.setSleeve(1);
  stage.prepare();
  pack.setSleeve(0);

  // What sits in each cup now.
  let placed: (Bite3D | undefined)[] = [];
  const spare: Bite3D[] = [];
  const moving = new Map<object, gsap.core.Animation>();
  const sleeve = { amount: 0 };
  let sleeved = false;
  let boxNumber = -1;

  // Camera first, then tell the page where each piece's place ended up.
  const frame = (): void => {
    framePack(stage, { fill: 0.92, lower: 0.15 });
    const point = new Vector3();
    const project = (x: number, y: number, z: number): { x: number; y: number } => {
      point.set(x, y, z).project(stage.camera);
      return { x: (point.x + 1) / 2, y: (1 - point.y) / 2 };
    };
    onLayout({
      slots: pack.slots.map((slot) => {
        const middle = slot.y + BITE.height / 2;
        const centre = project(slot.x, middle, slot.z);
        const edge = project(slot.x + BITE.radius, middle, slot.z);
        return { ...centre, size: (edge.x - centre.x) * 2 };
      }),
      rim: project(0, TRAY.height, TRAY.depth / 2).y,
    });
  };
  frame();
  stage.onResize(frame);

  const stop = (target: object): void => {
    moving.get(target)?.kill();
    moving.delete(target);
  };
  const run = (target: object, animation: gsap.core.Animation): void => {
    stop(target);
    moving.set(target, animation);
  };

  const release = (bite: Bite3D): void => {
    stop(bite);
    turner.remove(bite.group);
    bite.group.scale.set(1, 1, 1);
    spare.push(bite);
  };

  // Lifted up out of its cup and out of view.
  const take = (bite: Bite3D, instant: boolean, delay = 0): void => {
    if (instant) return release(bite);
    run(
      bite,
      gsap
        .timeline({ delay, onUpdate: stage.invalidate, onComplete: () => release(bite) })
        .to(bite.group.position, { y: '+=2.6', duration: 0.3, ease: 'power2.in' }, 0),
    );
  };

  const put = (slot: number, flavour: FlavourId, instant: boolean, delay = 0): Bite3D => {
    const bite = spare.pop() ?? createBite(flavour, { solid: true });
    bite.setFlavour(flavour);
    stop(bite);
    const home = pack.slots[slot]!;
    bite.group.position.copy(home);
    bite.group.scale.set(1, 1, 1);
    bite.group.visible = true;
    turner.add(bite.group);
    if (!instant) run(bite, dropBite(stage, bite.group, home.y, delay));
    return bite;
  };

  // Moves a piece along the tray to another cup (when one before it is taken).
  const shift = (bite: Bite3D, slot: number, instant: boolean, delay = 0): void => {
    const x = pack.slots[slot]!.x;
    if (instant) {
      bite.group.position.x = x;
      return;
    }
    run(bite, gsap.to(bite.group.position, { x, delay, duration: 0.4, ease: 'power2.out', onUpdate: stage.invalidate }));
  };

  const slide = (inside: boolean, instant: boolean, delay = 0): void => {
    sleeved = inside;
    const apply = (): void => {
      pack.setSleeve(sleeve.amount);
      stage.invalidate();
    };
    stop(sleeve);
    if (instant) {
      sleeve.amount = inside ? 1 : 0;
      return apply();
    }
    run(
      sleeve,
      gsap.to(sleeve, {
        amount: inside ? 1 : 0,
        delay,
        duration: inside ? SLEEVE_IN : SLEEVE_OUT,
        ease: inside ? 'power3.out' : 'power2.inOut',
        onUpdate: apply,
      }),
    );
  };

  // Puts the cups in step with `bites`. Pieces that stay keep their place or
  // slide along; the rest drop in or lift out.
  const arrange = (bites: readonly FlavourId[], instant: boolean, delay: number): boolean => {
    const next: (Bite3D | undefined)[] = [];
    const left = placed.map((bite, slot) => (bite ? { bite, slot } : undefined)).filter(Boolean) as { bite: Bite3D; slot: number }[];
    const claim = (want: FlavourId, slot: number): Bite3D | undefined => {
      // The same piece in the same cup, or else the nearest one of that
      // flavour further along (everything after a taken piece moves up).
      let index = left.findIndex((entry) => entry.slot === slot && entry.bite.flavour === want);
      if (index < 0) index = left.findIndex((entry) => entry.slot > slot && entry.bite.flavour === want);
      if (index < 0) return undefined;
      const [entry] = left.splice(index, 1);
      if (entry!.slot !== slot) shift(entry!.bite, slot, instant, delay + 0.15);
      return entry!.bite;
    };
    bites.forEach((want, slot) => {
      next[slot] = claim(want, slot);
    });
    left.forEach(({ bite }) => take(bite, instant, delay));
    let dropped = false;
    bites.forEach((want, slot) => {
      if (next[slot]) return;
      next[slot] = put(slot, want, instant, delay);
      dropped ||= !instant;
    });
    placed = next;
    return dropped;
  };

  // A full box moves off to the side, and an empty tray comes in from the other.
  const changeBox = (then: () => void): void => {
    run(
      turner.position,
      gsap
        .timeline({ onUpdate: stage.invalidate })
        .to(turner.position, { x: -SIDEWAYS, duration: 0.35, ease: 'power2.in' })
        .add(() => {
          placed.forEach((bite) => bite && release(bite));
          placed = [];
          slide(false, true);
          turner.position.x = SIDEWAYS;
        })
        .to(turner.position, { x: 0, duration: 0.5, ease: 'power3.out' })
        .add(then, '-=0.15'),
    );
  };

  // ---- A drag turns the pack a little; letting go eases it back.
  const turn = { y: 0, x: 0 };
  const applyTurn = (): void => {
    turner.rotation.set(turn.x, turn.y, 0);
    stage.invalidate();
  };
  let drag: { x: number; y: number; id: number; moved: boolean } | undefined;
  const onDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, id: event.pointerId, moved: false };
  };
  const onMove = (event: PointerEvent): void => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 8) return;
    // Mostly up and down on a touch screen is a scroll, not a turn.
    if (!drag.moved && event.pointerType !== 'mouse' && Math.abs(dy) > Math.abs(dx)) {
      drag = undefined;
      return;
    }
    drag.moved = true;
    stop(turn);
    const width = container.clientWidth || 1;
    turn.y = gsap.utils.clamp(-TURN.y, TURN.y, (dx / width) * TURN.y * 2.2);
    turn.x = gsap.utils.clamp(-TURN.x, TURN.x, (dy / width) * TURN.x * 2.2);
    applyTurn();
  };
  const onUp = (event: PointerEvent): void => {
    if (!drag || event.pointerId !== drag.id) return;
    const moved = drag.moved;
    drag = undefined;
    if (!moved) return;
    run(turn, gsap.to(turn, { x: 0, y: 0, duration: 0.8, ease: 'power2.out', onUpdate: applyTurn }));
    // A drag is not a tap: keep it from taking out the piece it ended on.
    const swallow = (click: Event): void => {
      click.stopPropagation();
      click.preventDefault();
    };
    dragSurface?.addEventListener('click', swallow, { capture: true, once: true });
    window.setTimeout(() => dragSurface?.removeEventListener('click', swallow, { capture: true }), 0);
  };
  if (dragSurface) {
    dragSurface.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  return {
    sync: (bites, inside, box, instant = false) => {
      const fresh = box !== boxNumber;
      boxNumber = box;
      const update = (now: boolean): void => {
        // Taking a piece out of a sleeved box: the tray slides out first.
        const waitForSleeve = sleeved && !inside && !now;
        if (sleeved && !inside) slide(false, now);
        const dropped = arrange(bites, now, waitForSleeve ? SLEEVE_OUT : 0);
        if (inside && !sleeved) slide(true, now, dropped ? LANDING : 0);
        stage.invalidate();
      };
      if (fresh && !instant && placed.some(Boolean)) changeBox(() => update(false));
      else {
        if (fresh) {
          placed.forEach((bite) => bite && release(bite));
          placed = [];
          slide(false, true);
        }
        update(instant);
      }
    },
    dispose: () => {
      moving.forEach((animation) => animation.kill());
      if (dragSurface) {
        dragSurface.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      }
      stage.dispose();
    },
  };
}
