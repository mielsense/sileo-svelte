import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Toaster, sileo } from '../src/lib/index.js';
import { store } from '../src/lib/store.svelte.js';

class ResizeObserverMock {
    observe() {}
    disconnect() {}
    unobserve() {}
}

describe('public API and custom content accessibility', () => {
    beforeEach(() => {
        vi.stubGlobal('ResizeObserver', ResizeObserverMock);
        store.toasts = [];
        store.globalOptions = undefined;
    });
    afterEach(() => {
        cleanup();
        sileo.clear();
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    test('replaces explicitly named notifications without duplicates', () => {
        expect(sileo.loading({ id: 'upload', title: 'Uploading' })).toBe('upload');
        expect(sileo.success({ id: 'upload', title: 'Uploaded' })).toBe('upload');
        expect(store.toasts).toHaveLength(1);
        expect(store.toasts[0].state).toBe('success');
    });

    test('removes an existing action button with null', () => {
        const id = sileo.action({ title: 'Retry', button: { title: 'Retry', onClick: vi.fn() } });
        sileo.update(id, { state: 'success', title: 'Done', button: null });
        expect(store.toasts[0].button).toBeNull();
    });

    test('announces the string description with the title', async () => {
        const { getByRole } = render(Toaster);
        await tick();
        sileo.error({ title: 'Upload failed', description: 'The file exceeds 10 MB.' });
        await tick();
        await tick();
        expect(getByRole('status').textContent).toBe('Upload failed. The file exceeds 10 MB.');
    });

    test('announces an older promise result while a newer toast remains', async () => {
        const { getByRole } = render(Toaster);
        await tick();
        let resolve!: (value: string) => void;
        const task = new Promise<string>((done) => {
            resolve = done;
        });
        const result = sileo.promise(task, {
            loading: { title: 'Uploading' },
            success: { title: 'Uploaded', description: 'Report.pdf is ready.' },
            error: { title: 'Upload failed' }
        });
        await tick();
        sileo.info({ title: 'New comment', duration: null });
        await tick();
        await tick();
        expect(getByRole('status').textContent).toBe('New comment');
        resolve('done');
        await result;
        await tick();
        await tick();
        expect(getByRole('status').textContent).toBe('Uploaded. Report.pdf is ready.');
    });

    test('does not announce an older toast again when the newest is removed', async () => {
        const { getByRole } = render(Toaster);
        await tick();
        sileo.info({ title: 'Older notice', duration: null });
        await tick();
        const newest = sileo.info({ title: 'Newest notice', duration: null });
        await tick();
        await tick();
        expect(getByRole('status').textContent).toBe('Newest notice');
        sileo.dismiss(newest);
        await tick();
        await tick();
        expect(getByRole('status').textContent).toBe('Newest notice');
        sileo.clear();
        await tick();
        sileo.info({ id: newest, title: 'Reused id', duration: null });
        await tick();
        await tick();
        expect(getByRole('status').textContent).toBe('Reused id');
    });

    test('lets keyboard users open and operate snippet content and collapse with Escape', async () => {
        const description = createRawSnippet(() => ({ render: () => '<a href="#details">Read details</a>' }));
        sileo.info({ title: 'Report', description, autopilot: false, duration: null });
        const { container } = render(Toaster);
        await tick();
        const trigger = container.querySelector<HTMLButtonElement>('[data-sileo-trigger]')!;
        const link = container.querySelector<HTMLAnchorElement>('a')!;
        expect(trigger.tabIndex).toBe(0);
        trigger.focus();
        await tick();
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        link.focus();
        await tick();
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        await fireEvent.keyDown(link, { key: 'Escape' });
        expect(document.activeElement).toBe(trigger);
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    test('pauses expiry while a custom snippet control is focused', async () => {
        vi.useFakeTimers();
        const description = createRawSnippet(() => ({ render: () => '<input aria-label="Name" />' }));
        const id = sileo.info({ title: 'Name', description, duration: 1000, autopilot: false });
        const { container } = render(Toaster);
        await tick();
        container.querySelector<HTMLButtonElement>('[data-sileo-trigger]')!.focus();
        await tick();
        const input = container.querySelector<HTMLInputElement>('input')!;
        input.focus();
        await tick();
        await vi.advanceTimersByTimeAsync(2000);
        expect(store.toasts.find((toast) => toast.id === id)?.exiting).not.toBe(true);
        input.blur();
        await tick();
        await vi.advanceTimersByTimeAsync(1000);
        expect(store.toasts.find((toast) => toast.id === id)?.exiting).toBe(true);
    });

    test('does not capture pointer events from custom controls', async () => {
        const description = createRawSnippet(() => ({
            render: () => '<div><a href="#">Link</a><button>Custom action</button><input /></div>'
        }));
        sileo.info({ title: 'Controls', description, autopilot: false });
        const { container } = render(Toaster);
        await tick();
        const toast = container.querySelector<HTMLElement>('[data-sileo-toast]')!;
        toast.setPointerCapture = vi.fn();
        for (const control of container.querySelectorAll('a, input, [data-sileo-description] button')) {
            control.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientY: 10 }));
        }
        expect(toast.setPointerCapture).not.toHaveBeenCalled();
    });

    test('ignores other pointers while a swipe is active', async () => {
        const id = sileo.info({ title: 'Swipe', description: 'Details', autopilot: false });
        const { container } = render(Toaster);
        await tick();
        const toast = container.querySelector<HTMLElement>('[data-sileo-toast]')!;
        toast.setPointerCapture = vi.fn();
        toast.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientY: 10 }));
        toast.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 2, clientY: 200 }));
        await tick();
        expect(store.toasts.find((toast) => toast.id === id)?.exiting).not.toBe(true);
        toast.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, clientY: 200 }));
        await tick();
        expect(store.toasts.find((toast) => toast.id === id)?.exiting).toBe(true);
    });
});
