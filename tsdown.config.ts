import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'build',
  format: 'esm',
  sourcemap: true,
  bundle: true,
  dts: true,
  clean: true,
})
