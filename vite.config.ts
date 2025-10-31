import { defineConfig } from 'vite';
import { resolve } from 'path';
import incrementBuild from './vite-plugin-increment-build.mjs';

export default defineConfig({
  plugins: [incrementBuild()],
  server: {
    watch: {
      // Exclude build-info.json from watch to prevent infinite rebuild loop
      ignored: ['**/build-info.json']
    }
  },
  build: {
    outDir: 'scripts',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      formats: ['es'],
      fileName: () => 'main.js'
    },
    rollupOptions: {
      external: [
        // Foundry VTT globals - don't bundle these
        /^@league-of-foundry-developers/
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
