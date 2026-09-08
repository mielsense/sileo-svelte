import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';
import type { TooltipHandle } from './handle.svelte.js';

export type TooltipTriggerState = {
    open: boolean;
};

export type TooltipRootState<Payload> = {
    payload: Payload | undefined;
};

export type TooltipRootProps<Payload = unknown> = {
    children?: Snippet<[TooltipRootState<Payload>]>;
    defaultOpen?: boolean;
    disableHoverablePopup?: boolean;
    disabled?: boolean;
    handle?: TooltipHandle<Payload>;
    onOpenChange?: (open: boolean) => void;
    onOpenChangeComplete?: (open: boolean) => void;
    open?: boolean | undefined;
    trackCursorAxis?: 'none' | 'x' | 'y' | 'both';
    triggerId?: string | null;
};

export type TooltipTriggerProps<Payload = unknown> = Omit<HTMLButtonAttributes, 'children' | 'id'> & {
    as?: keyof HTMLElementTagNameMap;
    children?: Snippet<[TooltipTriggerState]>;
    closeDelay?: number;
    closeOnClick?: boolean;
    delay?: number;
    disabled?: boolean;
    handle?: TooltipHandle<Payload>;
    id?: string;
    payload?: Payload;
    ref?: HTMLElement | null;
};
