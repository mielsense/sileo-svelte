import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Playground from '../src/routes/playground/+page.svelte';
import { scenarios, type Scenario } from '../src/routes/_components/scenarios.js';
import { store } from '../src/lib/store.svelte.js';

const richDescription = createRawSnippet(() => ({
    render: () => '<strong>Release v2.4</strong><span>Six regions are healthy.</span>'
}));
const richIcon = createRawSnippet(() => ({ render: () => '<svg aria-hidden="true"></svg>' }));

function sourceFor(scenario: Scenario, position = 'top-right'): string {
    return scenario.source(position as Parameters<Scenario['source']>[0]);
}

describe('documentation playground', () => {
    beforeEach(() => {
        store.toasts = [];
        store.position = 'top-right';
        store.globalOptions = undefined;
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
        vi.useRealTimers();
        vi.unstubAllGlobals();
        store.toasts = [];
        store.globalOptions = undefined;
    });

    test('copies source for the selected scenario and position', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
        const { getByRole, getByText, container } = render(Playground);

        await fireEvent.click(getByRole('radio', { name: 'Bottom left' }));
        await fireEvent.click(getByRole('button', { name: 'Async promise One continuous toast' }));
        const source = container.querySelector('[data-scenario-source]')?.textContent ?? '';
        expect(container.querySelector('[data-scenario-source] .hljs-keyword')).toBeTruthy();
        await fireEvent.click(getByRole('button', { name: 'Copy Async promise example' }));

        expect(source).toContain("const position = 'bottom-left'");
        expect(source).toContain('const delay');
        expect(writeText).toHaveBeenCalledWith(source);
        expect(getByText('Async promise example copied')).toBeTruthy();
    });

    test('runs the selected action scenario in the embedded preview', async () => {
        const { getByRole, container } = render(Playground);
        await fireEvent.click(getByRole('radio', { name: 'Bottom left' }));
        await fireEvent.click(getByRole('button', { name: 'Action and retry Persistent interaction' }));
        await fireEvent.click(getByRole('button', { name: 'Run example' }));
        await tick();

        const preview = container.querySelector('[data-playground-preview]');
        expect(preview?.querySelector('[data-sileo-toast]')?.getAttribute('data-state')).toBe('action');
        expect(preview?.textContent).toContain('Payment needs attention');
        expect(store.toasts).toEqual([]);
    });

    test('does not let a pending completion overwrite a new selection', async () => {
        vi.useFakeTimers();
        const { getByRole, container } = render(Playground);

        await fireEvent.click(getByRole('button', { name: 'Async promise One continuous toast' }));
        await fireEvent.click(getByRole('button', { name: 'Run example' }));
        await fireEvent.click(getByRole('button', { name: 'Core states State helpers' }));
        await vi.advanceTimersByTimeAsync(1200);
        await tick();

        const preview = container.querySelector('[data-playground-preview]');
        expect(getByRole('button', { name: 'Core states State helpers' }).getAttribute('aria-pressed')).toBe('true');
        expect(preview?.textContent).toContain('Release saved');
        expect(preview?.textContent).not.toContain('Build uploaded');
    });
});

describe('scenario contracts', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        store.toasts = [];
    });

    afterEach(() => {
        vi.useRealTimers();
        store.toasts = [];
    });

    test('all six sources are self-contained and position-aware', () => {
        expect(scenarios).toHaveLength(6);
        for (const scenario of scenarios) {
            const source = sourceFor(scenario, 'bottom-center');
            expect(source).toContain("import { sileo } from 'sileo-svelte'");
            expect(source).toContain("const position = 'bottom-center'");
        }
    });

    test('promise and retry flows finish on the same toast', async () => {
        const promiseScenario = scenarios.find((item) => item.id === 'promise')!;
        promiseScenario.run({ position: 'top-right', richDescription, richIcon });
        await vi.advanceTimersByTimeAsync(900);
        await tick();
        expect(store.toasts.at(-1)).toEqual(expect.objectContaining({ state: 'success', title: 'Build uploaded' }));

        store.toasts = [];
        const retryScenario = scenarios.find((item) => item.id === 'action')!;
        retryScenario.run({ position: 'top-right', richDescription, richIcon });
        const actionToast = store.toasts.at(-1)!;
        actionToast.button?.onClick(actionToast.id);
        await vi.advanceTimersByTimeAsync(900);
        await tick();
        expect(store.toasts.at(-1)).toEqual(expect.objectContaining({ state: 'success', title: 'Payment captured' }));
    });
});
