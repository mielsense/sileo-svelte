import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import Layout from '../src/routes/+layout.svelte';
import DocumentPage from '../src/routes/_components/DocumentPage.svelte';
import { getDoc, navigation, orderedPages, serializeDoc } from '../src/docs/source.js';
import { store } from '../src/lib/store.svelte.js';

const children = createRawSnippet(() => ({ render: () => '<main id="main-content"></main>' }));

describe('documentation shell', () => {
    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        localStorage.clear();
        document.documentElement.dataset.theme = 'dark';
        store.toasts = [];
    });

    test('renders global navigation and the dark-first theme control', async () => {
        const { getByRole, getByText } = render(Layout, { children });
        expect(getByRole('link', { name: 'Skip to content' }).getAttribute('href')).toBe('#main-content');
        expect(getByRole('link', { name: 'Sileo Svelte home' }).getAttribute('href')).toBe('/');
        expect(getByRole('link', { name: 'Playground' })).toBeTruthy();
        expect(getByRole('link', { name: 'llms.txt' })).toBeTruthy();
        expect(getByText('Svelte', { selector: '.svelte-badge' })).toBeTruthy();

        const toggle = getByRole('button', { name: 'Use light theme' });
        await fireEvent.click(toggle);
        await tick();
        expect(document.documentElement.dataset.theme).toBe('light');
        expect(localStorage.getItem('sileo-theme')).toBe('light');
        expect(getByRole('button', { name: 'Use dark theme' })).toBeTruthy();
    });

    test('does not render page-level notifications outside documentation routes', () => {
        store.toasts = [
            {
                id: 'page-level-toast',
                instanceId: 'page-level-toast-1',
                state: 'success',
                title: 'Should stay contained',
                position: 'top-right'
            }
        ];

        const { container } = render(Layout, { children });

        expect(container.querySelector('[data-sileo-viewport]')).toBeNull();
    });

    test('builds ordered navigation and matching table of contents from Markdown', () => {
        expect(navigation.map((section) => section.title)).toEqual(['Getting started', 'Guides', 'Reference']);
        expect(orderedPages.map((page) => page.slug)).toEqual([
            'index',
            'installation',
            'changelog',
            'creating-toasts',
            'async-flows',
            'customization',
            'api',
            'toaster'
        ]);
        const overview = getDoc('index')!;
        expect(overview.raw).toContain('bun add sileo-svelte');
        expect(overview.toc.map((item) => item.id)).toContain('start-here');
    });

    test('renders Markdown content with page and code copy controls', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
        const data = serializeDoc(getDoc('index')!);
        const { getByRole, container } = render(DocumentPage, { data });
        await tick();

        expect(getByRole('heading', { name: 'Sileo Svelte' })).toBeTruthy();
        expect(container.querySelectorAll('.code-copy-button').length).toBeGreaterThanOrEqual(3);
        expect(container.querySelectorAll('.shiki span[style]').length).toBeGreaterThan(0);
        expect(container.querySelector('pre[data-language="bash"]')).toBeTruthy();
        await fireEvent.click(getByRole('button', { name: 'Copy Markdown' }));
        expect(writeText).toHaveBeenCalledWith(data.raw);
    });

    test('keeps root Markdown content and machine-readable routes configured', async () => {
        const { readFile } = await import('node:fs/promises');
        const [config, context, hooks, ...stylesheets] = await Promise.all([
            readFile('svelte.config.js', 'utf8'),
            readFile('context7.json', 'utf8'),
            readFile('src/hooks.server.ts', 'utf8'),
            readFile('src/routes/docs-foundation.css', 'utf8'),
            readFile('src/routes/docs-content.css', 'utf8'),
            readFile('src/routes/docs-responsive.css', 'utf8'),
            readFile('src/routes/tailwind.css', 'utf8')
        ]);
        const css = stylesheets.join('\n');
        expect(config).toContain("extensions: ['.svelte', '.md']");
        expect(JSON.parse(context).folders).toEqual(['content/docs']);
        expect(hooks).toContain("includes('text/markdown')");
        expect(css).toContain('@media (max-width: 820px)');
        expect(css).toContain('@media (prefers-reduced-motion: reduce)');
        expect(css).not.toContain('linear-gradient');
        expect(stylesheets.every((source) => source.split('\n').length < 1000)).toBe(true);
    });
});
