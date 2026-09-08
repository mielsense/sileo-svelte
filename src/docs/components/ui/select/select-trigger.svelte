<script
    module
    lang="ts"
>
    import type { Select as ShardsSelect } from '@shardsui/svelte/select';
    import type { ComponentProps } from 'svelte';
    export type SelectTriggerSize = 'sm' | 'default' | 'lg';
    export type SelectTriggerProps = ComponentProps<typeof ShardsSelect.Trigger> & {
        size?: SelectTriggerSize;
    };
    export const selectTriggerClass =
        "relative inline-flex min-h-9 w-full min-w-36 select-none items-center justify-between gap-2 rounded-lg border border-input bg-background not-dark:bg-clip-padding px-[calc(--spacing(3)-1px)] text-left text-base text-foreground shadow-xs/5 outline-none ring-ring/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-data-disabled:not-focus-visible:not-aria-invalid:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 focus-visible:border-ring focus-visible:ring-[3px] aria-invalid:border-destructive/36 focus-visible:aria-invalid:border-destructive/64 focus-visible:aria-invalid:ring-destructive/16 data-disabled:pointer-events-none data-disabled:opacity-64 sm:min-h-8 sm:text-sm dark:bg-input/32 dark:aria-invalid:ring-destructive/24 dark:not-data-disabled:not-focus-visible:not-aria-invalid:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/6%)] [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [[data-disabled],:focus-visible,[aria-invalid],[data-pressed]]:shadow-none";
    export const selectTriggerIconClassName = '-me-1 size-4.5 opacity-80 sm:size-4';
</script>

<script lang="ts">
    import UnfoldMoreIcon from '@hugeicons/core-free-icons/UnfoldMoreIcon';
    import { Select as S } from '@shardsui/svelte/select';
    import HugeiconsIcon from '$docs/hugeicons-icon.svelte';
    import { getSelectionChangeContext } from '$docs/selection-change-context.js';
    import { cn } from '$docs/utils.js';
    import { getSelectWrapperContext } from './context.svelte.js';

    let {
        children: child,
        class: className,
        onclick,
        ref = $bindable(null),
        size = 'default',
        ...props
    }: SelectTriggerProps = $props();
    const context = getSelectWrapperContext();
    const change = getSelectionChangeContext();

    function setRef(el: HTMLElement | null) {
        ref = el;
        context.triggerRef = el;
    }

    function handleClick(event: Parameters<NonNullable<SelectTriggerProps['onclick']>>[0]): void {
        change?.prepare('trigger-press', event);
        onclick?.(event);
    }
</script>

<S.Trigger
    aria-label={context.ariaLabel}
    bind:ref={() => ref, setRef}
    class={cn(
        selectTriggerClass,
        size === 'lg' && 'min-h-10 sm:min-h-9',
        size === 'sm' && 'min-h-8 gap-1.5 px-[calc(--spacing(2.5)-1px)] sm:min-h-7',
        className
    )}
    data-slot="select-trigger"
    onclick={handleClick}
    {...props}
    >{#snippet children(state: Parameters<NonNullable<SelectTriggerProps['children']>>[0])}
        {@render child?.(state)}
        <S.Icon data-slot="select-icon"
            ><HugeiconsIcon
                aria-hidden="true"
                class={selectTriggerIconClassName}
                icon={UnfoldMoreIcon}
                strokeWidth={2}
            /></S.Icon
        >
    {/snippet}</S.Trigger
>
