import { Group, Sprite, SpriteMaterial, SRGBColorSpace, type Texture, TextureLoader } from 'three';
import type { FlavourId } from '../../content/flavours';
import { onStageDispose, refreshStages } from './renderer';

// A bite in a 3D scene: the real cut-out photo of that flavour, standing on
// its base and always turned to face the camera. Nothing here is modelled;
// what you see is the photograph.

export interface Bite3D {
  group: Group;
  flavour: FlavourId;
  setFlavour: (flavour: FlavourId) => void;
}

// How much room a bite takes in a scene: 1 unit across, standing on the origin.
export const BITE = { radius: 0.5, height: 0.8 } as const;
// The photo is shown a touch wider than its footprint, as the paper cup flares.
const WIDTH = 1.06;

// Small copies of the cut-outs, made for use as textures.
const files = import.meta.glob<string>('../../assets/bites/tex/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
const urlOf = (flavour: FlavourId): string | undefined => files[`../../assets/bites/tex/${flavour}.webp`];

// One texture per flavour, shared by every bite of it.
const textures = new Map<FlavourId, Texture>();
onStageDispose(() => textures.clear());

const textureOf = (flavour: FlavourId, onReady: (texture: Texture) => void): void => {
  const known = textures.get(flavour);
  if (known?.image) return onReady(known);
  const url = urlOf(flavour);
  if (!url) return;
  const loading = new TextureLoader().load(url, (loaded) => {
    loaded.colorSpace = SRGBColorSpace;
    onReady(loaded);
    // The picture arrived after the scene was drawn: draw it again.
    refreshStages();
  });
  textures.set(flavour, loading);
};

export function createBite(flavour: FlavourId): Bite3D {
  const group = new Group();
  // Unlit: the photograph already has its own light and shade.
  const material = new SpriteMaterial({ transparent: true, depthWrite: false, opacity: 0 });
  const photo = new Sprite(material);
  // Stands on its base, so it lands and squashes against the floor.
  photo.center.set(0.5, 0);
  group.add(photo);

  const bite: Bite3D = {
    group,
    flavour,
    setFlavour: (next) => {
      bite.flavour = next;
      textureOf(next, (texture) => {
        // A slow picture must not overwrite a flavour chosen since.
        if (bite.flavour !== next) return;
        const { width, height } = texture.image as { width: number; height: number };
        material.map = texture;
        material.opacity = 1;
        material.needsUpdate = true;
        photo.scale.set(WIDTH, (WIDTH * height) / width, 1);
      });
    },
  };
  bite.setFlavour(flavour);
  return bite;
}
