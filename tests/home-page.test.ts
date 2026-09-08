import { cleanup, fireEvent, render } from '@testing-library/svelte';
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

    test('presents the primary routes and interactive demo', () => {
        const { getByRole, container } = render(Home);

        expect(getByRole('heading', { name: 'Toasts for Svelte.' })).toBeTruthy();
        expect(getByRole('link', { name: 'Get started' }).getAttribute('href')).toBe('/docs');
        expect(getByRole('link', { name: 'Playground' }).getAttribute('href')).toBe('/playground');
        expect(container.querySelector('.home-page')).toBeTruthy();
        expect(container.querySelector('[data-home-demo]')).toBeTruthy();
    });

    test('changes the demo only when the reader selects a state', async () => {
        const { container, getByRole } = render(Home);
        const demo = container.querySelector('[data-home-demo]');

        expect(demo?.getAttribute('data-demo-state')).toBe('success');
        await vi.advanceTimersByTimeAsync(5000);
        expect(demo?.getAttribute('data-demo-state')).toBe('success');
        await fireEvent.click(getByRole('button', { name: 'Loading' }));
        expect(demo?.getAttribute('data-demo-state')).toBe('loading');
        expect(container.querySelector('[data-sileo-viewport]')).toBeNull();
    });
});
