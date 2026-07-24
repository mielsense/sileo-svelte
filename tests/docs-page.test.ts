import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Page from '../src/routes/+page.svelte';
import { scenarios, type Scenario } from '../src/routes/_components/scenarios.js';
import { store } from '../src/lib/store.svelte.js';

const richDescription = createRawSnippet(() => ({
    render: () => '<strong>Release v2.4</strong><span>Six regions are healthy.</span>'
}));
const richIcon = createRawSnippet(() => ({ render: () => '<svg aria-hidden="true"></svg>' }));

function sourceFor(scenario: Scenario, position = 'top-right'): string {
    const source = (scenario as Scenario & { source?: (value: string) => string }).source;
    expect(source, `${scenario.label} must expose a position-aware source builder`).toBeTypeOf('function');
    return source?.(position) ?? '';
}

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

    test('copies a self-contained example for the selected position', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText }
        });
        const { getByRole, getByText, container } = render(Page);

        await fireEvent.click(getByRole('radio', { name: 'Bottom left' }));
        await fireEvent.click(getByRole('button', { name: 'Async promise' }));
        expect(getByText('Async promise', { selector: 'h3' })).toBeTruthy();

        const displayedSource = container.querySelector('[data-scenario-source]')?.textContent?.trim();
        await fireEvent.click(getByRole('button', { name: 'Copy Async promise example' }));

        expect(displayedSource).toContain("import { sileo } from 'sileo-svelte'");
        expect(displayedSource).toContain("const position = 'bottom-left'");
        expect(displayedSource).toContain('const delay');
        expect(writeText).toHaveBeenCalledWith(displayedSource);
        expect(getByText('Async promise example copied')).toBeTruthy();
    });

    test('replaces the scenario detail node and announces only the selected label', async () => {
        const { getByRole, getByText, container } = render(Page);
        const initialDetail = container.querySelector('[data-scenario-detail]');

        await fireEvent.click(getByRole('button', { name: 'Async promise' }));

        expect(container.querySelector('[data-scenario-detail]')).not.toBe(initialDetail);
        expect(container.querySelector('[data-scenario-detail]')?.classList.contains('scenario-enter')).toBe(true);
        expect(getByText('Async promise selected').getAttribute('aria-live')).toBe('polite');
        expect(container.querySelector('[data-scenario-detail]')?.hasAttribute('aria-live')).toBe(false);
    });

    test('keeps reveal sections visible when IntersectionObserver is unavailable', () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        const { container } = render(Page);
        const sections = [...container.querySelectorAll<HTMLElement>('[data-reveal]')];

        expect(sections.length).toBeGreaterThan(0);
        for (const section of sections) {
            expect(section.classList.contains('reveal-enabled')).toBe(false);
            expect(getComputedStyle(section).opacity).not.toBe('0');
        }
    });

    test('keeps reveal sections visible when IntersectionObserver installation fails', () => {
        vi.stubGlobal(
            'IntersectionObserver',
            class IntersectionObserver {
                constructor() {
                    throw new Error('observer unavailable');
                }
            }
        );
        const { container } = render(Page);
        const sections = [...container.querySelectorAll<HTMLElement>('[data-reveal]')];

        expect(sections.length).toBeGreaterThan(0);
        expect(sections.every((section) => !section.classList.contains('reveal-enabled'))).toBe(true);
    });

    test('opts into reveal animation only after observer support is installed', () => {
        const { container } = render(Page);
        const sections = [...container.querySelectorAll<HTMLElement>('[data-reveal]')];

        expect(sections.length).toBeGreaterThan(0);
        expect(sections.every((section) => section.classList.contains('reveal-enabled'))).toBe(true);
    });

    test('animates the actual hero toast from loading to success', async () => {
        vi.useFakeTimers();
        const { getByRole, container } = render(Page);
        const heroPreview = container.querySelector('[data-hero-preview]');

        expect(heroPreview?.querySelector('[data-sileo-toast]')).toBeTruthy();
        await fireEvent.click(getByRole('button', { name: 'Try the motion' }));
        await tick();
        expect(heroPreview?.querySelector('[data-sileo-toast]')?.getAttribute('data-state')).toBe('loading');
        expect(heroPreview?.textContent).toContain('Preparing preview');

        await vi.advanceTimersByTimeAsync(900);
        await tick();

        expect(heroPreview?.querySelector('[data-sileo-toast]')?.getAttribute('data-state')).toBe('success');
        expect(heroPreview?.textContent).toContain('Motion ready');
    });

    test('hosts the selected scenario in the actual sticky toast preview', async () => {
        const { getByRole, container } = render(Page);

        await fireEvent.click(getByRole('radio', { name: 'Bottom left' }));
        await fireEvent.click(getByRole('button', { name: 'Action and retry' }));
        await fireEvent.click(getByRole('button', { name: 'Run Action and retry example' }));
        await tick();

        const preview = container.querySelector('[data-playground-preview]');
        expect(preview?.querySelector('[data-sileo-toast]')?.getAttribute('data-state')).toBe('action');
        expect(preview?.textContent).toContain('Payment needs attention');
        expect(store.toasts.at(-1)).toEqual(
            expect.objectContaining({
                position: 'bottom-left',
                state: 'action',
                title: 'Payment needs attention'
            })
        );
    });

    test.each([
        { label: 'Async promise', retry: false },
        { label: 'Action and retry', retry: true }
    ])('does not let a pending $label completion overwrite a newly selected scenario', async ({ label, retry }) => {
        vi.useFakeTimers();
        const { getByRole, container } = render(Page);

        await fireEvent.click(getByRole('button', { name: label }));
        await fireEvent.click(getByRole('button', { name: `Run ${label} example` }));
        if (retry) {
            await fireEvent.click(getByRole('button', { name: 'Retry' }));
        }

        const preview = container.querySelector('[data-playground-preview]');
        expect(preview?.textContent).toContain(retry ? 'Retrying payment' : 'Uploading build');
        expect(vi.getTimerCount()).toBeGreaterThan(0);

        await fireEvent.click(getByRole('button', { name: 'Core states' }));
        expect(preview?.textContent).toContain('Release saved');
        await vi.advanceTimersByTimeAsync(1200);
        await tick();

        expect(getByRole('button', { name: 'Core states' }).getAttribute('aria-pressed')).toBe('true');
        expect(preview?.querySelector('[data-sileo-toast]')?.getAttribute('data-state')).toBe('success');
        expect(preview?.textContent).toContain('Release saved');
        expect(preview?.textContent).not.toContain(retry ? 'Payment captured' : 'Build uploaded');
    });

    test('renders a scheduled async scenario completion in the live preview', async () => {
        vi.useFakeTimers();
        const { getByRole, container } = render(Page);

        await fireEvent.click(getByRole('button', { name: 'Async promise' }));
        await fireEvent.click(getByRole('button', { name: 'Run Async promise example' }));
        await vi.advanceTimersByTimeAsync(900);
        await tick();

        expect(container.querySelector('[data-playground-preview]')?.textContent).toContain('Build uploaded');
    });
});

describe('scenario contracts', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        store.toasts = [];
        store.position = 'top-right';
        store.globalOptions = undefined;
    });

    afterEach(() => {
        vi.useRealTimers();
        store.toasts = [];
        store.globalOptions = undefined;
    });

    test('all six copied sources are self-contained and position-aware', () => {
        expect(scenarios).toHaveLength(6);

        for (const scenario of scenarios) {
            const source = sourceFor(scenario, 'bottom-center');
            expect(source, scenario.label).toContain("import { sileo } from 'sileo-svelte'");
            expect(source, scenario.label).toContain("const position = 'bottom-center'");
        }

        const promiseSource = sourceFor(scenarios.find((item) => item.id === 'promise')!);
        expect(promiseSource.indexOf('const delay')).toBeLessThan(promiseSource.indexOf('sileo.promise'));

        const richSource = sourceFor(scenarios.find((item) => item.id === 'snippets')!);
        expect(richSource).toContain('{#snippet releaseDetails()}');
        expect(richSource).toContain('{#snippet releaseIcon()}');
        expect(richSource).toContain('description: releaseDetails');
        expect(richSource).toContain('icon: releaseIcon');
    });

    test('runs every scenario with source/runtime parity for its initial toast', () => {
        const expected = [
            ['core', 'success', 'Release saved', 'Draft v2.4 is ready for review.'],
            ['promise', 'loading', 'Uploading build', undefined],
            ['action', 'action', 'Payment needs attention', 'The first charge was declined.'],
            ['scoped', 'info', 'Invoice ready', 'Invoice 4921 can be downloaded.'],
            ['styles', 'action', 'Custom surface', 'Typed styles stay with this toast.'],
            ['snippets', 'info', 'Release details', richDescription]
        ] as const;

        for (const [id, state, title, description] of expected) {
            store.toasts = [];
            const scenario = scenarios.find((item) => item.id === id)!;
            scenario.run({ position: 'bottom-left', richDescription, richIcon });
            const toast = store.toasts.at(-1);
            const expectedToast = {
                state,
                title,
                position: 'bottom-left',
                ...(description === undefined ? {} : { description })
            };
            expect(toast, id).toEqual(expect.objectContaining(expectedToast));

            const source = sourceFor(scenario, 'bottom-left');
            expect(source, id).toContain(`title: '${title}'`);
            if (typeof description === 'string') expect(source, id).toContain(`description: '${description}'`);
        }
    });

    test('completes the promise and retry paths deterministically', async () => {
        const promiseScenario = scenarios.find((item) => item.id === 'promise')!;
        promiseScenario.run({ position: 'top-right', richDescription, richIcon });
        await vi.advanceTimersByTimeAsync(900);
        await tick();
        expect(store.toasts.at(-1)).toEqual(
            expect.objectContaining({
                state: 'success',
                title: 'Build uploaded',
                description: 'Artifacts are ready for release.'
            })
        );

        store.toasts = [];
        const retryScenario = scenarios.find((item) => item.id === 'action')!;
        retryScenario.run({ position: 'top-right', richDescription, richIcon });
        const actionToast = store.toasts.at(-1)!;
        actionToast.button?.onClick(actionToast.id);
        expect(store.toasts.at(-1)).toEqual(expect.objectContaining({ state: 'loading', title: 'Retrying payment' }));

        await vi.advanceTimersByTimeAsync(900);
        await tick();
        expect(store.toasts.at(-1)).toEqual(expect.objectContaining({ state: 'success', title: 'Payment captured' }));
    });
});
