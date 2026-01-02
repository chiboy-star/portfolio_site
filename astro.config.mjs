// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  // 1. "integrations" is for Astro-specific packages (like Icons)
  integrations: [
    icon()
  ],
  
  // 2. "vite" is for the new Tailwind v4 engine
  vite: {
    plugins: [tailwindcss()],
  },
});