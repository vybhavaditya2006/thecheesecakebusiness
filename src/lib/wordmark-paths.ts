// Build-time only: turns the brand name into SVG outlines of the temporary
// script wordmark font, so the hero can draw it with DrawSVG. Once a real
// logo SVG exists, the hero should use that instead.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import opentype from 'opentype.js';

const FONT_FILE = 'node_modules/@fontsource/pinyon-script/files/pinyon-script-latin-400-normal.woff';
const FONT_SIZE = 100;
const PADDING = 4;

export interface WordmarkPaths {
  viewBox: string;
  // One path per letter, in reading order.
  letters: string[];
}

export const wordmarkPaths = (text: string): WordmarkPaths => {
  const file = readFileSync(join(process.cwd(), FONT_FILE));
  const font = opentype.parse(
    file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
  );

  const box = font.getPath(text, 0, 0, FONT_SIZE).getBoundingBox();
  const letters = font
    .getPaths(text, 0, 0, FONT_SIZE)
    .map((path) => path.toPathData(2))
    .filter(Boolean);

  const viewBox = [
    box.x1 - PADDING,
    box.y1 - PADDING,
    box.x2 - box.x1 + PADDING * 2,
    box.y2 - box.y1 + PADDING * 2,
  ]
    .map((value) => Math.round(value))
    .join(' ');

  return { viewBox, letters };
};
