// The Open Graph share image, drawn from brand.ts at build time.
import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { seo } from '../content/site';
import { shareImageSvg } from '../lib/brand-art';

export const GET: APIRoute = async () => {
  const { width, height } = seo.shareImage;
  const png = await sharp(Buffer.from(shareImageSvg(width, height))).png().toBuffer();

  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
