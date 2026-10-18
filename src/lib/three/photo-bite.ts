import { Group, Sprite, SpriteMaterial, SRGBColorSpace, type Texture, TextureLoader } from 'three';
import type { FlavourId } from '../../content/flavours';
import { createModelBite, type ModelBite } from './bite-model';
import { onStageDispose, refreshStages } from './renderer';

// A bite in a 3D scene: the real cut-out photo of that flavour, standing on
// its base and always turned to face the camera. What you see is the
// photograph. A flavour with no photo yet (Coffee) is the modelled bite
// instead, until its photo exists.

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

// `solid`: a hard-edged cut-out instead of a soft one. Clear plastic drawn
// with transmission (the pack's sleeve) shows only solid things through it.
export function createBite(flavour: FlavourId, { solid = false }: { solid?: boolean } = {}): Bite3D {
  const group = new Group();
  // Unlit: the photograph already has its own light and shade.
  const material = solid
    ? new SpriteMaterial({ alphaTest: 0.5, opacity: 0, transparent: false })
    : new SpriteMaterial({ transparent: true, depthWrite: false, opacity: 0 });
  const photo = new Sprite(material);
  // Stands on its base, so it lands and squashes against the floor.
  photo.center.set(0.5, 0);
  group.add(photo);

  // Made only if a flavour without a photo is ever shown.
  let model: ModelBite | undefined;

  const bite: Bite3D = {
    group,
    flavour,
    setFlavour: (next) => {
      bite.flavour = next;
      const photographed = Boolean(urlOf(next));
      photo.visible = photographed;
      if (!photographed) {
        if (!model) {
          model = createModelBite();
          group.add(model.group);
        }
        model.blend(next, next, 1);
      }
      if (model) model.group.visible = !photographed;
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
