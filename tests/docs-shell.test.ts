import { cleanup, fireEvent, render } from '@testing-library/svelte';
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

    test('opens the mobile navigation and closes it with Escape', async () => {
        const { getByRole, container } = render(Layout, { children });
        const toggle = getByRole('button', { name: 'Open navigation menu' });
        const menu = container.querySelector<HTMLElement>('[data-mobile-menu]');

        expect(toggle.getAttribute('aria-expanded')).toBe('false');
        expect(menu?.getAttribute('aria-hidden')).toBe('true');
        expect(menu?.hasAttribute('inert')).toBe(true);

        await fireEvent.click(toggle);
        await tick();

        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        expect(toggle.getAttribute('aria-label')).toBe('Close navigation menu');
        expect(menu?.getAttribute('aria-hidden')).toBe('false');
        expect(menu?.hasAttribute('inert')).toBe(false);

        await fireEvent.keyDown(window, { key: 'Escape' });
        await tick();

        expect(toggle.getAttribute('aria-expanded')).toBe('false');
        expect(menu?.getAttribute('aria-hidden')).toBe('true');
        expect(document.activeElement).toBe(toggle);
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
        const { getByText, getByLabelText } = render(Page);
        const buttonContract = getByLabelText('Button and state contracts').textContent ?? '';
        const classesContract = getByLabelText('Class and style contracts').textContent ?? '';

        expect(getByText(/promise<T>\(/)).toBeTruthy();
        expect(buttonContract).toContain('interface SileoButton');
        expect(classesContract).toContain('buttonHoverBackground?: string');
        expect(classesContract).toContain('description?: string');
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

    test('uses a dedicated Svelte grammar for documentation code', async () => {
        const { readFile } = await import('node:fs/promises');
        const [packageJson, page] = await Promise.all([
            readFile('package.json', 'utf8'),
            readFile('src/routes/+page.svelte', 'utf8')
        ]);

        expect(packageJson).toContain('"svelte-highlight"');
        expect(page).toContain("import HighlightSvelte from 'svelte-highlight/HighlightSvelte.svelte'");
        expect(page).toContain("import Highlight from 'svelte-highlight'");
        expect(page).toContain("import typescript from 'svelte-highlight/languages/typescript'");
        expect(page).toContain("import 'svelte-highlight/themes/gruvbox-dark-medium.css'");
        expect(page).toContain('<HighlightSvelte');
    });

    test('keeps the mobile menu control small and separated from the logo', async () => {
        const layout = await import('node:fs/promises').then(({ readFile }) =>
            readFile('src/routes/+layout.svelte', 'utf8')
        );

        const mobileRules = layout.match(/@media \(max-width: 520px\) \{([\s\S]*?)@media \(max-width: 350px\)/)?.[1];
        expect(mobileRules).toBeDefined();
        expect(mobileRules).toMatch(/\.nav-island\s*\{[\s\S]*?gap: 24px/);
        expect(mobileRules).toMatch(/\.menu-toggle\s*\{[\s\S]*?width: 32px;[\s\S]*?height: 32px/);
    });
});
