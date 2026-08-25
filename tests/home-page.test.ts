import { cleanup, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Home from '../src/routes/+page.svelte';

describe('homepage', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal(
            'ResizeObserver',
            class ResizeObserver {
                observe() {}
                unobserve() {}
                disconnect() {}
            }
        );
        vi.stubGlobal('matchMedia', (query: string) => ({
            matches: false,
            media: query,
            addEventListener() {},
            removeEventListener() {}
        }));
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    test('presents the port, upstream project, and primary routes in one hero', () => {
        const { getByRole, container } = render(Home);

        expect(getByRole('heading', { name: 'Sileo, shaped for Svelte.' })).toBeTruthy();
        expect(getByRole('link', { name: 'Read the documentation' }).getAttribute('href')).toBe('/docs');
        expect(getByRole('link', { name: 'Open the playground' }).getAttribute('href')).toBe('/playground');
        expect(getByRole('link', { name: 'Original Sileo library' }).getAttribute('href')).toBe(
            'https://github.com/hiaaryan/sileo'
        );
        expect(container.querySelector('.home-page')).toBeTruthy();
        expect(container.querySelector('[data-home-demo]')).toBeTruthy();
    });

    test('cycles the contained demo without sending a page-level toast', async () => {
        const { container } = render(Home);
        const demo = container.querySelector('[data-home-demo]');

        expect(demo?.getAttribute('data-demo-state')).toBe('loading');
        await vi.advanceTimersByTimeAsync(2400);
        expect(demo?.getAttribute('data-demo-state')).toBe('success');
        expect(container.querySelector('[data-sileo-viewport]')).toBeNull();
    });
});
