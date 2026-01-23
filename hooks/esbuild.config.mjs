#!/usr/bin/env node
/**
 * esbuild configuration for OrchestKit hooks
 * Bundles all TypeScript hooks into a single ESM file
 */

import { build, context } from 'esbuild';
import { writeFileSync, mkdirSync } from 'node:fs';

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['./src/index.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile: './dist/hooks.mjs',
  minify: !isWatch, // Don't minify in watch mode for easier debugging
  sourcemap: true,
  metafile: true,
  external: [], // Bundle everything for single-file deployment
  banner: {
    js: `// OrchestKit Hooks - TypeScript/ESM Bundle
// Generated: ${new Date().toISOString()}
// https://github.com/yonatangross/orchestkit
`,
  },
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
  },
};

async function main() {
  // Ensure dist directory exists
  mkdirSync('./dist', { recursive: true });

  if (isWatch) {
    const ctx = await context(buildOptions);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    const startTime = Date.now();
    const result = await build(buildOptions);

    // Generate bundle stats
    const outputFile = result.metafile.outputs['dist/hooks.mjs'];
    const stats = {
      generatedAt: new Date().toISOString(),
      buildTimeMs: Date.now() - startTime,
      size: outputFile.bytes,
      sizeKB: (outputFile.bytes / 1024).toFixed(2),
      inputs: Object.keys(result.metafile.inputs).length,
      exports: outputFile.exports,
    };

    writeFileSync('./dist/bundle-stats.json', JSON.stringify(stats, null, 2));

    console.log(`Build complete in ${stats.buildTimeMs}ms`);
    console.log(`Bundle size: ${stats.sizeKB} KB`);
    console.log(`Input files: ${stats.inputs}`);
    console.log(`Exports: ${stats.exports.join(', ')}`);

    // Warn if bundle exceeds target size
    if (stats.size > 100 * 1024) {
      console.warn(`WARNING: Bundle size (${stats.sizeKB} KB) exceeds 100KB target`);
    }
  }
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
