import { createContext } from 'svelte';

export interface SelectWrapperContext {
    readonly ariaLabel: string | undefined;
    readonly open: boolean;
    readonly value: unknown;
    triggerRef: HTMLElement | null;
}

export const [getSelectWrapperContext, setSelectWrapperContext] = createContext<SelectWrapperContext>();
