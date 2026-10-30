import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Статическая сборка: каждая страница — готовый HTML, его сразу видят Яндекс и Google.
export default defineConfig({
  site: 'https://infrahunt.ru',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
  integrations: [
    sitemap({
      filter: (page) => !/\/(cart|compare|404)\/?$/.test(page),
      changefreq: 'weekly',
      serialize(item) {
        if (item.url === 'https://infrahunt.ru/') item.priority = 1;
        else if (item.url.includes('/product/')) item.priority = 0.9;
        else if (item.url.includes('/catalog/')) item.priority = 0.8;
        else item.priority = 0.4;
        item.lastmod = new Date().toISOString();
        return item;
      },
    }),
  ],
});
