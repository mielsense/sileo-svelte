<script
    module
    lang="ts"
>
    import type { Select as ShardsSelect } from '@shardsui/svelte/select';
    import type { ComponentProps } from 'svelte';
    export type SelectItemProps = ComponentProps<typeof ShardsSelect.Item>;
</script>

<script lang="ts">
    import Tick02Icon from '@hugeicons/core-free-icons/Tick02Icon';
    import { Select as S } from '@shardsui/svelte/select';
    import HugeiconsIcon from '$docs/hugeicons-icon.svelte';
    import { getSelectionChangeContext } from '$docs/selection-change-context.js';
    import { cn } from '$docs/utils.js';

    let { children: child, class: className, onclick, ref = $bindable(null), ...props }: SelectItemProps = $props();
    const change = getSelectionChangeContext();

    function handleClick(event: Parameters<NonNullable<SelectItemProps['onclick']>>[0]): void {
        change?.prepare('item-press', event);
        onclick?.(event);
    }
</script>

<S.Item
    bind:ref
    class={cn(
        "grid min-h-8 in-data-[side=none]:min-w-[calc(var(--anchor-width)+1.25rem)] cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-sm py-1 ps-2 pe-4 text-base outline-none data-disabled:pointer-events-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:opacity-64 sm:min-h-7 sm:text-sm [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
    )}
    data-slot="select-item"
    onclick={handleClick}
    {...props}
    >{#snippet children(state: Parameters<NonNullable<SelectItemProps['children']>>[0])}
        <S.ItemIndicator class="col-start-1"
            ><HugeiconsIcon
                aria-hidden="true"
                icon={Tick02Icon}
                strokeWidth={2}
            /></S.ItemIndicator
        >
        <div class="col-start-2 min-w-0">{@render child?.(state)}</div>
    {/snippet}</S.Item
>
