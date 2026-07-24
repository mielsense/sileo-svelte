import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { tick } from 'svelte';
import Page from '../src/routes/+page.svelte';
import { store } from '../src/lib/store.svelte.js';

describe('documentation playground', () => {
    beforeEach(() => {
        store.toasts = [];
        store.position = 'top-right';
        store.globalOptions = undefined;
        vi.stubGlobal(
            'IntersectionObserver',
            class IntersectionObserver {
                observe() {}
                unobserve() {}
                disconnect() {}
            }
        );
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
        vi.unstubAllGlobals();
        store.toasts = [];
        store.position = 'top-right';
        store.globalOptions = undefined;
    });

    test('copies the install command and announces completion', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText }
        });
        const { getByRole, getByText } = render(Page);

        await fireEvent.click(getByRole('button', { name: 'Copy bun install command' }));

        expect(writeText).toHaveBeenCalledWith('bun add sileo-svelte');
        expect(getByText('Install command copied')).toBeTruthy();
    });

    test('selects a scenario and copies the exact displayed source', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText }
        });
        const { getByRole, getByText, container } = render(Page);

        await fireEvent.click(getByRole('button', { name: 'Async promise' }));
        expect(getByText('Async promise', { selector: 'h3' })).toBeTruthy();

        const displayedSource = container.querySelector('[data-scenario-source]')?.textContent?.trim();
        await fireEvent.click(getByRole('button', { name: 'Copy Async promise example' }));

        expect(displayedSource).toContain('sileo.promise');
        expect(writeText).toHaveBeenCalledWith(displayedSource);
        expect(getByText('Async promise example copied')).toBeTruthy();
    });

    test('preserves the selected position when running a deterministic example', async () => {
        const { getByRole } = render(Page);

        await fireEvent.click(getByRole('radio', { name: 'Bottom left' }));
        await fireEvent.click(getByRole('button', { name: 'Action and retry' }));
        await fireEvent.click(getByRole('button', { name: 'Run Action and retry example' }));
        await tick();

        expect(store.toasts.at(-1)).toEqual(
            expect.objectContaining({
                position: 'bottom-left',
                state: 'action',
                title: 'Payment needs attention'
            })
        );
    });

    test('runs the hero loading to success flow deterministically', async () => {
        vi.useFakeTimers();
        const { getByRole } = render(Page);

        await fireEvent.click(getByRole('button', { name: 'Try the motion' }));
        expect(store.toasts.at(-1)).toEqual(expect.objectContaining({ state: 'loading', title: 'Preparing preview' }));

        await vi.advanceTimersByTimeAsync(900);
        await tick();

        expect(store.toasts.at(-1)).toEqual(
            expect.objectContaining({
                state: 'success',
                title: 'Motion ready',
                description: 'The same toast changed state in place.'
            })
        );
    });
});
