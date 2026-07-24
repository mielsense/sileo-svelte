import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { sileo, store } from '../src/lib/store.svelte.ts';

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

    test('uses a supplied promise id to morph a loading toast', async () => {
        const promise = sileo.promise(Promise.resolve('complete'), {
            id: 'stable',
            loading: { title: 'Loading' },
            success: (result) => ({ title: `Completed: ${result}` }),
            error: { title: 'Failed' }
        });

        expect(store.toasts).toContainEqual(
            expect.objectContaining({ id: 'stable', title: 'Loading', state: 'loading' })
        );

        await expect(promise).resolves.toBe('complete');
        expect(store.toasts).toHaveLength(1);
        expect(store.toasts[0]).toEqual(
            expect.objectContaining({ id: 'stable', title: 'Completed: complete', state: 'success' })
        );
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

    test.todo('preserves omitted state and options during partial updates');
    test.todo('rejects a synchronous promise factory while transitioning the toast to error');
});
