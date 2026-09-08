<script
    module
    lang="ts"
>
    import type { Snippet } from 'svelte';
    import type { HTMLButtonAttributes } from 'svelte/elements';
    export type SelectButtonProps = Omit<HTMLButtonAttributes, 'children'> & {
        children?: Snippet;
        ref?: HTMLButtonElement | null;
        size?: 'sm' | 'default' | 'lg';
    };
</script>

<script lang="ts">
    import UnfoldMoreIcon from '@hugeicons/core-free-icons/UnfoldMoreIcon';
    import HugeiconsIcon from '$docs/hugeicons-icon.svelte';
    import { cn } from '$docs/utils.js';
    import { selectTriggerClass, selectTriggerIconClassName } from './select-trigger.svelte';

    let {
        children,
        class: className,
        ref = $bindable(null),
        size = 'default',
        type = 'button',
        ...props
    }: SelectButtonProps = $props();
</script>

<button
    bind:this={ref}
    class={cn(
        selectTriggerClass,
        'min-w-0',
        size === 'lg' && 'min-h-10 sm:min-h-9',
        size === 'sm' && 'min-h-8 gap-1.5 px-[calc(--spacing(2.5)-1px)] sm:min-h-7',
        className
    )}
    data-slot="select-button"
    {type}
    {...props}
>
    <span class="flex-1 truncate in-data-placeholder:text-muted-foreground/72">{@render children?.()}</span
    ><HugeiconsIcon
        aria-hidden="true"
        class={selectTriggerIconClassName}
        icon={UnfoldMoreIcon}
        strokeWidth={2}
    />
</button>
