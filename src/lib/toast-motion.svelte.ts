import { animate } from 'motion';
import { untrack } from 'svelte';
import { prefersReducedMotion } from 'svelte/motion';
import type { ToastGeometry } from './geometry.js';
import { easeTransition, MotionRegistry, readMotionDuration, springTransition } from './motion.js';

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
    clearPreviousHeader: (previous: string, current: string) => void;
}

export function createToastMotion(options: ToastMotionOptions) {
    const controls = new MotionRegistry();
    let ready = $state(false);
    let duration = $state(0.6);
    let renderedGeometry: ToastGeometry | null = null;

    const transition = (reduced: boolean, delay = 0, bounce = 0.25) =>
        springTransition(reduced, delay, duration, bounce);
    function attachToast(node: HTMLDivElement) {
        const reduced = untrack(() => prefersReducedMotion.current);
        const edge = untrack(options.edge);
        const offset = edge === 'bottom' ? -6 : 6;
        const margin = `${-(untrack(options.baseHeight) + 12)}px`;
        duration = readMotionDuration(node);
        const keyframes =
            edge === 'bottom'
                ? reduced
                    ? { opacity: [0, 1], marginBottom: [margin, '0px'] }
                    : { opacity: [0, 1], y: [offset, 0], scale: [0.95, 1], marginBottom: [margin, '0px'] }
                : reduced
                  ? { opacity: [0, 1], marginTop: [margin, '0px'] }
                  : { opacity: [0, 1], y: [offset, 0], scale: [0.95, 1], marginTop: [margin, '0px'] };

        ready = true;
        controls.start('presence', () => animate(node, keyframes, springTransition(reduced, 0, duration * 0.66)));
        return () => controls.stopAll();
    }

    $effect(() => {
        const { root } = options.elements();
        const reduced = prefersReducedMotion.current;
        if (!root || !ready || !options.exiting()) return;

        const offset = options.edge() === 'bottom' ? -6 : 6;
        const keyframes =
            options.edge() === 'bottom'
                ? reduced
                    ? { opacity: 0 }
                    : { opacity: 0, y: offset, scale: 0.95 }
                : reduced
                  ? { opacity: 0 }
                  : { opacity: 0, y: offset, scale: 0.95 };

        controls.start('presence', () => animate(root, keyframes, springTransition(reduced, 0, duration * 0.66)));
    });

    $effect(() => {
        const { root } = options.elements();
        const target = options.geometry().rootHeight;
        const reduced = prefersReducedMotion.current;
        if (!root || !ready) return;

        controls.start('layout', () => animate(root, { height: target }, transition(reduced)));
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
                transition(reduced)
            )
        );
        controls.start('body', () =>
            animate(
                body,
                {
                    height: [previous.bodyHeight, target.bodyHeight],
                    opacity: targetOpen ? 1 : 0
                },
                transition(reduced, 0, targetOpen ? 0.25 : 0)
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
                    easeTransition(
                        reduced,
                        open ? duration * 0.6 : duration * 0.08,
                        open ? duration * 0.3 : duration * 0.04
                    )
                )
            );
        }
    });

    function headerDuration(node: HTMLElement) {
        return readMotionDuration(node.closest('[data-sileo-toast]') ?? node, duration);
    }

    function animateLoaders(node: HTMLElement, reduced: boolean) {
        const loaders = node.querySelectorAll<SVGElement>('[data-sileo-icon="spin"]');
        return loaders.length && !reduced
            ? animate(loaders, { rotate: 360 }, { duration: 1, ease: 'linear', repeat: Infinity })
            : null;
    }

    function attachHeaderCurrent(node: HTMLElement) {
        const reduced = untrack(() => prefersReducedMotion.current);
        const localDuration = headerDuration(node);
        const control = animate(
            node,
            reduced ? { opacity: [0, 1] } : { opacity: [0, 1], filter: ['blur(6px)', 'blur(0px)'] },
            springTransition(reduced, 0, localDuration)
        );
        const loader = animateLoaders(node, reduced);
        void control.finished.then(
            () => {
                node.style.opacity = '1';
                node.style.filter = 'blur(0px)';
            },
            () => undefined
        );

        return () => {
            control.stop();
            loader?.stop();
        };
    }

    function attachHeaderPrevious(node: HTMLElement, previousKey: string, currentKey: string) {
        const reduced = untrack(() => prefersReducedMotion.current);
        const localDuration = headerDuration(node);
        const control = animate(
            node,
            reduced ? { opacity: 0 } : { opacity: 0, filter: 'blur(6px)' },
            easeTransition(reduced, localDuration * 0.7)
        );
        const loader = animateLoaders(node, reduced);

        void control.finished.then(
            () => options.clearPreviousHeader(previousKey, currentKey),
            () => undefined
        );

        return () => {
            control.stop();
            loader?.stop();
        };
    }

    return {
        get ready() {
            return ready;
        },
        attachToast,
        attachHeaderCurrent,
        attachHeaderPrevious,
        moveForSwipe(node: HTMLElement, y: number) {
            controls.start('swipe', () => animate(node, { y }, { duration: 0 }));
        },
        resetSwipe(node: HTMLElement) {
            controls.start('swipe', () => animate(node, { y: 0 }, { duration: 0 }));
        },
        stopSwipe() {
            controls.stop('swipe');
        }
    };
}
