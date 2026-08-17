import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: 'https://arcon.com.ar', 
  integrations: [tailwind(), sitemap()],
  outDir: '../../dist/apps/marketing-landing',
  vite: {
    server: {
      fs: {
        allow: ['../..']
      }
    }
  }
});
