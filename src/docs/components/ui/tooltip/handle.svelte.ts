import { Tooltip as TooltipPrimitive } from '@shardsui/svelte/tooltip';
import type { TooltipAttachmentProviderContext } from './provider-context.svelte.js';

export class TooltipHandle<Payload = unknown> extends TooltipPrimitive.Handle<Payload> {
    attachmentProvider: TooltipAttachmentProviderContext | undefined;
    popupId = $state<string | undefined>(undefined);
}

export function createTooltipHandle<Payload = unknown>(): TooltipHandle<Payload> {
    return new TooltipHandle<Payload>();
}
