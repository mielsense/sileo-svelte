import { describe, expect, test } from 'vitest';
import config from '../vite.config.js';

const resolveConfig = async (mode: string) => {
    if (typeof config !== 'function') return config;

    return config({ command: 'serve', mode, isSsrBuild: false, isPreview: false });
};

describe('Vite configuration', () => {
    test('uses the browser condition only for Vitest mode', async () => {
        const development = await resolveConfig('development');
        const testMode = await resolveConfig('test');

        expect(development.resolve?.conditions).toBeUndefined();
        expect(testMode.resolve?.conditions).toEqual(['browser']);
    });

    test('allows the repository-level Markdown content in development', async () => {
        const development = await resolveConfig('development');

        expect(development.server?.fs?.allow).toContain('.');
    });
});
