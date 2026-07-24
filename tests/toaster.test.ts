import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { readFile } from 'node:fs/promises';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Toaster, sileo } from '../src/lib/index.js';
import { store } from '../src/lib/store.svelte.ts';

describe('Toaster', () => {
    beforeEach(() => {
        store.toasts = [];
    });

    afterEach(() => {
        cleanup();
        store.toasts = [];
    });

    test('renders a toast through Toaster', async () => {
        sileo.success('Saved');
        const { getByText } = render(Toaster);

        await tick();

        expect(getByText('Saved')).toBeTruthy();
    });

    test('applies position and global options from Toaster', async () => {
        render(Toaster, {
            position: 'bottom-left',
            options: { fill: '#123456', roundness: 24 }
        });

        await tick();
        const id = sileo.show('Configured');

        expect(store.toasts).toContainEqual(
            expect.objectContaining({
                id,
                position: 'bottom-left',
                fill: '#123456',
                roundness: 24
            })
        );
    });

    test('morphs the title and description after an update', async () => {
        const id = sileo.show({ title: 'Draft', description: 'Saving', autopilot: false });
        const { getByText } = render(Toaster);

        await tick();
        sileo.update(id, { title: 'Published', description: 'Saved', autopilot: false });
        await tick();

        expect(getByText('Published')).toBeTruthy();
        expect(getByText('Saved')).toBeTruthy();
    });

    test('invokes an action button callback with its toast id', async () => {
        const onClick = vi.fn();
        const id = sileo.action({ title: 'Action', button: { title: 'Undo', onClick } });
        const { getByRole } = render(Toaster);

        await tick();
        await fireEvent.click(getByRole('button', { name: 'Undo' }));

        expect(onClick).toHaveBeenCalledWith(id);
    });

    test('expands and collapses described content on mouse enter and leave', async () => {
        sileo.show({ title: 'Details', description: 'More information', autopilot: false });
        const { getByRole, getByText } = render(Toaster);

        await tick();
        const toast = getByRole('group');

        await fireEvent.mouseEnter(toast);
        expect(toast.getAttribute('data-expanded')).toBe('true');
        expect(getByText('More information').parentElement?.getAttribute('data-visible')).toBe('true');

        await fireEvent.mouseLeave(toast);
        expect(toast.getAttribute('data-expanded')).toBe('false');
    });

    test('announces through a polite live viewport', async () => {
        sileo.info('Notice');
        const { container } = render(Toaster);

        await tick();

        expect(container.querySelector('[data-sileo-viewport]')?.getAttribute('aria-live')).toBe('polite');
    });

    test('ships a reduced-motion stylesheet contract', async () => {
        const stylesheet = await readFile('src/lib/styles.css', 'utf8');

        expect(stylesheet).toContain('@media (prefers-reduced-motion: reduce)');
    });

    test.todo('does not render a fallback icon when icon is null');
    test.todo('expands described content with the keyboard');
    test.todo('keeps toast geometry within a narrow viewport');
});
