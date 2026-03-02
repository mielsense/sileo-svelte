import type { SileoInput, SileoPosition, SileoState, SileoToastOptions } from './types.js';

const DEFAULT_DURATION = 5000;

export interface SileoToast extends SileoToastOptions {
    id: string;
    createdAt: number;
    state: SileoState;
    duration: number | null;
    position: SileoPosition;
    closeable: boolean;
    expanded: boolean;
    exiting?: boolean;
}

export interface SileoPromiseOptions<T> {
    id?: string;
    loading: SileoInput;
    success: SileoInput | ((value: T) => SileoInput);
    error: SileoInput | ((reason: unknown) => SileoInput);
    position?: SileoPosition;
}

class SileoToastStore {
    toasts = $state<SileoToast[]>([]);
    position = $state<SileoPosition>('top-right');
    defaults = $state<Partial<SileoToastOptions>>({});

    setToasts(next: SileoToast[]) {
        this.toasts = next;
    }
}

const store = new SileoToastStore();

let idCount = 0;
const uid = () => `sileo-${++idCount}-${Date.now().toString(36)}`;

const normalize = (input: SileoInput): SileoToastOptions => (typeof input === 'string' ? { title: input } : input);

const mergeOptions = (opts: SileoToastOptions): SileoToast => {
    const merged = {
        ...store.defaults,
        ...opts,
        classNames: {
            ...store.defaults.classNames,
            ...opts.classNames
        },
        styles: {
            ...store.defaults.styles,
            ...opts.styles
        }
    };

    const id = merged.id ?? uid();

    return {
        ...merged,
        id,
        title: merged.title ?? '',
        state: merged.state ?? 'default',
        position: merged.position ?? store.position,
        duration: merged.duration ?? DEFAULT_DURATION,
        closeable: merged.closeable ?? true,
        expanded: merged.expanded ?? false,
        createdAt: Date.now()
    };
};

const upsert = (opts: SileoToastOptions) => {
    const next = mergeOptions(opts);
    const exists = store.toasts.some((toast) => toast.id === next.id);
    store.setToasts(
        exists
            ? store.toasts.map((toast) => (toast.id === next.id ? { ...toast, ...next } : toast))
            : [...store.toasts, next]
    );
    return next.id;
};

export interface SileoApi {
    show: (input: SileoInput) => string;
    success: (input: SileoInput) => string;
    error: (input: SileoInput) => string;
    warning: (input: SileoInput) => string;
    info: (input: SileoInput) => string;
    loading: (input: SileoInput) => string;
    update: (id: string, patch: SileoToastOptions) => void;
    dismiss: (id: string) => void;
    clear: (position?: SileoPosition) => void;
    promise: <T>(promise: Promise<T> | (() => Promise<T>), opts: SileoPromiseOptions<T>) => Promise<T>;
    withDefaults: (defaults: Partial<SileoToastOptions>) => SileoApi;
}

const scopedApi = (scoped: Partial<SileoToastOptions> = {}): SileoApi => {
    const withScope = (input: SileoInput, state?: SileoState) => {
        const normalized = normalize(input);
        return upsert({ ...scoped, ...normalized, state: state ?? normalized.state });
    };

    return {
        show: (input) => withScope(input),
        success: (input) => withScope(input, 'success'),
        error: (input) => withScope(input, 'error'),
        warning: (input) => withScope(input, 'warning'),
        info: (input) => withScope(input, 'info'),
        loading: (input) => withScope({ ...normalize(input), duration: null }, 'loading'),
        update: (id, patch) => {
            const current = store.toasts.find((toast) => toast.id === id);
            if (!current) return;
            upsert({ ...current, ...scoped, ...patch, id });
        },
        dismiss: (id) => {
            store.setToasts(store.toasts.map((toast) => (toast.id === id ? { ...toast, exiting: true } : toast)));
        },
        clear: (position) => {
            store.setToasts(position ? store.toasts.filter((toast) => toast.position !== position) : []);
        },
        promise: async <T>(promise: Promise<T> | (() => Promise<T>), opts: SileoPromiseOptions<T>) => {
            const id =
                opts.id ??
                withScope({ ...normalize(opts.loading), position: opts.position, duration: null }, 'loading');
            try {
                const result = await (typeof promise === 'function' ? promise() : promise);
                const success = typeof opts.success === 'function' ? opts.success(result) : opts.success;
                upsert({
                    ...scoped,
                    ...normalize(success),
                    id,
                    position: opts.position,
                    state: normalize(success).state ?? 'success'
                });
                return result;
            } catch (error) {
                const failure = typeof opts.error === 'function' ? opts.error(error) : opts.error;
                upsert({
                    ...scoped,
                    ...normalize(failure),
                    id,
                    position: opts.position,
                    state: normalize(failure).state ?? 'error'
                });
                throw error;
            }
        },
        withDefaults: (defaults) => scopedApi({ ...scoped, ...defaults })
    };
};

export const sileo = scopedApi();
export { store };
