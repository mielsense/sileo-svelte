import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
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

    it('compiles the public root types and stylesheet export as a consumer', () => {
        expect(packageJson.exports['.']).toEqual({
            types: './dist/index.d.ts',
            svelte: './dist/index.js'
        });
        expect(packageJson.exports['./styles.css']).toBe('./dist/styles.css');
        expect(existsSync(join(root, packageJson.exports['.'].types))).toBe(true);
        expect(existsSync(join(root, packageJson.exports['.'].svelte))).toBe(true);
        expect(existsSync(join(root, packageJson.exports['./styles.css']))).toBe(true);

        const fixture = mkdtempSync(join(tmpdir(), 'sileo-svelte-consumer-'));
        const fixtureModules = join(fixture, 'node_modules');
        mkdirSync(fixtureModules);
        symlinkSync(root, join(fixtureModules, 'sileo-svelte'), 'dir');

        try {
            writeFileSync(
                join(fixture, 'consumer.ts'),
                `import {
    Toaster,
    sileo,
    type SileoApi,
    type SileoScopedApi,
    type SileoInput,
    type SileoOptions,
    type SileoPosition,
    type SileoState,
    type SileoClasses,
    type SileoStyles,
    type SileoButton,
    type SileoPromiseOptions
} from 'sileo-svelte';
import 'sileo-svelte/styles.css';

const api: SileoApi = sileo;
const scoped: SileoScopedApi = api.with({ position: 'bottom-right' });
const input: SileoInput = { title: 'Ready', icon: null };
const options: SileoOptions = { ...input, position: 'bottom-right' };
const position: SileoPosition = 'bottom-right';
const state: SileoState = 'success';
const classes: SileoClasses = { title: 'toast-title' };
const styles: SileoStyles = { titleColor: 'white' };
const button: SileoButton = { title: 'Close', onClick: (id) => api.close(id) };
const promiseOptions: SileoPromiseOptions<string> = {
    loading: { title: 'Loading' },
    success: (value) => ({ title: value }),
    error: () => ({ title: 'Failed' })
};

void [Toaster, scoped, input, position, state, classes, styles, button, promiseOptions];
`
            );
            writeFileSync(
                join(fixture, 'tsconfig.json'),
                JSON.stringify({
                    compilerOptions: {
                        allowArbitraryExtensions: true,
                        module: 'ESNext',
                        moduleResolution: 'Bundler',
                        noEmit: true,
                        strict: true,
                        target: 'ES2022'
                    },
                    files: ['consumer.ts']
                })
            );

            expect(() =>
                execFileSync(join(root, 'node_modules', '.bin', 'tsc'), ['-p', join(fixture, 'tsconfig.json')], {
                    cwd: fixture,
                    encoding: 'utf8',
                    stdio: 'pipe'
                })
            ).not.toThrow();
        } finally {
            rmSync(fixture, { recursive: true, force: true });
        }
    });
});
