import typescript from '@rollup/plugin-typescript';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// Plugin to copy module.json and other assets to dist
const copyAssets = () => ({
  name: 'copy-assets',
  buildEnd() {
    if (!existsSync('dist')) {
      mkdirSync('dist');
    }
    
    // Copy module.json
    copyFileSync('module.json', 'dist/module.json');
    console.log('Copied module.json to dist/');
    
    // Copy languages directory
    if (!existsSync('dist/languages')) {
      mkdirSync('dist/languages');
    }
    copyFileSync('languages/en.json', 'dist/languages/en.json');
    console.log('Copied languages to dist/');
  }
});

export default {
  input: 'src/main.ts',
  output: {
    file: 'dist/main.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.json'
    }),
    copyAssets()
  ],
  external: [
    // Don't bundle Foundry globals - they're available at runtime
  ]
};