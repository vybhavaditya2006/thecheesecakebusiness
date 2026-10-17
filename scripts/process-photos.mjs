// Photo pipeline: makes every photo on the site from the camera originals in
// photodump/, and saves it as a lossless PNG master. Astro then encodes each
// master once, at build time, to AVIF and WebP. Nothing here ever reads an
// image that has already been compressed for the site.
//
//   node scripts/process-photos.mjs              everything
//   node scripts/process-photos.mjs kitkat oreo  only those (by output name)
//   node scripts/process-photos.mjs ingredients  only the ingredient cut-outs
//                                    (or ingredients/kitkat for one)
//
// Needs: Python with rembg (pip install "rembg[cpu]", which brings pymatting
// and scipy) for the cut-outs, and Chrome or Edge for the stills of the 3D bite.
//
// Full-frame photos  -> src/assets/photos/masters/<name>.png, 2400 px on the long side
// Single pieces      -> src/assets/bites/<flavour>.png, cut out, 2000 px on the long side
// 3D textures        -> src/assets/bites/tex/<flavour>.webp (small copies for three.js)
// No photo yet       -> src/assets/bites/renders/<flavour>.png, a still of the 3D bite
// Ingredients        -> src/assets/ingredients/<name>.png, cut out, 1200 px, from
//                       photodump/ingredients/<name>.heic (or .jpg), when it exists
// Before and after   -> review/ (git-ignored), at 100%
//
// Neither size is ever reached by enlarging: a crop smaller than that keeps
// its own size.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import decodeHeic from 'heic-decode';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dump = join(root, 'photodump');
const review = join(root, 'review');
const scratch = join(tmpdir(), 'process-photos');

// ---- What is made from what. Crops are in the original photo's own pixels.

const wa = (time) => `WhatsApp Image 2026-10-11 at ${time}.jpeg`;
// [left, top, width, height]
const box = (left, top, width, height) => ({ left, top, width, height });
// A square about a centre point.
const around = (x, y, half) => box(x - half, y - half, half * 2, half * 2);

// Cut-outs of single pieces. The crop leaves room round the bite for rembg.
const pieces = [
  { name: 'blueberry', from: 'IMG_5972.HEIC', crop: around(1480, 2173, 866) },
  { name: 'kitkat', from: 'IMG_5966.HEIC', crop: around(2048, 1688, 650) },
  { name: 'oreo', from: 'IMG_5993.HEIC', crop: around(1492, 2379, 865) },
  { name: 'biscoff', from: 'IMG_5958.HEIC', crop: around(1827, 1827, 1044) },
  // Coffee has no photo yet: it is shown as the 3D bite (see `stills` below).
];

// Full-frame photos. `product` photos are encoded at a higher quality on the site.
const photos = [
  { name: 'bite-blueberry', from: 'IMG_5973.HEIC', crop: box(1122, 292, 1600, 2000), product: true },
  { name: 'bite-kitkat', from: 'IMG_5967.HEIC', crop: box(1266, 750, 1500, 1875), product: true },
  { name: 'bite-oreo', from: 'IMG_5992.HEIC', crop: box(421, 1231, 1900, 2375), product: true },
  { name: 'bite-biscoff', from: 'IMG_5956.HEIC', crop: box(1066, 524, 2000, 2500), product: true },
  { name: 'macro-biscoff-crumb', from: 'IMG_5949.HEIC', crop: around(1858, 1480, 575), product: true },
  { name: 'macro-blueberry-compote', from: 'IMG_5963.HEIC', crop: around(1700, 1580, 500), product: true },
  { name: 'macro-layers', from: 'IMG_5958.HEIC', crop: around(1827, 1980, 500), product: true },
  { name: 'macro-kitkat-pieces', from: 'IMG_5965.HEIC', crop: around(2135, 1840, 525), product: true },
  { name: 'macro-oreo-crumb', from: 'IMG_5990.HEIC', crop: box(1032, 1496, 1000, 1000), product: true },
  // These came through WhatsApp, so the original is already a JPEG.
  { name: 'packs-of-five', from: wa('9.38.07 AM'), crop: box(150, 200, 940, 1370), product: true },
  { name: 'half-and-half', from: wa('9.35.21 AM'), crop: box(20, 262, 1118, 1118), product: true },
  { name: 'kitchen-fridge', from: wa('9.34.44 AM'), crop: box(30, 230, 760, 760) },
  { name: 'kitchen-tray-a', from: wa('9.34.50 AM (1)'), crop: box(60, 700, 800, 800) },
  { name: 'kitchen-tray-b', from: wa('9.34.50 AM'), crop: box(110, 700, 680, 680) },
];

// Shlok, cut out (the original also came through WhatsApp).
const people = [{ name: 'shlok', from: 'shlok-original.jpg' }];

// Ingredient cut-outs for the Flavours page, one per flavour (see
// ingredientPhoto in src/content/flavours.ts). Each is made only once its
// original is in photodump/ingredients/; until then the page shows none.
const ingredients = ['blueberries', 'kitkat', 'oreo', 'coffee-beans', 'biscoff'];
const ingredientOriginal = (name) =>
  ['heic', 'HEIC', 'jpg', 'jpeg', 'JPG', 'JPEG'].map((ext) => `ingredients/${name}.${ext}`).find((file) => existsSync(join(dump, file)));

// Flavours without a photo, shown as a still of the modelled 3D bite.
const stills = ['coffee'];

const PHOTO_SIZE = 2400;
const PIECE_SIZE = 2000;
const STILL_SIZE = 1600;
const INGREDIENT_SIZE = 1200;

// ---- Reading originals.

// Only camera originals from photodump/, never a file made for the site.
const original = (file) => {
  const path = join(dump, file);
  if (!/\.(heic|jpe?g)$/i.test(file)) throw new Error(`${file}: not a camera original`);
  if (!existsSync(path)) throw new Error(`${relative(root, path)} is missing`);
  return path;
};

// iPhone photos are in Display P3. P3 and sRGB share their tone curve and
// white point, so converting is one matrix in linear light.
const P3_TO_SRGB = [
  [1.2249401, -0.2249404, 0],
  [-0.0420569, 1.0420571, 0],
  [-0.0196376, -0.0786361, 1.0982735],
];
const toLinear = new Float32Array(256).map((_, v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});
const ENCODE_STEPS = 8192;
const fromLinear = new Uint8Array(ENCODE_STEPS + 1).map((_, i) => {
  const c = i / ENCODE_STEPS;
  return Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055));
});
const encode = (linear) => fromLinear[Math.round(Math.min(1, Math.max(0, linear)) * ENCODE_STEPS)];

const decoded = new Map();
// The whole original, as 8-bit sRGB pixels.
const load = async (file) => {
  if (decoded.has(file)) return decoded.get(file);
  const path = original(file);
  let image;
  if (/\.heic$/i.test(file)) {
    const { width, height, data } = await decodeHeic({ buffer: readFileSync(path) });
    const rgb = Buffer.alloc(width * height * 3);
    const [r, g, b] = P3_TO_SRGB;
    for (let i = 0, o = 0; i < data.length; i += 4, o += 3) {
      const R = toLinear[data[i]];
      const G = toLinear[data[i + 1]];
      const B = toLinear[data[i + 2]];
      rgb[o] = encode(r[0] * R + r[1] * G + r[2] * B);
      rgb[o + 1] = encode(g[0] * R + g[1] * G + g[2] * B);
      rgb[o + 2] = encode(b[0] * R + b[1] * G + b[2] * B);
    }
    image = { data: rgb, width, height };
  } else {
    // JPEG: sharp turns any embedded profile into sRGB.
    const { data, info } = await sharp(path).rotate().toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
    image = { data, width: info.width, height: info.height };
  }
  decoded.clear(); // one at a time: a 12 MP original is big
  decoded.set(file, image);
  return image;
};

const raw = ({ data, width, height }, channels = 3) => sharp(data, { raw: { width, height, channels } });
const toRaw = async (pipeline) => {
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
};

const cropOf = async (file, crop) => {
  const image = await load(file);
  const area = {
    left: Math.max(0, crop.left),
    top: Math.max(0, crop.top),
    width: Math.min(crop.width, image.width - Math.max(0, crop.left)),
    height: Math.min(crop.height, image.height - Math.max(0, crop.top)),
  };
  return toRaw(raw(image).extract(area));
};

// ---- The grade.

// Neutral-warm white balance: the near-white, near-grey parts of the picture
// (paper cups, plates, the table) are steered towards a faintly warm white.
const WARM_WHITE = [1.015, 1, 0.965];
const whiteBalance = ({ data }) => {
  const sum = [0, 0, 0];
  let count = 0;
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max > 140 && max < 250 && max - min < max * 0.16) {
      sum[0] += toLinear[r]; sum[1] += toLinear[g]; sum[2] += toLinear[b];
      count += 1;
    }
  }
  // Too little white in the picture to judge by: leave it alone.
  if (count < data.length / 3 / 100) return [1, 1, 1];
  // Most of the way there, and never a heavy-handed shift.
  return sum.map((channel, c) => {
    const full = (WARM_WHITE[c] * sum[1]) / channel;
    return Math.min(1.12, Math.max(0.9, 1 + (full - 1) * 0.75));
  });
};

// A gentle S-curve: a little more contrast in the mid-tones, with the
// shadows and highlights eased rather than clipped.
const S_CURVE = 0.25;
const curve = new Uint8Array(256).map((_, v) => {
  const x = v / 255;
  return Math.round(255 * ((1 - S_CURVE) * x + S_CURVE * x * x * (3 - 2 * x)));
});

const grade = async (image) => {
  // 1. White balance, in linear light.
  const gains = whiteBalance(image);
  const tables = gains.map((gain) => new Uint8Array(256).map((_, v) => encode(toLinear[v] * gain)));
  const balanced = Buffer.alloc(image.data.length);
  for (let i = 0; i < image.data.length; i += 3) {
    balanced[i] = tables[0][image.data[i]];
    balanced[i + 1] = tables[1][image.data[i + 1]];
    balanced[i + 2] = tables[2][image.data[i + 2]];
  }
  // 2. Local contrast (CLAHE, kept gentle).
  const window = Math.max(32, Math.round(Math.max(image.width, image.height) / 6));
  const local = await toRaw(raw({ ...image, data: balanced }).clahe({ width: window, height: window, maxSlope: 2 }));
  // 3. The S-curve.
  for (let i = 0; i < local.data.length; i += 1) local.data[i] = curve[local.data[i]];
  // 4. A little more colour.
  return toRaw(raw(local).modulate({ saturation: 1.08 }));
};

// Unsharp mask, on lightness only, done after the final resize. The amount it
// may lighten or darken an edge is capped, so there are no halos.
const sharpen = (pipeline, scale) =>
  pipeline.sharpen({ sigma: 0.55 + 0.25 * scale, m1: 0.3, m2: 1.2, x1: 2.5, y2: 4, y3: 6 });

const png = (pipeline, path) => {
  mkdirSync(dirname(path), { recursive: true });
  return pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(path);
};

// The longest side, never enlarged.
const fitLong = (width, height, most) => {
  const scale = Math.min(1, most / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale), scale };
};

// ---- Full-frame photos.

const makePhoto = async ({ name, from, crop }) => {
  const cropped = await cropOf(from, crop);
  const size = fitLong(cropped.width, cropped.height, PHOTO_SIZE);
  const resized = await toRaw(raw(cropped).resize(size.width, size.height, { kernel: 'lanczos3' }));
  const graded = await grade(resized);
  const out = join(root, 'src/assets/photos/masters', `${name}.png`);
  await png(sharpen(raw(graded), size.scale), out);
  return { out, native: [cropped.width, cropped.height], size: [size.width, size.height] };
};

// ---- Cut-outs.

// rembg (isnet-general-use) and alpha matting, at the crop's full
// resolution, so fine edges (the paper cup's ridges) come out crisp rather
// than stepped. See scripts/cutout.py.
const rembg = (input, output, model) =>
  execFileSync(process.env.PYTHON ?? 'python', [join(root, 'scripts/cutout.py'), input, output, model], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });

// Keeps only the largest solid shape: crumbs left lying on the table go.
const keepLargest = ({ data, width, height }) => {
  const labels = new Int32Array(width * height);
  const stack = new Int32Array(width * height);
  let best = 0, bestSize = 0, label = 0;
  for (let start = 0; start < width * height; start += 1) {
    if (labels[start] || data[start * 4 + 3] < 24) continue;
    label += 1;
    let size = 0, top = 0;
    stack[top++] = start;
    labels[start] = label;
    while (top) {
      const at = stack[--top];
      size += 1;
      const x = at % width, y = (at - x) / width;
      for (const next of [x > 0 && at - 1, x < width - 1 && at + 1, y > 0 && at - width, y < height - 1 && at + width]) {
        if (next === false || labels[next] || data[next * 4 + 3] < 24) continue;
        labels[next] = label;
        stack[top++] = next;
      }
    }
    if (size > bestSize) { bestSize = size; best = label; }
  }
  // The shape, grown by a few pixels so its own soft edge stays; anything
  // outside that goes.
  let keep = new Uint8Array(width * height);
  for (let at = 0; at < keep.length; at += 1) keep[at] = labels[at] === best ? 1 : 0;
  for (let pass = 0; pass < 4; pass += 1) {
    const grown = keep.slice();
    for (let at = 0; at < keep.length; at += 1) {
      if (keep[at]) continue;
      const x = at % width;
      if ((x > 0 && keep[at - 1]) || (x < width - 1 && keep[at + 1]) || keep[at - width] || keep[at + width]) grown[at] = 1;
    }
    keep = grown;
  }
  for (let at = 0; at < keep.length; at += 1) if (!keep[at]) data[at * 4 + 3] = 0;
};

const cutOut = async (image, name, model) => {
  mkdirSync(scratch, { recursive: true });
  const input = join(scratch, `${name}-in.png`);
  const output = join(scratch, `${name}-out.png`);
  await raw(image).png({ compressionLevel: 1 }).toFile(input);
  rembg(input, output, model);
  const cut = await toRaw(sharp(output).ensureAlpha());
  keepLargest(cut);
  // Trim to the shape, with a little room round it.
  const trimmed = await sharp(cut.data, { raw: { width: cut.width, height: cut.height, channels: 4 } })
    .trim({ threshold: 1, lineArt: false })
    .toBuffer({ resolveWithObject: true });
  const pad = Math.round(Math.max(trimmed.info.width, trimmed.info.height) * 0.02);
  return toRaw(
    sharp(trimmed.data, { raw: { width: trimmed.info.width, height: trimmed.info.height, channels: 4 } }).extend({
      top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 },
    }),
  );
};

const makeCutOut = async ({ name, from, crop }, folder, most, model) => {
  const cropped = crop ? await cropOf(from, crop) : await load(from);
  // Graded first, at full size, so rembg sees the final colours and its
  // alpha matting works out the edge colours from them.
  const graded = await grade(cropped);
  const cut = await cutOut(graded, name, model);
  const size = fitLong(cut.width, cut.height, most);
  const out = join(root, folder, `${name}.png`);
  await png(sharpen(raw(cut, 4).resize(size.width, size.height, { kernel: 'lanczos3' }), size.scale), out);
  return { out, native: [cut.width, cut.height], size: [size.width, size.height] };
};

// Small copies of the cut-outs for the 3D scenes (three.js loads these itself).
const makeTexture = async (name) =>
  sharp(join(root, 'src/assets/bites', `${name}.png`))
    .resize({ width: 512, kernel: 'lanczos3' })
    .webp({ quality: 85, alphaQuality: 100, effort: 6 })
    .toFile(join(root, 'src/assets/bites/tex', `${name}.webp`));

// ---- Stills of the 3D bite, for flavours without a photo yet.

// The modelled bite from src/lib/three, bundled and drawn once in Chrome
// with a transparent background, three-quarter view like the photos.
const makeStills = async (names) => {
  const { build } = await import('rolldown');
  const puppeteer = (await import('puppeteer-core')).default;
  // Inside the project, so 'three' resolves from its node_modules.
  const entry = join(root, 'node_modules/.cache/process-photos/still-entry.ts');
  mkdirSync(dirname(entry), { recursive: true });
  writeFileSync(
    entry,
    `import { DirectionalLight, HemisphereLight, PerspectiveCamera, PMREMGenerator, Scene, SRGBColorSpace, WebGLRenderer, ACESFilmicToneMapping, NoToneMapping } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createModelBite, MODEL_BITE } from ${JSON.stringify(join(root, 'src/lib/three/bite-model.ts').replace(/\\/g, '/'))};
window.still = (flavour, size) => {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  renderer.setPixelRatio(1);
  renderer.setSize(size, size, false);
  renderer.setClearColor(0x000000, 0);
  document.body.append(renderer.domElement);
  const scene = new Scene();
  const baker = new PMREMGenerator(renderer);
  scene.environment = baker.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.16;
  // The same light as the Flavours switcher.
  const key = new DirectionalLight('#ffe2bd', 1.45);
  key.position.set(3.5, 7, 5);
  const rim = new DirectionalLight('#ffe2c4', 0.6);
  rim.position.set(-4, 3, -5);
  scene.add(key, rim, new HemisphereLight('#ffffff', '#f3e7da', 1.3));
  const bite = createModelBite();
  bite.blend(flavour, flavour, 1);
  scene.add(bite.group);
  const middle = MODEL_BITE.height / 2;
  const camera = new PerspectiveCamera(22, 1, 0.1, 100);
  const away = 3.6;
  camera.position.set(0, middle + Math.sin(0.32) * away, Math.cos(0.32) * away);
  camera.lookAt(0, middle - 0.02, 0);
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
};
`,
  );
  const bundle = await build({
    input: entry,
    cwd: root,
    write: false,
    output: { format: 'iife' },
    logLevel: 'silent',
  });
  const code = bundle.output[0].code;
  const chrome = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
  ].find((path) => path && existsSync(path));
  if (!chrome) throw new Error('No Chrome or Edge found: set CHROME_PATH');
  const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const results = [];
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    await page.setContent('<!doctype html><body style="margin:0;background:transparent"></body>');
    await page.addScriptTag({ content: code });
    if (errors.length) throw new Error(`3D still: ${errors.join('; ')}`);
    for (const name of names) {
      // Drawn at twice the size and scaled down: the smoothest edges.
      const url = await page.evaluate((flavour, size) => window.still(flavour, size), name, STILL_SIZE * 2);
      const drawn = Buffer.from(url.split(',')[1], 'base64');
      const trimmed = await sharp(drawn).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
      const size = fitLong(trimmed.info.width, trimmed.info.height, STILL_SIZE);
      const out = join(root, 'src/assets/bites/renders', `${name}.png`);
      await png(sharp(trimmed.data).resize(size.width, size.height, { kernel: 'lanczos3' }), out);
      results.push({ name, out, native: [trimmed.info.width, trimmed.info.height], size: [size.width, size.height] });
    }
  } finally {
    await browser.close();
  }
  return results;
};

// ---- Before and after, at 100%.

// The image the site showed before this pipeline, from git.
const before = (name, kind) => {
  const path = { piece: `src/assets/bites/${name}.webp`, person: `src/assets/photos/${name}.webp` }[kind]
    ?? (name.startsWith('macro-') ? `src/assets/macro/${name.slice(6)}.webp` : `src/assets/photos/${name}.webp`);
  try {
    return execFileSync('git', ['show', `HEAD:${path}`], { cwd: root, maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
};

const CREAM = { r: 243, g: 231, b: 218 };
const label = (text, width) =>
  Buffer.from(`<svg width="${width}" height="44"><rect width="100%" height="100%" fill="#4A0F18"/><text x="14" y="29" font-family="Segoe UI, Arial" font-size="19" fill="#F3E7DA">${text}</text></svg>`);

const compare = async (name, kind, out) => {
  const old = before(name, kind);
  const after = sharp(out);
  const { width, height } = await after.metadata();
  // A patch of the new master at 100%: the middle for photos, lower down for
  // a cut-out so the cup's ridges are in it.
  const patch = Math.min(720, width, height);
  const cx = width / 2, cy = kind === 'piece' ? height * 0.62 : height / 2;
  const area = { left: Math.round(Math.max(0, Math.min(width - patch, cx - patch / 2))), top: Math.round(Math.max(0, Math.min(height - patch, cy - patch / 2))), width: patch, height: patch };
  const flat = (image) => image.flatten({ background: CREAM });
  const right = await flat(sharp(out).extract(area)).png().toBuffer();
  let left;
  let leftText = 'before: no earlier image';
  if (old) {
    const meta = await sharp(old).metadata();
    const scale = meta.width / width;
    const oldArea = {
      left: Math.round(area.left * scale), top: Math.round(area.top * scale),
      width: Math.max(1, Math.min(meta.width - Math.round(area.left * scale), Math.round(patch * scale))),
      height: Math.max(1, Math.min(meta.height - Math.round(area.top * scale), Math.round(patch * scale))),
    };
    left = await flat(sharp(old).extract(oldArea).resize(patch, patch, { kernel: 'lanczos3', fit: 'fill' })).png().toBuffer();
    leftText = `before: ${meta.width}×${meta.height} WebP, shown ${(1 / scale).toFixed(2)}× to match`;
  } else {
    left = await sharp({ create: { width: patch, height: patch, channels: 3, background: CREAM } }).png().toBuffer();
  }
  const gap = 12;
  mkdirSync(review, { recursive: true });
  await sharp({ create: { width: patch * 2 + gap, height: patch + 44, channels: 3, background: CREAM } })
    .composite([
      { input: label(leftText, patch), left: 0, top: 0 },
      { input: label(`after: ${width}×${height} PNG master, 100%`, patch), left: patch + gap, top: 0 },
      { input: left, left: 0, top: 44 },
      { input: right, left: patch + gap, top: 44 },
    ])
    .png()
    .toFile(join(review, `${name}.png`));
  return name;
};

// Lists every comparison in review/, including those from earlier runs.
const writeReviewPage = () => {
  const cards = readdirSync(review)
    .filter((file) => file.endsWith('.png'))
    .map((file) => `<figure><figcaption>${file.slice(0, -4)}</figcaption><img src="${file}" alt="${file.slice(0, -4)}, before and after"></figure>`)
    .join('\n');
  writeFileSync(
    join(review, 'index.html'),
    `<!doctype html><meta charset="utf-8"><title>Photo review</title>
<style>body{margin:0;padding:24px;background:#F3E7DA;color:#4A0F18;font:16px system-ui}figure{margin:0 0 40px}figcaption{font-weight:600;margin-bottom:8px}small{font-weight:400;opacity:.7}img{display:block;max-width:none}</style>
<h1>Before and after, at 100%</h1><p>Left: what the site had. Right: the new lossless master, pixel for pixel.</p>
${cards}`,
  );
};

// ---- Run.

const only = new Set(process.argv.slice(2));
const wanted = (name) => !only.size || only.has(name);
const rows = [];
const report = (kind, result, name) => {
  rows.push(name);
  console.log(`${kind.padEnd(6)} ${name.padEnd(26)} ${result.size.join('×').padStart(10)}  (crop ${result.native.join('×')})`);
};

for (const piece of pieces.filter((p) => wanted(p.name))) {
  const result = await makeCutOut(piece, 'src/assets/bites', PIECE_SIZE, 'isnet-general-use');
  await makeTexture(piece.name);
  report('piece', result, piece.name);
  await compare(piece.name, 'piece', result.out);
}
// Asked for as ingredients/<name>, or all of them as ingredients.
for (const name of ingredients.filter((name) => wanted(`ingredients/${name}`) || only.has('ingredients'))) {
  const from = ingredientOriginal(name);
  if (!from) {
    console.log(`skip   ${name.padEnd(26)} no photodump/ingredients/${name}.heic or .jpg yet`);
    continue;
  }
  const result = await makeCutOut({ name, from }, 'src/assets/ingredients', INGREDIENT_SIZE, 'isnet-general-use');
  report('ingr.', result, name);
}
for (const person of people.filter((p) => wanted(p.name))) {
  const result = await makeCutOut(person, 'src/assets/photos/masters', PHOTO_SIZE, 'isnet-general-use');
  report('person', result, person.name);
  await compare(person.name, 'person', result.out);
}
for (const photo of photos.filter((p) => wanted(p.name))) {
  const result = await makePhoto(photo);
  report('photo', result, photo.name);
  await compare(photo.name, 'photo', result.out);
}
const toDraw = stills.filter(wanted);
if (toDraw.length) {
  for (const result of await makeStills(toDraw)) {
    report('still', result, result.name);
    await compare(result.name, 'piece', result.out);
  }
}

if (rows.length) writeReviewPage();
rmSync(scratch, { recursive: true, force: true });
console.log(`\nReview: ${relative(root, join(review, 'index.html'))}`);
