import { animate } from 'motion';
import { prefersReducedMotion } from 'svelte/motion';
import type { ToastGeometry } from './geometry.js';
import { MotionRegistry, quickTransition, readMotionDuration, springTransition } from './motion.js';

interface ToastMotionElements {
    root?: HTMLDivElement;
    pill?: SVGRectElement;
    body?: SVGRectElement;
    header?: HTMLElement;
    content?: HTMLDivElement;
}

interface ToastMotionOptions {
    elements: () => ToastMotionElements;
    geometry: () => ToastGeometry;
    open: () => boolean;
    exiting: () => boolean;
    edge: () => 'top' | 'bottom';
    baseHeight: () => number;
    pendingKey: () => string | undefined;
    hasPending: () => boolean;
    commitPending: (key?: string) => void;
    headerKeys: () => { current: string; previous?: string };
    clearPreviousHeader: (previous: string, current: string) => void;
}

export function createToastMotion(options: ToastMotionOptions) {
    const controls = new MotionRegistry();
    let ready = $state(false);
    let duration = $state(0.6);
    let renderedGeometry: ToastGeometry | null = null;

    const transition = (reduced: boolean, delay = 0) => springTransition(reduced, delay, duration);
    const entryMargin = () => `${-(options.baseHeight() + 12)}px`;

    function attachToast(node: HTMLDivElement) {
        const reduced = prefersReducedMotion.current;
        const offset = options.edge() === 'bottom' ? -6 : 6;
        const margin = entryMargin();
        duration = readMotionDuration(node);
        const keyframes =
            options.edge() === 'bottom'
                ? reduced
                    ? { opacity: [0, 1], marginBottom: [margin, '0px'] }
                    : { opacity: [0, 1], y: [offset, 0], scale: [0.95, 1], marginBottom: [margin, '0px'] }
                : reduced
                  ? { opacity: [0, 1], marginTop: [margin, '0px'] }
                  : { opacity: [0, 1], y: [offset, 0], scale: [0.95, 1], marginTop: [margin, '0px'] };

        ready = true;
        controls.start('presence', () => animate(node, keyframes, quickTransition(reduced, duration * 0.66)));
        return () => controls.stopAll();
    }

    $effect(() => {
        const { root } = options.elements();
        const reduced = prefersReducedMotion.current;
        if (!root || !ready || !options.exiting()) return;

        const offset = options.edge() === 'bottom' ? -6 : 6;
        const margin = entryMargin();
        const keyframes =
            options.edge() === 'bottom'
                ? reduced
                    ? { opacity: 0, marginBottom: margin }
                    : { opacity: 0, y: offset, scale: 0.95, marginBottom: margin }
                : reduced
                  ? { opacity: 0, marginTop: margin }
                  : { opacity: 0, y: offset, scale: 0.95, marginTop: margin };

        controls.start('presence', () => animate(root, keyframes, quickTransition(reduced, duration * 0.66)));
    });

    $effect(() => {
        const { root } = options.elements();
        const target = options.geometry().rootHeight;
        const pendingKey = options.pendingKey();
        const reduced = prefersReducedMotion.current;
        if (!root || !ready) return;

        const control = controls.start('layout', () => animate(root, { height: target }, transition(reduced)));
        if (!options.open() && options.hasPending()) {
            void control.finished.then(
                () => options.commitPending(pendingKey),
                () => undefined
            );
        }
    });

    $effect(() => {
        const { pill, body } = options.elements();
        const target = options.geometry();
        const targetOpen = options.open();
        const reduced = prefersReducedMotion.current;
        const previous = renderedGeometry ?? target;

        renderedGeometry = target;
        if (!pill || !body || !ready) return;

        controls.start('pill', () =>
            animate(
                pill,
                {
                    attrX: [previous.pillX, target.pillX],
                    height: [previous.pillHeight, target.pillHeight],
                    width: [previous.pillWidth, target.pillWidth]
                },
                transition(reduced, targetOpen ? duration * 0.08 : 0)
            )
        );
        controls.start('body', () =>
            animate(
                body,
                {
                    height: [previous.bodyHeight, target.bodyHeight],
                    opacity: targetOpen ? 1 : 0
                },
                transition(reduced)
            )
        );
    });

    $effect(() => {
        const { header, content } = options.elements();
        const geometry = options.geometry();
        const open = options.open();
        const reduced = prefersReducedMotion.current;
        if (!header || !ready) return;

        controls.start('header-layout', () =>
            animate(
                header,
                {
                    left: geometry.pillX,
                    maxWidth: geometry.pillWidth,
                    scale: open ? 0.9 : 1,
                    y: open ? (options.edge() === 'bottom' ? 3 : -3) : 0
                },
                transition(reduced)
            )
        );

        if (content) {
            controls.start('content', () =>
                animate(
                    content,
                    { opacity: open ? 1 : 0 },
                    quickTransition(
                        reduced,
                        open ? duration * 0.4 : duration * 0.08,
                        open ? duration * 0.25 : duration * 0.04
                    )
                )
            );
        }
    });

    $effect(() => {
        const { current: currentKey, previous: previousKey } = options.headerKeys();
        const { root, header } = options.elements();
        const reduced = prefersReducedMotion.current;
        if (!header || !ready) return;

        const current = header.querySelector<HTMLElement>('[data-sileo-header-inner][data-layer="current"]');
        const previous = header.querySelector<HTMLElement>('[data-sileo-header-inner][data-layer="prev"]');

        if (current) {
            controls.start('header-current', () =>
                animate(
                    current,
                    reduced ? { opacity: [0, 1] } : { opacity: [0, 1], filter: ['blur(6px)', 'blur(0px)'] },
                    quickTransition(reduced, duration * 0.5)
                )
            );
        }

        if (previous && previousKey) {
            const control = controls.start('header-previous', () =>
                animate(
                    previous,
                    reduced ? { opacity: 0 } : { opacity: 0, filter: 'blur(6px)' },
                    quickTransition(reduced, duration * 0.5)
                )
            );
            void control.finished.then(
                () => options.clearPreviousHeader(previousKey, currentKey),
                () => undefined
            );
        }

        const loaders = root?.querySelectorAll<SVGElement>('[data-sileo-icon="spin"]');
        if (!loaders?.length || reduced) {
            controls.stop('loader');
        } else {
            controls.start('loader', () =>
                animate(loaders, { rotate: 360 }, { duration: 1, ease: 'linear', repeat: Infinity })
            );
        }
    });

    return {
        get ready() {
            return ready;
        },
        attachToast,
        moveForSwipe(node: HTMLElement, y: number) {
            controls.start('swipe', () => animate(node, { y }, { duration: 0 }));
        },
        resetSwipe(node: HTMLElement) {
            controls.start('swipe', () => animate(node, { y: 0 }, transition(prefersReducedMotion.current)));
        },
        stopSwipe() {
            controls.stop('swipe');
        }
    };
}
