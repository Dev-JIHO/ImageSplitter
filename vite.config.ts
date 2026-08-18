import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

function page(name: string) {
  return fileURLToPath(new URL(`./${name}`, import.meta.url));
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // 앱(index.html) 외에 검색엔진이 읽을 수 있는 정적 콘텐츠 페이지를 함께 빌드한다.
      input: {
        main: page('index.html'),
        guide: page('guide.html'),
        faq: page('faq.html'),
        about: page('about.html'),
        privacy: page('privacy.html'),
        terms: page('terms.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
