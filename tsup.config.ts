import { defineConfig } from 'tsup'

export default defineConfig([
    // Main package entry
    {
        entry: ['src/index.ts'],
        format: ['cjs', 'esm'],
        dts: true,
        sourcemap: true,
        clean: true,
        splitting: false,
        minify: true,
        target: 'node16',
        external: ['@upstash/redis'],
        banner: {
            js: '/* Shohan - Production-Grade Utilities & Tools */',
        },
        esbuildOptions(options) {
            options.conditions = ['node']
        }
    },
    // Cache module entry
    {
        entry: ['src/cache/index.ts'],
        outDir: 'dist/cache',
        format: ['cjs', 'esm'],
        dts: true,
        sourcemap: true,
        splitting: false,
        minify: true,
        target: 'node16',
        external: ['@upstash/redis'],
        banner: {
            js: '/* Shohan Cache - Smart Cache System */',
        },
        esbuildOptions(options) {
            options.conditions = ['node']
        }
    }
])
