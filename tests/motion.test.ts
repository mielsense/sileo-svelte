import { readFile } from 'node:fs/promises';
import { describe, expect, test, vi } from 'vitest';
import { measuredExpandedHeight, resolveToastGeometry } from '../src/lib/geometry.js';
import {
    easeTransition,
    MotionRegistry,
    readMotionDuration,
    resistedSwipeOffset,
    shouldDismissSwipe,
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
    test('keeps runtime animation ownership in Motion', async () => {
        const stylesheet = await readFile('src/lib/styles.css', 'utf8');
        expect(stylesheet).not.toMatch(/^\s*(?:animation|transition)(?:-[\w-]+)?\s*:/m);
    });

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
        expect(easeTransition(true)).toEqual({ duration: 0, delay: 0 });
        expect(springTransition(false)).toEqual({ type: 'spring', duration: 0.6, bounce: 0.25, delay: 0 });
        expect(springTransition(false, 0, 0.6, 0)).toEqual({
            type: 'spring',
            duration: 0.6,
            bounce: 0,
            delay: 0
        });
        expect(easeTransition(false, 0.42)).toEqual({
            type: 'tween',
            duration: 0.42,
            delay: 0,
            ease: [0.25, 0.1, 0.25, 1]
        });
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

    test('adds progressive resistance without hard-clamping a swipe', () => {
        expect(resistedSwipeOffset(0)).toBe(0);
        expect(resistedSwipeOffset(20)).toBeGreaterThan(15);
        expect(resistedSwipeOffset(80)).toBeGreaterThan(resistedSwipeOffset(40));
        expect(resistedSwipeOffset(-80)).toBe(-resistedSwipeOffset(80));
        expect(resistedSwipeOffset(10_000)).toBeLessThan(80);
    });

    test('dismisses deliberate distance swipes and short fast flicks', () => {
        expect(shouldDismissSwipe(34, 500)).toBe(true);
        expect(shouldDismissSwipe(18, 80)).toBe(true);
        expect(shouldDismissSwipe(18, 500)).toBe(false);
        expect(shouldDismissSwipe(4, 10)).toBe(false);
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
            pillHeight: 67,
            pillWidth: 148,
            pillX: 202,
            rootHeight: 140
        });
    });

    test('uses real collapsed dimensions instead of transform scaling', () => {
        const geometry = resolveToastGeometry({
            alignment: 'right',
            baseHeight: 40,
            blur: 9,
            canvasWidth: 350,
            expandedHeight: 140,
            hasDescription: true,
            open: false,
            pillWidth: 148
        });

        expect(geometry.pillHeight).toBe(40);
        expect(geometry.bodyHeight).toBe(0);
        expect(geometry.rootHeight).toBe(40);
    });
});
