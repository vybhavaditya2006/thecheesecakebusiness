// The Open Graph share image, made at build time: the wordmark and tagline
// beside a real photo of a piece.
import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { seo } from '../content/site';
import { PHOTO_BOX, shareImageSvg } from '../lib/brand-art';

// A lossless master from scripts/process-photos.mjs.
const PHOTO = 'src/assets/photos/masters/bite-biscoff.png';

export const GET: APIRoute = async () => {
  const { width, height } = seo.shareImage;
  const photo = await sharp(PHOTO)
    .resize(PHOTO_BOX.width, PHOTO_BOX.height, { fit: 'cover', position: 'attention' })
    .toBuffer();
  const png = await sharp(Buffer.from(shareImageSvg(width, height)))
    .composite([{ input: photo, left: PHOTO_BOX.left, top: PHOTO_BOX.top }])
    .png()
    .toBuffer();

  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
