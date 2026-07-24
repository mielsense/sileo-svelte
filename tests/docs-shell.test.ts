import { cleanup, render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Layout from '../src/routes/+layout.svelte';
import Page from '../src/routes/+page.svelte';

vi.mock('$app/paths', () => ({
    assets: '/docs',
    base: '/docs',
    resolve: (path: string) => `/docs${path}`
}));

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
    observes(target: Element) {
        return this.targets.has(target);
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
        const github = getByRole('link', { name: 'View Sileo Svelte on GitHub' });
        expect(github.textContent?.trim()).toBe('↗');
    });

    test('compacts after leaving the page top and expands when returning', async () => {
        const { getByRole, container } = render(Layout, { children });
        await tick();
        const sentinel = container.querySelector('[data-nav-sentinel]');
        const navigation = getByRole('navigation', { name: 'Primary navigation' });

        expect(sentinel).toBeTruthy();
        const observer = IntersectionObserverMock.instances.find((instance) => instance.observes(sentinel!));
        expect(observer).toBeTruthy();
        expect(navigation.classList.contains('is-compact')).toBe(false);

        observer?.trigger(sentinel!, false);
        await tick();
        expect(navigation.classList.contains('is-compact')).toBe(true);

        observer?.trigger(sentinel!, true);
        await tick();
        expect(navigation.classList.contains('is-compact')).toBe(false);
    });

    test('marks the current observed section in navigation', async () => {
        const { getByRole, container } = render(Layout, { children });
        await tick();
        const playground = container.querySelector('#playground')!;

        IntersectionObserverMock.instances.find((instance) => instance.observes(playground))?.trigger(playground);
        await tick();

        expect(getByRole('link', { name: 'Playground' }).getAttribute('aria-current')).toBe('location');
        expect(getByRole('link', { name: 'API' }).hasAttribute('aria-current')).toBe(false);
    });

    test('restores Home as current after leaving tracked documentation sections', async () => {
        const { getByRole, container } = render(Layout, { children });
        await tick();
        const playground = container.querySelector('#playground')!;
        const observer = IntersectionObserverMock.instances.find((instance) => instance.observes(playground));

        observer?.trigger(playground);
        await tick();
        expect(getByRole('link', { name: 'Playground' }).getAttribute('aria-current')).toBe('location');

        observer?.trigger(playground, false);
        await tick();

        expect(getByRole('link', { name: 'Sileo Svelte home' }).getAttribute('aria-current')).toBe('page');
        expect(getByRole('link', { name: 'Playground' }).hasAttribute('aria-current')).toBe(false);
        expect(getByRole('link', { name: 'API' }).hasAttribute('aria-current')).toBe(false);
    });

    test('renders complete canonical and social metadata', () => {
        render(Page);
        const canonicalHref = document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
        const expectedSocialImage = new URL('/docs/og-image.svg', canonicalHref).href;

        expect(document.title).toBe('Sileo Svelte — physics-based toast notifications');
        expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('Svelte 5');
        expect(canonicalHref).toMatch(/^https?:\/\//);
        expect(document.head.querySelector('meta[property="og:title"]')?.getAttribute('content')).toContain(
            'Sileo Svelte'
        );
        expect(document.head.querySelector('meta[property="og:image"]')?.getAttribute('content')).toMatch(
            /^https?:\/\//
        );
        expect(document.head.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
            expectedSocialImage
        );
        expect(document.head.querySelector('meta[name="twitter:image"]')?.getAttribute('content')).toBe(
            expectedSocialImage
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

        const defaultRevealRule = stylesheet.match(/\n\s*\[data-reveal\]\s*\{([^}]*)\}/)?.[1];
        expect(defaultRevealRule).toBeDefined();
        expect(defaultRevealRule).not.toContain('opacity: 0');
        expect(defaultRevealRule).not.toContain('translateY');
        expect(stylesheet).toContain('[data-reveal]:global(.reveal-enabled)');
    });
});
