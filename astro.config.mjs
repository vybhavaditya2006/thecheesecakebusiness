// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { brand } from './src/content/brand.ts';

// Adds /dev/styleguide in `astro dev` only, so it is never built or deployed.
/** @type {import('astro').AstroIntegration} */
const devStyleguide = {
  name: 'dev-styleguide',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command !== 'dev') return;
      injectRoute({ pattern: '/dev/styleguide', entrypoint: './src/dev/styleguide.astro' });
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: `https://${brand.domain}`,
  output: 'static',
  // The order page moved in Round 2. public/_redirects does the same on
  // Cloudflare Pages and keeps the query string.
  redirects: { '/order': '/box' },
  // Styles go in the page itself, so the first paint never waits on a CSS file.
  build: { inlineStylesheets: 'always' },
  integrations: [react(), sitemap(), devStyleguide],
  vite: {
    plugins: [tailwindcss()],
  },
});
