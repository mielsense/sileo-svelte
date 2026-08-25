import { describe, expect, test, vi } from 'vitest';
import { measuredExpandedHeight, resolveToastGeometry } from '../src/lib/geometry.js';
import {
    MotionRegistry,
    quickTransition,
    readMotionDuration,
    springTransition,
    type MotionControl
} from '../src/lib/motion.js';

function control() {
    return {
        finished: new Promise(() => undefined),
        stop: vi.fn()
    } as unknown as MotionControl;
}

describe('motion lifecycle', () => {
    test('stops an interrupted animation before replacing it', () => {
        const registry = new MotionRegistry();
        const first = control();
        const second = control();

        registry.start('toast', () => first);
        registry.start('toast', () => second);

        expect(first.stop).toHaveBeenCalledOnce();
        expect(second.stop).not.toHaveBeenCalled();
    });

    test('stops every active animation during component cleanup', () => {
        const registry = new MotionRegistry();
        const first = control();
        const second = control();

        registry.start('toast', () => first);
        registry.start('shape', () => second);
        registry.stopAll();

        expect(first.stop).toHaveBeenCalledOnce();
        expect(second.stop).toHaveBeenCalledOnce();
    });

    test('makes reduced-motion transitions immediate', () => {
        expect(springTransition(true)).toEqual({ duration: 0, delay: 0 });
        expect(quickTransition(true)).toEqual({ duration: 0, delay: 0 });
        expect(springTransition(false)).toMatchObject({ type: 'spring', visualDuration: 0.6 });
    });

    test('reads the public duration variable in seconds', () => {
        const node = document.createElement('div');
        node.style.setProperty('--sileo-duration', '450ms');
        expect(readMotionDuration(node)).toBe(0.45);

        node.style.setProperty('--sileo-duration', '1.2s');
        expect(readMotionDuration(node)).toBe(1.2);

        node.style.setProperty('--sileo-duration', 'invalid');
        expect(readMotionDuration(node)).toBe(0.6);
    });
});

describe('toast geometry', () => {
    test('keeps the pill aligned while its body expands', () => {
        const expandedHeight = measuredExpandedHeight(40, 100, true);
        const geometry = resolveToastGeometry({
            alignment: 'right',
            baseHeight: 40,
            blur: 9,
            canvasWidth: 350,
            expandedHeight,
            hasDescription: true,
            open: true,
            pillWidth: 148
        });

        expect(geometry).toEqual({
            bodyHeight: 100,
            canvasHeight: 140,
            collapsedPillScale: 40 / 67,
            pillHeight: 67,
            pillWidth: 148,
            pillX: 202,
            rootHeight: 140
        });
    });
});
