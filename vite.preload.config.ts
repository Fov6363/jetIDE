import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  mode: 'production',
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main/preload.ts'),
      formats: ['cjs'],
      fileName: () => 'preload.js',
    },
    outDir: 'dist/main',
    emptyOutDir: false,
    rollupOptions: {
      external: ['electron'],
      output: {
        entryFileNames: 'preload.js',
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
