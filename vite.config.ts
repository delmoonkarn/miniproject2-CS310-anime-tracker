import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { streamLinksAdmin } from './vite-plugins/streamLinksAdmin';

export default defineConfig({
  plugins: [react(), tailwindcss(), streamLinksAdmin()],
});
