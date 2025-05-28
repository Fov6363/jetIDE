import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  mode: 'production',
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main/main.ts'),
      formats: ['cjs'],
      fileName: () => 'main.js',
    },
    outDir: 'dist/main',
    emptyOutDir: true,
    rollupOptions: {
      external: ['electron', 'fs', 'path', 'os'],
      output: {
        entryFileNames: 'main.js',
      },
    },
    minify: false,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/main': resolve(__dirname, 'src/main'),
      '@/shared': resolve(__dirname, 'src/shared'),
    },
  },
})
