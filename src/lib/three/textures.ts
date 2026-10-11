import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

// Every texture in the kit is painted here on a canvas; there are no image
// or model files. The random numbers are seeded, so each visit looks the same.

type Paint = (context: CanvasRenderingContext2D, size: number, random: () => number) => void;

const seeded = (seed: number) => (): number => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const paint = (size: number, seed: number, draw: Paint): CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d')!, size, seeded(seed));
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
};

// Scatter of small specks, for anything crumbly.
const specks = (
  context: CanvasRenderingContext2D,
  size: number,
  random: () => number,
  colours: readonly string[],
  count: number,
  largest = 3.2,
): void => {
  for (let index = 0; index < count; index += 1) {
    context.fillStyle = colours[Math.floor(random() * colours.length)]!;
    context.globalAlpha = 0.35 + random() * 0.6;
    const radius = 0.6 + random() * largest;
    context.beginPath();
    context.ellipse(random() * size, random() * size, radius, radius * (0.6 + random() * 0.6), random() * 3, 0, 7);
    context.fill();
  }
  context.globalAlpha = 1;
};

// A crumb: a base colour with darker and lighter grains.
export const crumbTexture = (base: string, grains: readonly string[], seed: number): CanvasTexture =>
  paint(256, seed, (context, size, random) => {
    context.fillStyle = base;
    context.fillRect(0, 0, size, size);
    specks(context, size, random, grains, 1500);
  });

// The baked cream body, wrapped up the side and over the top: pale at the
// side, golden where the top edge caught the heat, pale again in the middle.
export const bakedCreamTexture = (): CanvasTexture =>
  paint(256, 11, (context, size, random) => {
    const bake = context.createLinearGradient(0, size, 0, 0);
    bake.addColorStop(0, '#f3dfb4');
    bake.addColorStop(0.42, '#f6e4bc');
    bake.addColorStop(0.56, '#dba65a');
    bake.addColorStop(0.68, '#eccb8a');
    bake.addColorStop(1, '#f8e9c2');
    context.fillStyle = bake;
    context.fillRect(0, 0, size, size);
    // Browner blotches along the edge, and fine pores all over.
    for (let index = 0; index < 60; index += 1) {
      context.fillStyle = '#b97a34';
      context.globalAlpha = 0.08 + random() * 0.14;
      context.beginPath();
      context.ellipse(random() * size, size * (0.36 + random() * 0.12), 6 + random() * 14, 3 + random() * 5, 0, 0, 7);
      context.fill();
    }
    specks(context, size, random, ['#e0bd7c', '#fff4d6'], 500, 1.4);
  });

// The fluted paper cup: off-white, with a soft shadow in every fold.
export const paperCupTexture = (folds: number): CanvasTexture => {
  const texture = paint(128, 5, (context, size) => {
    const fold = context.createLinearGradient(0, 0, size, 0);
    fold.addColorStop(0, '#e9dfd0');
    fold.addColorStop(0.5, '#fffaf2');
    fold.addColorStop(1, '#e9dfd0');
    context.fillStyle = fold;
    context.fillRect(0, 0, size, size);
  });
  texture.wrapS = RepeatWrapping;
  texture.repeat.set(folds, 1);
  return texture;
};

// Cream paper for the box, with a faint fibre.
export const boxPaperTexture = (): CanvasTexture =>
  paint(256, 23, (context, size, random) => {
    context.fillStyle = '#f3e7da';
    context.fillRect(0, 0, size, size);
    specks(context, size, random, ['#e9d8c7', '#fbf3ea'], 700, 1.6);
  });

// Blueberry compote: deep purple, glossy, with darker skins.
export const compoteTexture = (): CanvasTexture =>
  paint(128, 31, (context, size, random) => {
    context.fillStyle = '#3d1f63';
    context.fillRect(0, 0, size, size);
    specks(context, size, random, ['#2a1247', '#5a3590', '#7a4fb0'], 220, 5);
  });

// Coffee marble: brown ribbons swirled through cream.
export const marbleTexture = (): CanvasTexture =>
  paint(256, 41, (context, size, random) => {
    context.fillStyle = '#f4e3c0';
    context.fillRect(0, 0, size, size);
    context.lineCap = 'round';
    for (const [colour, width, alpha] of [
      ['#6f4e37', 16, 0.5],
      ['#4a2f1e', 7, 0.75],
      ['#a8794f', 4, 0.6],
    ] as const) {
      const offset = random() * 6;
      context.strokeStyle = colour;
      context.lineWidth = width;
      context.globalAlpha = alpha;
      context.beginPath();
      for (let turn = 0; turn < 26; turn += 0.08) {
        const radius = turn * 4.6 + Math.sin(turn * 2.3 + offset) * 5;
        const x = size / 2 + Math.cos(turn + offset) * radius;
        const y = size / 2 + Math.sin(turn + offset) * radius;
        if (turn) context.lineTo(x, y);
        else context.moveTo(x, y);
      }
      context.stroke();
    }
    context.globalAlpha = 1;
  });

// The cut face of a wafer finger: biscuit layers between chocolate.
export const waferTexture = (): CanvasTexture =>
  paint(64, 53, (context, size) => {
    context.fillStyle = '#5a3320';
    context.fillRect(0, 0, size, size);
    context.fillStyle = '#e2bb7c';
    for (const y of [14, 28, 42]) context.fillRect(7, y, size - 14, 7);
  });

// A soft dark blob to sit under things: the contact shadow.
export const shadowTexture = (): CanvasTexture =>
  paint(128, 0, (context, size) => {
    const blob = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    blob.addColorStop(0, 'rgb(74 15 24 / 0.42)');
    blob.addColorStop(0.55, 'rgb(74 15 24 / 0.16)');
    blob.addColorStop(1, 'rgb(74 15 24 / 0)');
    context.fillStyle = blob;
    context.fillRect(0, 0, size, size);
  });

// Cream linen for the table: a fine weave of slightly darker threads.
export const linenTexture = (): CanvasTexture => {
  const texture = paint(128, 83, (context, size, random) => {
    context.fillStyle = '#f3e7da';
    context.fillRect(0, 0, size, size);
    for (let line = 0; line < size; line += 2) {
      context.globalAlpha = 0.03 + random() * 0.04;
      context.fillStyle = random() > 0.5 ? '#e2d2c1' : '#fbf5ee';
      context.fillRect(0, line, size, 1);
      context.fillRect(line, 0, 1, size);
    }
    context.globalAlpha = 1;
  });
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(40, 40);
  return texture;
};

// A cheesecake cut straight down: crumb base, cream, and the fruit on top.
export const cutFaceTexture = (): CanvasTexture =>
  paint(256, 97, (context, size, random) => {
    context.fillStyle = '#f7e8c4';
    context.fillRect(0, 0, size, size);
    specks(context, size, random, ['#ecd7a4', '#fff6dc'], 900, 1.6);
    // The crumb base, along the bottom quarter.
    context.fillStyle = '#c79a5b';
    context.fillRect(0, size * 0.76, size, size * 0.24);
    context.save();
    context.beginPath();
    context.rect(0, size * 0.76, size, size * 0.24);
    context.clip();
    specks(context, size, random, ['#9a6e3a', '#e3c08a', '#7d5527'], 700);
    context.restore();
    // The compote, soaking a little way into the top.
    const fruit = context.createLinearGradient(0, 0, 0, size * 0.16);
    fruit.addColorStop(0, '#3d1f63');
    fruit.addColorStop(0.6, '#5a3590');
    fruit.addColorStop(1, 'rgb(90 53 144 / 0)');
    context.fillStyle = fruit;
    context.fillRect(0, 0, size, size * 0.16);
  });
