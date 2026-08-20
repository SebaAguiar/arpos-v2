import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: 'https://arcom.com.ar',
  output: 'static',
  adapter: vercel(),
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
