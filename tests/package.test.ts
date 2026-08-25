import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

describe('published package contract', () => {
    it('keeps app build and package validation as separate commands', () => {
        expect(packageJson.scripts.build).toBe('vite build');
        expect(packageJson.scripts['test:package']).toBe('vitest run tests/package.test.ts');
    });

    it('installs the packed artifact and builds a Svelte consumer for the browser and SSR', () => {
        expect(packageJson.exports['.']).toEqual({
            types: './dist/index.d.ts',
            svelte: './dist/index.js'
        });
        expect(packageJson.exports['./styles.css']).toBe('./dist/styles.css');
        expect(existsSync(join(root, packageJson.exports['.'].types))).toBe(true);
        expect(existsSync(join(root, packageJson.exports['.'].svelte))).toBe(true);
        expect(existsSync(join(root, packageJson.exports['./styles.css']))).toBe(true);

        const fixture = mkdtempSync(join(tmpdir(), 'sileo-svelte-consumer-'));

        try {
            const packed = JSON.parse(
                execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', fixture], {
                    cwd: root,
                    encoding: 'utf8',
                    stdio: 'pipe'
                })
            )[0] as { filename: string; files: Array<{ path: string }> };
            const archive = join(fixture, packed.filename);

            expect(packed.files.some((file) => file.path.startsWith('package/dist/docs/'))).toBe(false);
            mkdirSync(join(fixture, 'src'));
            writeFileSync(
                join(fixture, 'package.json'),
                JSON.stringify({
                    private: true,
                    type: 'module',
                    dependencies: {
                        'sileo-svelte': `file:${archive}`,
                        svelte: packageJson.devDependencies.svelte,
                        vite: packageJson.devDependencies.vite,
                        '@sveltejs/vite-plugin-svelte': packageJson.devDependencies['@sveltejs/vite-plugin-svelte']
                    }
                })
            );
            writeFileSync(
                join(fixture, 'src', 'App.svelte'),
                `<script lang="ts">
import { Toaster, sileo, type SileoPromiseOptions } from 'sileo-svelte';
import 'sileo-svelte/styles.css';

const promiseOptions: SileoPromiseOptions<string> = {
    loading: { title: 'Loading' },
    action: (value) => ({ title: value, button: { title: 'Open', onClick: () => undefined } }),
    error: () => ({ title: 'Failed' })
};
void promiseOptions;
</script>

<button onclick={() => sileo.success('Ready')}>Notify</button>
<Toaster />
`
            );
            writeFileSync(
                join(fixture, 'src', 'main.ts'),
                `import { mount } from 'svelte';
import App from './App.svelte';
mount(App, { target: document.getElementById('app')! });
`
            );
            writeFileSync(join(fixture, 'src', 'ssr.ts'), `export { default } from './App.svelte';\n`);
            writeFileSync(
                join(fixture, 'vite.config.ts'),
                `import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
export default defineConfig({ plugins: [svelte()] });
`
            );
            writeFileSync(
                join(fixture, 'index.html'),
                `<div id="app"></div><script type="module" src="/src/main.ts"></script>\n`
            );

            execFileSync('bun', ['install', '--ignore-scripts'], { cwd: fixture, encoding: 'utf8', stdio: 'pipe' });
            expect(() =>
                execFileSync('bunx', ['vite', 'build'], { cwd: fixture, encoding: 'utf8', stdio: 'pipe' })
            ).not.toThrow();
            expect(() =>
                execFileSync('bunx', ['vite', 'build', '--ssr', 'src/ssr.ts', '--outDir', 'dist-ssr'], {
                    cwd: fixture,
                    encoding: 'utf8',
                    stdio: 'pipe'
                })
            ).not.toThrow();
        } finally {
            rmSync(fixture, { recursive: true, force: true });
        }
    }, 30_000);
});
