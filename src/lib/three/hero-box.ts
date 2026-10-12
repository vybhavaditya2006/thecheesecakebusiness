import { flavours } from '../../content/flavours';
import { createBite } from './bite';
import { createBox, frameBox } from './box';
import { closeLid, dropBite } from './moves';
import { createStage } from './renderer';

// The Home hero in 3D: the box of five, one bite of each flavour. The bites
// drop in, the clear lid closes, then the pack turns very slightly from side to side.

export interface HeroBox {
  // The intro, from an empty pack. Resolves when the lid has closed.
  playIntro: () => Promise<void>;
  // Straight to the finished box, for when the 2D intro has already played.
  showFinished: () => void;
  dispose: () => void;
}

interface Options {
  onFallback: () => void;
}

const BITE_GAP = 0.18;

export function mountHeroBox(container: HTMLElement, { onFallback }: Options): HeroBox {
  const stage = createStage(container, { onFallback });
  const box = createBox();
  stage.scene.add(box.group);

  const bites = flavours.map((flavour, index) => {
    const bite = createBite(flavour.id);
    bite.group.position.copy(box.slots[index]!);
    bite.group.rotation.y = index * 1.1;
    box.group.add(bite.group);
    return bite;
  });

  // The canvas reaches above the box, so the box sits low in it.
  const frame = (): void => frameBox(stage, { fill: 0.84, lower: 0.25 });
  frame();
  stage.onResize(frame);

  // Idle: a slow, small turn from side to side.
  stage.onFrame((seconds) => {
    box.group.rotation.y = Math.sin(seconds * 0.45) * 0.05;
  });

  const playing: (ReturnType<typeof dropBite> | ReturnType<typeof closeLid>)[] = [];

  return {
    playIntro: () =>
      new Promise((resolve) => {
        bites.forEach((bite, index) => {
          playing.push(dropBite(stage, bite.group, box.slots[index]!.y, index * BITE_GAP));
        });
        playing.push(closeLid(stage, box, bites.length * BITE_GAP + 0.35).eventCallback('onComplete', resolve));
      }),
    showFinished: () => {
      box.setLid(0);
      stage.invalidate();
    },
    dispose: () => {
      playing.forEach((timeline) => timeline.kill());
      stage.dispose();
    },
  };
}
