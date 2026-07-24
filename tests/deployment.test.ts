import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const root = resolve(import.meta.dirname, '..');

describe('Vercel deployment', () => {
    test('uses the explicit Vercel adapter instead of runtime adapter detection', () => {
        const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
        const config = readFileSync(resolve(root, 'svelte.config.js'), 'utf8');

        expect(packageJson.devDependencies['@sveltejs/adapter-vercel']).toBeDefined();
        expect(packageJson.devDependencies['@sveltejs/adapter-auto']).toBeUndefined();
        expect(config).toContain("import adapter from '@sveltejs/adapter-vercel'");
        expect(config).not.toContain('@sveltejs/adapter-auto');
    });
});
