import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

const duplicatePlayerSlugs = [
  'faf-du-plessis-vc', 'rashid-khan-vc', 'lokesh-rahul', 'muthiah-muralidaran',
  'm-shahrukh-khan', 'dhaval-kulkarni', 'steven-smith', 'sourav-ganguly-vc',
  'rinku-singh-vc', 'venkatesh-iyer-vc',
];

// https://astro.build/config
export default defineConfig({
  site: 'https://16-0play.com',
  integrations: [
    react(),
    sitemap({
      filter: (page) => !duplicatePlayerSlugs.some((slug) =>
        page.replace(/\/+$/, '').endsWith(`/players/${slug}`)
      ),
    })
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
