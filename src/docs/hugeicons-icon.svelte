<script
    module
    lang="ts"
>
    import type { Snippet } from 'svelte';
    import type { SVGAttributes } from 'svelte/elements';

    export type HugeiconData = readonly (readonly [string, Readonly<Record<string, string | number>>])[];

    export type HugeiconsIconProps = Omit<SVGAttributes<SVGSVGElement>, 'children' | 'height' | 'width'> & {
        absoluteStrokeWidth?: boolean;
        children?: Snippet;
        height?: number | string | null;
        icon: HugeiconData;
        ref?: SVGSVGElement | null;
        size?: number | string;
        strokeWidth?: number | string | null;
        width?: number | string | null;
    };

    type SafeNodeTag = 'circle' | 'ellipse' | 'path' | 'rect';
    type RenderNode = {
        attributes: Record<string, string | number>;
        tag: SafeNodeTag;
    };
</script>

<script lang="ts">
    import { cn } from '$docs/utils.js';

    let {
        absoluteStrokeWidth = false,
        children,
        class: className,
        color = 'currentColor',
        fill,
        height,
        icon,
        ref = $bindable(null),
        size = 24,
        stroke,
        'stroke-linecap': strokeLinecap,
        'stroke-linejoin': strokeLinejoin,
        'stroke-width': nativeStrokeWidth,
        strokeWidth,
        viewBox = '0 0 24 24',
        width,
        ...props
    }: HugeiconsIconProps = $props();

    const resolvedHeight = $derived(height ?? size);
    const resolvedWidth = $derived(width ?? size);
    const resolvedFill = $derived(fill ?? 'none');
    const requestedStrokeWidth = $derived(nativeStrokeWidth ?? strokeWidth);
    const resolvedStrokeWidth = $derived(
        requestedStrokeWidth === undefined || requestedStrokeWidth === null
            ? undefined
            : absoluteStrokeWidth
              ? (Number(requestedStrokeWidth) * 24) / Number(size)
              : requestedStrokeWidth
    );

    function kebabCase(attribute: string): string {
        return attribute.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    }

    function isSafeNodeTag(tag: string): tag is SafeNodeTag {
        return tag === 'circle' || tag === 'ellipse' || tag === 'path' || tag === 'rect';
    }

    function renderNodes(
        data: HugeiconData,
        consumerFill: typeof fill,
        consumerStroke: typeof stroke,
        consumerStrokeLinecap: typeof strokeLinecap,
        consumerStrokeLinejoin: typeof strokeLinejoin,
        consumerStrokeWidth: typeof resolvedStrokeWidth
    ): RenderNode[] {
        const nodes: RenderNode[] = [];

        for (const [tag, sourceAttributes] of data) {
            if (!isSafeNodeTag(tag)) continue;

            const attributes: Record<string, string | number> = {};
            for (const [attribute, value] of Object.entries(sourceAttributes)) {
                if (attribute === 'key') continue;
                attributes[kebabCase(attribute)] = value;
            }

            if (consumerFill !== undefined && consumerFill !== null) attributes.fill = consumerFill;
            if (consumerStroke !== undefined && consumerStroke !== null) attributes.stroke = consumerStroke;
            if (consumerStrokeLinecap !== undefined && consumerStrokeLinecap !== null) {
                attributes['stroke-linecap'] = consumerStrokeLinecap;
            }
            if (consumerStrokeLinejoin !== undefined && consumerStrokeLinejoin !== null) {
                attributes['stroke-linejoin'] = consumerStrokeLinejoin;
            }
            if (consumerStrokeWidth !== undefined) attributes['stroke-width'] = consumerStrokeWidth;

            nodes.push({ attributes, tag });
        }

        return nodes;
    }

    const nodes = $derived(renderNodes(icon, fill, stroke, strokeLinecap, strokeLinejoin, resolvedStrokeWidth));
</script>

<!-- biome-ignore lint/a11y/noSvgWithoutTitle: Icon callers deliberately choose decorative or named semantics. -->
<svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={resolvedWidth}
    height={resolvedHeight}
    {viewBox}
    fill={resolvedFill}
    {color}
    {stroke}
    stroke-linecap={strokeLinecap}
    stroke-linejoin={strokeLinejoin}
    stroke-width={resolvedStrokeWidth}
    class={cn(className)}
    bind:this={ref}
>
    {#each nodes as node, index (index)}
        {#if node.tag === 'path'}
            <path {...node.attributes}></path>
        {:else if node.tag === 'circle'}
            <circle {...node.attributes}></circle>
        {:else if node.tag === 'ellipse'}
            <ellipse {...node.attributes}></ellipse>
        {:else if node.tag === 'rect'}
            <rect {...node.attributes}></rect>
        {/if}
    {/each}
    {@render children?.()}
</svg>
