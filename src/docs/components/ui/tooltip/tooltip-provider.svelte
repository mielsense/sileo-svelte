<script
    module
    lang="ts"
>
    import type { Tooltip as ShardsTooltip } from '@shardsui/svelte/tooltip';
    import type { ComponentProps } from 'svelte';
    export type TooltipProviderProps = ComponentProps<typeof ShardsTooltip.Provider>;
</script>

<script lang="ts">
    import { Tooltip as TooltipPrimitive } from '@shardsui/svelte/tooltip';
    import {
        createTooltipAttachmentProviderContext,
        setTooltipAttachmentProviderContext
    } from './provider-context.svelte.js';

    let { children: child, closeDelay, delay, timeout = 400, ...props }: TooltipProviderProps = $props();
    const attachmentProvider = createTooltipAttachmentProviderContext(() => ({
        closeDelay,
        delay,
        timeout
    }));
    setTooltipAttachmentProviderContext(attachmentProvider);
    const primitiveProviderProps = $derived({
        ...props,
        ...(closeDelay === undefined ? {} : { closeDelay }),
        ...(delay === undefined ? {} : { delay }),
        timeout
    });
    $effect(() => attachmentProvider.destroy);
</script>

<TooltipPrimitive.Provider {...primitiveProviderProps}>{@render child?.()}</TooltipPrimitive.Provider>
