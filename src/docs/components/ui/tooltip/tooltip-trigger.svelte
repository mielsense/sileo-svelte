<script
    lang="ts"
    generics="Payload = unknown"
>
    import { Tooltip as TooltipPrimitive } from '@shardsui/svelte/tooltip';
    import { untrack } from 'svelte';
    import { getTooltipHandleContext } from './context.js';
    import type { TooltipTriggerProps } from './tooltip.types.js';

    let {
        'aria-describedby': ariaDescribedby,
        children: child,
        handle,
        ref = $bindable(null),
        ...props
    }: TooltipTriggerProps<Payload> = $props();
    const resolvedHandle = untrack(() => handle ?? getTooltipHandleContext<Payload>());
    const descriptionId = $derived(ariaDescribedby ?? resolvedHandle.popupId);
</script>

<TooltipPrimitive.Trigger
    aria-describedby={descriptionId}
    bind:ref
    data-slot="tooltip-trigger"
    handle={resolvedHandle}
    {...props}
>
    {#snippet children(state: { open: boolean })}
        {@render child?.(state)}
    {/snippet}
</TooltipPrimitive.Trigger>
