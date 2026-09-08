import { createContext } from 'svelte';
import type { TooltipHandle } from './handle.svelte.js';

const [getHandleContext, setHandleContext] = createContext<TooltipHandle>();

export function getTooltipHandleContext<Payload = unknown>(): TooltipHandle<Payload> {
    return getHandleContext() as unknown as TooltipHandle<Payload>;
}

export function setTooltipHandleContext<Payload>(handle: TooltipHandle<Payload>): void {
    setHandleContext(handle as unknown as TooltipHandle);
}
