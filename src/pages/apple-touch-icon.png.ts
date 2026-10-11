// Home-screen icon for iOS, from the same artwork as the favicon.
import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { iconSvg } from '../lib/brand-art';

const SIZE = 180;

export const GET: APIRoute = async () => {
  const png = await sharp(Buffer.from(iconSvg(SIZE))).png().toBuffer();

  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
