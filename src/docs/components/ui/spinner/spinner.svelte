<script
    module
    lang="ts"
>
    import type { Snippet } from 'svelte';
    import type { SVGAttributes } from 'svelte/elements';

    export type SpinnerProps = Omit<SVGAttributes<SVGSVGElement>, 'children' | 'height' | 'width'> & {
        absoluteStrokeWidth?: boolean;
        children?: Snippet;
        height?: number | string;
        ref?: SVGSVGElement | null;
        size?: number | string;
        strokeWidth?: number | string;
        width?: number | string;
    };
</script>

<script lang="ts">
    import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon';
    import HugeiconsIcon from '$docs/hugeicons-icon.svelte';
    import { cn } from '$docs/utils.js';

    let {
        absoluteStrokeWidth = false,
        'aria-label': ariaLabel = 'Loading',
        children,
        class: className,
        fill = 'none',
        size = 24,
        height = size,
        ref = $bindable(null),
        role = 'status',
        stroke = 'currentColor',
        'stroke-linecap': strokeLinecap = 'round',
        'stroke-linejoin': strokeLinejoin = 'round',
        'stroke-width': nativeStrokeWidth,
        strokeWidth = 2,
        viewBox = '0 0 24 24',
        width = size,
        ...props
    }: SpinnerProps = $props();

    const classes = $derived(cn('animate-spin', className));
    const requestedStrokeWidth = $derived(nativeStrokeWidth ?? strokeWidth);
    const computedStrokeWidth = $derived(
        absoluteStrokeWidth ? (Number(requestedStrokeWidth) * 24) / Number(size) : requestedStrokeWidth
    );
</script>

<HugeiconsIcon
    {...props}
    aria-label={ariaLabel}
    bind:ref
    class={classes}
    {fill}
    {height}
    icon={Loading02Icon}
    {role}
    {size}
    {stroke}
    stroke-linecap={strokeLinecap}
    stroke-linejoin={strokeLinejoin}
    strokeWidth={Number(computedStrokeWidth)}
    {viewBox}
    {width}
>
    {@render children?.()}
</HugeiconsIcon>
