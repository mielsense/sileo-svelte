<script
    lang="ts"
    generics="Payload = unknown"
>
    import { Tooltip as TooltipPrimitive } from '@shardsui/svelte/tooltip';
    import { untrack } from 'svelte';
    import { setTooltipHandleContext } from './context.js';
    import { TooltipHandle as TooltipHandleClass } from './handle.svelte.js';
    import { getTooltipAttachmentProviderContext } from './provider-context.svelte.js';
    import type { TooltipRootProps } from './tooltip.types.js';

    let {
        children: child,
        defaultOpen,
        handle,
        onOpenChange,
        open = $bindable(),
        triggerId = $bindable(null),
        ...props
    }: TooltipRootProps<Payload> = $props();
    const resolvedHandle = untrack(() => handle ?? new TooltipHandleClass<Payload>());
    const attachmentProvider = getTooltipAttachmentProviderContext();
    resolvedHandle.attachmentProvider = attachmentProvider;
    $effect(() => () => {
        if (resolvedHandle.attachmentProvider === attachmentProvider) {
            resolvedHandle.attachmentProvider = undefined;
        }
    });
    setTooltipHandleContext(resolvedHandle);
    const initialOpen = untrack(() => defaultOpen ?? false);
    const getOpen = () => open ?? initialOpen;
    function setOpen(next: boolean) {
        onOpenChange?.(next);
        open = next;
    }
</script>

<TooltipPrimitive.Root
    bind:open={getOpen, setOpen}
    bind:triggerId
    handle={resolvedHandle}
    {...props}
>
    {#snippet children(state: { payload: Payload | undefined })}
        {@render child?.(state)}
    {/snippet}
</TooltipPrimitive.Root>
