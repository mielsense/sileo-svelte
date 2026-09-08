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

    test('copies source for the selected scenario', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
        const { getByRole, getByText, container } = render(Playground);

        await fireEvent.click(getByRole('button', { name: 'Examples' }));
        await fireEvent.click(getByRole('combobox', { name: 'Example' }));
        await fireEvent.pointerDown(getByRole('option', { name: 'Async promise' }), {
            pointerType: 'mouse',
            button: 0
        });
        await fireEvent.click(getByRole('option', { name: 'Async promise' }));
        const source = container.querySelector('[data-scenario-source]')?.textContent ?? '';
        expect(container.querySelector('[data-scenario-source] .hljs-keyword')).toBeTruthy();
        await fireEvent.click(getByRole('button', { name: 'Copy Async promise example' }));

        expect(source).toContain("const position = 'top-right'");
        expect(source).toContain('const delay');
        expect(writeText).toHaveBeenCalledWith(source);
        expect(getByText('Copied')).toBeTruthy();
    });

    test('runs the selected action scenario in the embedded preview', async () => {
        const { getByRole, container } = render(Playground);
        await fireEvent.click(getByRole('button', { name: 'Examples' }));
        await fireEvent.click(getByRole('combobox', { name: 'Example' }));
        await fireEvent.pointerDown(getByRole('option', { name: 'Action and retry' }), {
            pointerType: 'mouse',
            button: 0
        });
        await fireEvent.click(getByRole('option', { name: 'Action and retry' }));
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

        await fireEvent.click(getByRole('button', { name: 'Examples' }));
        await fireEvent.click(getByRole('combobox', { name: 'Example' }));
        await fireEvent.pointerDown(getByRole('option', { name: 'Async promise' }), {
            pointerType: 'mouse',
            button: 0
        });
        await fireEvent.click(getByRole('option', { name: 'Async promise' }));
        await fireEvent.click(getByRole('button', { name: 'Run example' }));
        await fireEvent.click(getByRole('combobox', { name: 'Example' }));
        await fireEvent.pointerDown(getByRole('option', { name: 'Core states' }), {
            pointerType: 'mouse',
            button: 0
        });
        await fireEvent.click(getByRole('option', { name: 'Core states' }));
        await vi.advanceTimersByTimeAsync(1200);
        await tick();

        const preview = container.querySelector('[data-playground-preview]');
        expect(getByRole('combobox', { name: 'Example' }).textContent).toContain('Core states');
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
        await vi.advanceTimersByTimeAsync(1400);
        await tick();
        expect(store.toasts.at(-1)).toEqual(expect.objectContaining({ state: 'success', title: 'Payment captured' }));
    });
});
