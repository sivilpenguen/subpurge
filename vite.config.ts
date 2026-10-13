import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig({
  plugins: [react()],
  // Capacitor serves the app from capacitor://localhost — relative asset paths keep both web and native working.
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
});
