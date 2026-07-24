import { cleanup, render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Layout from '../src/routes/+layout.svelte';
import Page from '../src/routes/+page.svelte';

class IntersectionObserverMock {
    static instances: IntersectionObserverMock[] = [];
    private targets = new Set<Element>();

    constructor(private callback: IntersectionObserverCallback) {
        IntersectionObserverMock.instances.push(this);
    }

    observe(target: Element) {
        this.targets.add(target);
    }
    unobserve(target: Element) {
        this.targets.delete(target);
    }
    disconnect() {
        this.targets.clear();
    }
    trigger(target: Element, isIntersecting = true) {
        this.callback(
            [{ target, isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 }] as IntersectionObserverEntry[],
            this as unknown as IntersectionObserver
        );
    }
}

const children = createRawSnippet(() => ({
    render: () => '<main id="main-content"><section id="playground"></section><section id="api"></section></main>'
}));

describe('documentation shell', () => {
    beforeEach(() => {
        IntersectionObserverMock.instances = [];
        vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
        vi.stubGlobal(
            'ResizeObserver',
            class ResizeObserver {
                observe() {}
                unobserve() {}
                disconnect() {}
            }
        );
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        document.head.innerHTML = '';
    });

    test('renders a working skip link and complete navigation', () => {
        const { getByRole } = render(Layout, { children });
        const skip = getByRole('link', { name: 'Skip to content' });

        expect(skip.getAttribute('href')).toBe('#main-content');
        expect(getByRole('link', { name: 'Sileo Svelte home' })).toBeTruthy();
        expect(getByRole('link', { name: 'Playground' })).toBeTruthy();
        expect(getByRole('link', { name: 'API' })).toBeTruthy();
        expect(getByRole('link', { name: /GitHub/ })).toBeTruthy();
    });

    test('marks the current observed section in navigation', async () => {
        const { getByRole, container } = render(Layout, { children });
        await tick();
        const playground = container.querySelector('#playground')!;

        IntersectionObserverMock.instances[0]?.trigger(playground);
        await tick();

        expect(getByRole('link', { name: 'Playground' }).getAttribute('aria-current')).toBe('location');
        expect(getByRole('link', { name: 'API' }).hasAttribute('aria-current')).toBe(false);
    });

    test('renders complete canonical and social metadata', () => {
        render(Page);

        expect(document.title).toBe('Sileo Svelte — physics-based toast notifications');
        expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('Svelte 5');
        expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toMatch(/^https?:\/\//);
        expect(document.head.querySelector('meta[property="og:title"]')?.getAttribute('content')).toContain(
            'Sileo Svelte'
        );
        expect(document.head.querySelector('meta[property="og:image"]')?.getAttribute('content')).toMatch(
            /^https?:\/\//
        );
        expect(document.head.querySelector('meta[name="twitter:card"]')?.getAttribute('content')).toBe(
            'summary_large_image'
        );
    });

    test('renders usable public contracts, not only type names', () => {
        const { getByText } = render(Page);

        expect(getByText(/promise<T>\(/)).toBeTruthy();
        expect(getByText(/interface SileoButton/)).toBeTruthy();
        expect(getByText(/buttonHoverBackground\?: string/)).toBeTruthy();
        expect(getByText(/description\?: string/)).toBeTruthy();
        expect(getByText(/clear\(position\?: SileoPosition\): void/)).toBeTruthy();
    });

    test('keeps responsive and reduced motion layout contracts', async () => {
        const stylesheet = await import('node:fs/promises').then(({ readFile }) =>
            readFile('src/routes/+page.svelte', 'utf8')
        );

        expect(stylesheet).toContain('@media (max-width: 420px)');
        expect(stylesheet).toContain('width: 100%');
        expect(stylesheet).toContain('@media (prefers-reduced-motion: reduce)');
        expect(stylesheet).toContain('.scenario-enter');
        expect(stylesheet).toContain('animation: none');
    });
});
