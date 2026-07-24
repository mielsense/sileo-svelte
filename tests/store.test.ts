import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { sileo } from '../src/lib/index.js';
import { store } from '../src/lib/store.svelte.ts';

const deferred = <T>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((resolvePromise) => {
        resolve = resolvePromise;
    });

    return { promise, resolve };
};

describe('sileo store', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        store.toasts = [];
    });

    afterEach(() => {
        vi.useRealTimers();
        store.toasts = [];
    });

    test('returns unique string ids when creating toasts', () => {
        const first = sileo.show('First');
        const second = sileo.show('Second');

        expect(first).toEqual(expect.any(String));
        expect(second).toEqual(expect.any(String));
        expect(first).not.toBe(second);
    });

    test('merges scoped classes and styles by key', () => {
        const scoped = sileo.with({
            classes: { title: 'base-title', badge: 'base-badge' },
            styles: { titleColor: 'red', badgeColor: 'blue' }
        });

        const id = scoped.show({
            title: 'Merged',
            classes: { title: 'local-title' },
            styles: { badgeColor: 'green' }
        });

        expect(store.toasts.find((toast) => toast.id === id)).toEqual(
            expect.objectContaining({
                classes: { title: 'local-title', badge: 'base-badge' },
                styles: { titleColor: 'red', badgeColor: 'green' }
            })
        );
    });

    test('keeps loading and action toasts persistent by default', () => {
        const loadingId = sileo.loading('Loading');
        const actionId = sileo.action('Action');

        expect(store.toasts.find((toast) => toast.id === loadingId)?.duration).toBeNull();
        expect(store.toasts.find((toast) => toast.id === actionId)?.duration).toBeNull();
    });

    test('uses the documented default duration for status toasts', () => {
        const ids = [sileo.success('Success'), sileo.error('Error'), sileo.warning('Warning'), sileo.info('Info')];

        expect(store.toasts.filter((toast) => ids.includes(toast.id)).map((toast) => toast.duration)).toEqual([
            6000, 6000, 6000, 6000
        ]);
    });

    test('replaces a pending promise toast with the same supplied id', async () => {
        const first = deferred<string>();
        const second = deferred<string>();
        const firstPromise = sileo.promise(first.promise, {
            id: 'stable',
            position: 'top-left',
            loading: { title: 'First loading' },
            success: { title: 'First complete' },
            error: { title: 'Failed' }
        });
        const firstToast = store.toasts[0];
        expect(firstToast).toEqual(
            expect.objectContaining({ id: 'stable', title: 'First loading', state: 'loading', duration: null })
        );
        const firstInstanceId = firstToast.instanceId;

        const secondPromise = sileo.promise(second.promise, {
            id: 'stable',
            position: 'bottom-left',
            loading: { title: 'Second loading' },
            success: { title: 'Second complete' },
            error: { title: 'Failed' }
        });

        try {
            expect(store.toasts).toHaveLength(1);
            expect(store.toasts[0]).toEqual(
                expect.objectContaining({
                    id: 'stable',
                    title: 'Second loading',
                    state: 'loading',
                    position: 'bottom-left',
                    duration: null
                })
            );
            expect(store.toasts[0].instanceId).not.toBe(firstInstanceId);
        } finally {
            first.resolve('first');
            second.resolve('second');
            await Promise.all([firstPromise, secondPromise]);
        }
    });

    test('dismiss removes only the requested toast after its exit transition', () => {
        const first = sileo.show('First');
        const second = sileo.show('Second');

        sileo.dismiss(first);

        expect(store.toasts.find((toast) => toast.id === first)?.exiting).toBe(true);
        expect(store.toasts.find((toast) => toast.id === second)?.exiting).toBeUndefined();

        vi.advanceTimersByTime(600);

        expect(store.toasts.map((toast) => toast.id)).toEqual([second]);
    });

    test('close removes the requested toast after collapse and exit transitions', () => {
        const id = sileo.show('Close me');

        sileo.close(id);

        expect(store.toasts.find((toast) => toast.id === id)?.closing).toBe(true);

        vi.advanceTimersByTime(1250);

        expect(store.toasts).toHaveLength(0);
    });

    test('clears only a selected position', () => {
        const top = sileo.show({ title: 'Top', position: 'top-left' });
        const bottom = sileo.show({ title: 'Bottom', position: 'bottom-right' });

        sileo.clear('top-left');

        expect(store.toasts.map((toast) => toast.id)).toEqual([bottom]);
        expect(store.toasts.map((toast) => toast.id)).not.toContain(top);
    });

    test('preserves omitted state and options during partial updates', () => {
        const button = { title: 'Cancel', onClick: () => undefined };
        const id = sileo.loading({
            title: 'Uploading',
            description: '10%',
            position: 'bottom-left',
            fill: 'linear-gradient(red, blue)',
            button,
            classes: { title: 'upload-title', badge: 'upload-badge' },
            styles: { titleColor: 'red', badgeColor: 'blue' }
        });

        sileo.update(id, { title: 'Uploading 50%' });

        expect(store.toasts.find((toast) => toast.id === id)).toEqual(
            expect.objectContaining({
                title: 'Uploading 50%',
                description: '10%',
                state: 'loading',
                position: 'bottom-left',
                fill: 'linear-gradient(red, blue)',
                button,
                classes: { title: 'upload-title', badge: 'upload-badge' },
                styles: { titleColor: 'red', badgeColor: 'blue' }
            })
        );
    });

    test('treats an undefined description in a partial update as omitted', () => {
        const id = sileo.show({ title: 'Uploading', description: '10%' });

        sileo.update(id, { description: undefined });

        expect(store.toasts.find((toast) => toast.id === id)?.description).toBe('10%');
    });

    test('merges nested update maps and replaces explicitly supplied fields', () => {
        const id = sileo.action({
            title: 'Review',
            position: 'top-left',
            classes: { title: 'old-title', badge: 'old-badge' },
            styles: { titleColor: 'red', badgeColor: 'blue' }
        });

        sileo.update(id, {
            state: 'success',
            position: 'bottom-right',
            classes: { title: 'new-title' },
            styles: { badgeColor: 'green' }
        });

        expect(store.toasts.find((toast) => toast.id === id)).toEqual(
            expect.objectContaining({
                state: 'success',
                position: 'bottom-right',
                duration: 6000,
                classes: { title: 'new-title', badge: 'old-badge' },
                styles: { titleColor: 'red', badgeColor: 'green' }
            })
        );
    });

    test('retains explicit null duration and icon while keeping autopilot disabled', () => {
        const id = sileo.show({ title: 'Waiting', duration: null, icon: null, autopilot: false });

        sileo.update(id, { title: 'Still waiting' });

        expect(store.toasts.find((toast) => toast.id === id)).toEqual(
            expect.objectContaining({
                title: 'Still waiting',
                duration: null,
                icon: null,
                autopilot: false,
                autoExpandDelayMs: undefined,
                autoCollapseDelayMs: undefined
            })
        );
    });

    test('rejects a synchronous promise factory while transitioning the toast to error', async () => {
        const error = new Error('offline');
        const returned = sileo.promise(
            () => {
                throw error;
            },
            {
                loading: { title: 'Uploading' },
                success: { title: 'Uploaded' },
                error: { title: 'Upload failed' }
            }
        );

        await expect(returned).rejects.toBe(error);
        await vi.runAllTimersAsync();

        expect(store.toasts[0]).toEqual(
            expect.objectContaining({ title: 'Upload failed', state: 'error', duration: 6000 })
        );
    });

    test('preserves an asynchronous rejection while transitioning the toast to error', async () => {
        const error = new Error('offline');
        const returned = sileo.promise(Promise.reject(error), {
            loading: { title: 'Uploading' },
            success: { title: 'Uploaded' },
            error: (reason) => ({ title: `Failed: ${(reason as Error).message}` })
        });

        await expect(returned).rejects.toBe(error);
        await vi.runAllTimersAsync();

        expect(store.toasts[0]).toEqual(expect.objectContaining({ title: 'Failed: offline', state: 'error' }));
    });

    test('preserves a promise resolution while transitioning the toast to success', async () => {
        const result = { file: 'report.pdf' };
        const returned = sileo.promise(Promise.resolve(result), {
            id: 'upload',
            loading: { title: 'Uploading' },
            success: (data) => ({ title: `Uploaded ${data.file}` }),
            error: { title: 'Upload failed' }
        });

        await expect(returned).resolves.toBe(result);
        await vi.runAllTimersAsync();

        expect(store.toasts).toEqual([
            expect.objectContaining({ id: 'upload', title: 'Uploaded report.pdf', state: 'success', duration: 6000 })
        ]);
    });

    test('uses the action mapping instead of success after a promise resolves', async () => {
        const returned = sileo.promise(Promise.resolve('report.pdf'), {
            loading: { title: 'Uploading' },
            success: { title: 'Uploaded' },
            action: (file) => ({ title: `Open ${file}` }),
            error: { title: 'Upload failed' }
        });

        await expect(returned).resolves.toBe('report.pdf');
        await vi.runAllTimersAsync();

        expect(store.toasts[0]).toEqual(
            expect.objectContaining({ title: 'Open report.pdf', state: 'action', duration: null })
        );
    });
});
