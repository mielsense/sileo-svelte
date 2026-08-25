import type { animate } from 'motion';

export type MotionControl = ReturnType<typeof animate>;

export class MotionRegistry {
    readonly #controls = new Map<string, MotionControl>();

    start(key: string, create: () => MotionControl): MotionControl {
        this.stop(key);

        const control = create();
        this.#controls.set(key, control);

        const release = () => {
            if (this.#controls.get(key) === control) this.#controls.delete(key);
        };
        void control.finished.then(release, release);

        return control;
    }

    stop(key: string) {
        const control = this.#controls.get(key);
        if (!control) return;

        this.#controls.delete(key);
        control.stop();
    }

    stopAll() {
        for (const control of this.#controls.values()) control.stop();
        this.#controls.clear();
    }
}

export function readMotionDuration(node: Element, fallback = 0.6) {
    const computed = getComputedStyle(node).getPropertyValue('--sileo-duration');
    const inline = (node as HTMLElement | SVGElement).style?.getPropertyValue('--sileo-duration');
    const value = (computed || inline || '').trim();
    if (!value) return fallback;

    const amount = Number.parseFloat(value);
    if (!Number.isFinite(amount) || amount < 0) return fallback;
    if (value.endsWith('ms')) return amount / 1000;
    if (value.endsWith('s')) return amount;
    return fallback;
}

export const springTransition = (reduced: boolean, delay = 0, duration = 0.6, bounce = 0.25) =>
    reduced ? ({ duration: 0, delay: 0 } as const) : ({ type: 'spring', duration, bounce, delay } as const);

export const easeTransition = (reduced: boolean, duration = 0.2, delay = 0) =>
    reduced
        ? ({ duration: 0, delay: 0 } as const)
        : ({ type: 'tween', duration, delay, ease: [0.25, 0.1, 0.25, 1] } as const);
