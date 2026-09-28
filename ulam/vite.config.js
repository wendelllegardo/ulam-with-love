import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// base './' makes the build work on any GitHub Pages URL (user.github.io/<repo>/)
export default defineConfig({ base: './', plugins: [react()] });
