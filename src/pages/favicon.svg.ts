// The favicon: the first letter of the logo, drawn from brand.ts at build time.
import type { APIRoute } from 'astro';
import { iconSvg } from '../lib/brand-art';

export const GET: APIRoute = () =>
  new Response(iconSvg(64), { headers: { 'Content-Type': 'image/svg+xml' } });
