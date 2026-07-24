import { access, readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';

describe('documentation shell', () => {
    test('connects the skip link to the main content landmark', async () => {
        const [layout, page] = await Promise.all([
            readFile('src/routes/+layout.svelte', 'utf8'),
            readFile('src/routes/+page.svelte', 'utf8')
        ]);

        expect(layout).toContain('href="#main-content"');
        expect(page).toContain('id="main-content"');
    });

    test('publishes complete social metadata', async () => {
        const page = await readFile('src/routes/+page.svelte', 'utf8');

        expect(page).toContain('<title>Sileo Svelte — physics-based toast notifications</title>');
        expect(page).toContain('name="description"');
        expect(page).toContain('property="og:title"');
        expect(page).toContain('property="og:image"');
        expect(page).toContain('name="twitter:card"');
        expect(page).toContain('name="theme-color"');
    });

    test('ships a branded error route with a way back', async () => {
        const path = 'src/routes/+error.svelte';
        await expect(access(path)).resolves.toBeUndefined();
        const errorPage = await readFile(path, 'utf8');

        expect(errorPage).toContain('Page not found');
        expect(errorPage).toContain('href={playgroundHref}');
    });

    test('documents every public export and motion preference', async () => {
        const page = await readFile('src/routes/+page.svelte', 'utf8');
        const exports = [
            'Toaster',
            'sileo',
            'SileoApi',
            'SileoScopedApi',
            'SileoInput',
            'SileoOptions',
            'SileoPosition',
            'SileoState',
            'SileoClasses',
            'SileoStyles',
            'SileoButton',
            'SileoPromiseOptions'
        ];

        for (const exportedName of exports) {
            expect(page, `missing ${exportedName}`).toContain(exportedName);
        }
        expect(page).toContain('@media (prefers-reduced-motion: reduce)');
    });
});
