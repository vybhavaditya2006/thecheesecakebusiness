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
  integrations: [react(), sitemap(), devStyleguide],
  vite: {
    plugins: [tailwindcss()],
  },
});
