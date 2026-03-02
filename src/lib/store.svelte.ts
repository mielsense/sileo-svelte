import type { SileoOptions, SileoPosition, SileoState } from './types.js';

/* -------------------------------- Constants ------------------------------- */

const DEFAULT_DURATION = 6000;
const EXIT_DURATION = DEFAULT_DURATION * 0.1;
const COLLAPSE_DURATION = 650;
const AUTO_EXPAND_RATIO = 0.025;
const AUTO_COLLAPSE_RATIO = 0.65;

/* ---------------------------------- Types --------------------------------- */

export interface InternalSileoOptions extends SileoOptions {
    id?: string;
    state?: SileoState;
}

export interface SileoItem extends InternalSileoOptions {
    id: string;
    instanceId: string;
    closing?: boolean;
    exiting?: boolean;
    autoExpandDelayMs?: number;
    autoCollapseDelayMs?: number;
}

export type SileoOffsetValue = number | string;
export type SileoOffsetConfig = Partial<Record<'top' | 'right' | 'bottom' | 'left', SileoOffsetValue>>;
export type SileoInput = SileoOptions | string;
export type SileoDescriptionInput = SileoOptions['description'];

/* --------------------------------- Helpers -------------------------------- */

export const pillAlign = (pos: SileoPosition) =>
    pos.includes('right') ? 'right' : pos.includes('center') ? 'center' : 'left';

export const expandDir = (pos: SileoPosition) => (pos.startsWith('top') ? ('bottom' as const) : ('top' as const));

/* ------------------------------ Global State ------------------------------ */

let idCounter = 0;
const generateId = () => `${++idCounter}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

class SileoStore {
    toasts = $state<SileoItem[]>([]);
    position = $state<SileoPosition>('top-right');
    globalOptions = $state<Partial<SileoOptions> | undefined>(undefined);

    update(fn: (prev: SileoItem[]) => SileoItem[]) {
        this.toasts = fn(this.toasts);
    }
}

export const store = new SileoStore();

export const timeoutKey = (t: SileoItem) => `${t.id}:${t.instanceId}`;

/* ------------------------------- Toast API -------------------------------- */

const dismissToast = (id: string) => {
    const item = store.toasts.find((t) => t.id === id);
    if (!item || item.exiting) return;

    store.update((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));

    setTimeout(() => store.update((prev) => prev.filter((t) => t.id !== id)), EXIT_DURATION);
};

const closeToast = (id: string) => {
    const item = store.toasts.find((t) => t.id === id);
    if (!item || item.closing || item.exiting) return;

    store.update((prev) => prev.map((t) => (t.id === id ? { ...t, closing: true } : t)));
    setTimeout(() => dismissToast(id), COLLAPSE_DURATION);
};

const mergeScopedOptions = <T extends InternalSileoOptions>(base: Partial<SileoOptions> | undefined, opts: T): T => {
    const merged = { ...base, ...opts } as T;
    if (base?.classes || opts.classes) {
        merged.classes = { ...base?.classes, ...opts.classes };
    }
    if (base?.styles || opts.styles) {
        merged.styles = { ...base?.styles, ...opts.styles };
    }
    return merged;
};

const normalizeInput = (input: SileoInput, description?: SileoDescriptionInput): SileoOptions => {
    if (typeof input === 'string') {
        return description === undefined ? { title: input } : { title: input, description };
    }
    if (description !== undefined && input.description === undefined) {
        return { ...input, description };
    }
    return input;
};

const resolveAutopilot = (
    opts: InternalSileoOptions,
    duration: number | null
): { expandDelayMs?: number; collapseDelayMs?: number } => {
    if (opts.autopilot === false || !duration || duration <= 0) return {};
    const cfg = typeof opts.autopilot === 'object' ? opts.autopilot : undefined;
    const clamp = (v: number) => Math.min(duration, Math.max(0, v));
    return {
        expandDelayMs: clamp(cfg?.expand ?? duration * AUTO_EXPAND_RATIO),
        collapseDelayMs: clamp(cfg?.collapse ?? duration * AUTO_COLLAPSE_RATIO)
    };
};

const mergeOptions = (options: InternalSileoOptions): InternalSileoOptions => ({
    ...mergeScopedOptions(store.globalOptions, options)
});

const buildSileoItem = (merged: InternalSileoOptions, id: string, fallbackPosition?: SileoPosition): SileoItem => {
    const duration = merged.duration ?? DEFAULT_DURATION;
    const auto = resolveAutopilot(merged, duration);
    return {
        ...merged,
        id,
        instanceId: generateId(),
        position: merged.position ?? fallbackPosition ?? store.position,
        autoExpandDelayMs: auto.expandDelayMs,
        autoCollapseDelayMs: auto.collapseDelayMs
    };
};

const createToast = (options: InternalSileoOptions) => {
    const live = store.toasts.filter((t) => !t.exiting);
    const merged = mergeOptions(options);

    const hasExplicitId = merged.id != null;
    const id = merged.id ?? generateId();
    const prev = hasExplicitId ? live.find((t) => t.id === id) : undefined;
    const item = buildSileoItem(merged, id, prev?.position);

    if (prev) {
        store.update((p) => p.map((t) => (t.id === id ? item : t)));
    } else {
        store.update((p) => [...p.filter((t) => t.id !== id), item]);
    }
    return { id, duration: merged.duration ?? DEFAULT_DURATION };
};

const updateToast = (id: string, options: InternalSileoOptions) => {
    const existing = store.toasts.find((t) => t.id === id);
    if (!existing) return;

    const item = buildSileoItem(mergeOptions(options), id, existing.position);
    store.update((prev) => prev.map((t) => (t.id === id ? item : t)));
};

/* ------------------------------ Promise Types ----------------------------- */

export interface SileoPromiseOptions<T = unknown> {
    id?: string;
    loading: Pick<SileoOptions, 'title' | 'icon'>;
    success: SileoOptions | ((data: T) => SileoOptions);
    error: SileoOptions | ((err: unknown) => SileoOptions);
    action?: SileoOptions | ((data: T) => SileoOptions);
    position?: SileoPosition;
}

export interface SileoScopedApi {
    show: (input: SileoInput, description?: SileoDescriptionInput) => string;
    success: (input: SileoInput, description?: SileoDescriptionInput) => string;
    error: (input: SileoInput, description?: SileoDescriptionInput) => string;
    warning: (input: SileoInput, description?: SileoDescriptionInput) => string;
    info: (input: SileoInput, description?: SileoDescriptionInput) => string;
    action: (input: SileoInput, description?: SileoDescriptionInput) => string;
    loading: (input: SileoInput, description?: SileoDescriptionInput) => string;
    promise: <T>(promise: Promise<T> | (() => Promise<T>), opts: SileoPromiseOptions<T>) => Promise<T>;
    update: (id: string, opts: SileoOptions & { state?: SileoState }) => void;
    dismiss: (id: string) => void;
    close: (id: string) => void;
    clear: (position?: SileoPosition) => void;
}

export interface SileoApi extends SileoScopedApi {
    with: (defaults: Partial<SileoOptions>) => SileoApi;
}

/* ------------------------------- Public API ------------------------------- */

const createSileoApi = (scopedDefaults?: Partial<SileoOptions>): SileoApi => {
    const withDefaults = <T extends InternalSileoOptions>(opts: T): T => mergeScopedOptions(scopedDefaults, opts);
    const createWithState = (
        state: SileoState | undefined,
        input: SileoInput,
        description?: SileoDescriptionInput
    ): string => {
        const opts = withDefaults(normalizeInput(input, description));
        return createToast(state ? { ...opts, state } : opts).id;
    };

    return {
        show: (input, description) => createWithState(undefined, input, description),
        success: (input, description) => createWithState('success', input, description),
        error: (input, description) => createWithState('error', input, description),
        warning: (input, description) => createWithState('warning', input, description),
        info: (input, description) => createWithState('info', input, description),
        action: (input, description) => createWithState('action', input, description),
        loading: (input, description) => {
            const opts = withDefaults(normalizeInput(input, description));
            return createToast({ ...opts, state: 'loading', duration: opts.duration ?? null }).id;
        },

        promise: <T>(promise: Promise<T> | (() => Promise<T>), opts: SileoPromiseOptions<T>): Promise<T> => {
            let id: string;
            const loadingOpts = withDefaults({ ...opts.loading, position: opts.position });

            if (opts.id) {
                id = opts.id;
                updateToast(id, { ...loadingOpts, state: 'loading', duration: null, id });
            } else {
                ({ id } = createToast({
                    ...loadingOpts,
                    state: 'loading',
                    duration: null
                }));
            }

            const p = typeof promise === 'function' ? promise() : promise;

            p.then((data) => {
                if (opts.action) {
                    const actionOpts = withDefaults(
                        typeof opts.action === 'function' ? opts.action(data) : opts.action
                    );
                    updateToast(id, { ...actionOpts, state: 'action', id });
                } else {
                    const successOpts = withDefaults(
                        typeof opts.success === 'function' ? opts.success(data) : opts.success
                    );
                    updateToast(id, { ...successOpts, state: 'success', id });
                }
            }).catch((err) => {
                const errorOpts = withDefaults(typeof opts.error === 'function' ? opts.error(err) : opts.error);
                updateToast(id, { ...errorOpts, state: 'error', id });
            });

            return p;
        },

        update: (id: string, opts: SileoOptions & { state?: SileoState }) => {
            updateToast(id, withDefaults(opts));
        },

        dismiss: dismissToast,
        close: closeToast,

        clear: (position?: SileoPosition) =>
            store.update((prev) => (position ? prev.filter((t) => t.position !== position) : [])),

        with: (defaults: Partial<SileoOptions>) => createSileoApi(mergeScopedOptions(scopedDefaults, defaults))
    };
};

export const sileo = createSileoApi();
