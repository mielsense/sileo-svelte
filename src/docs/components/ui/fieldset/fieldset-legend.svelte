<script
    module
    lang="ts"
>
    import type { Fieldset as FieldsetPrimitive } from '@shardsui/svelte/fieldset';
    import type { ComponentProps } from 'svelte';

    export type FieldsetLegendProps = ComponentProps<typeof FieldsetPrimitive.Legend>;
</script>

<script lang="ts">
    import type { Attachment } from 'svelte/attachments';
    import { cn } from '$docs/utils.js';
    import { getFieldsetCompositionContext } from './context.svelte.js';

    const uid = $props.id();
    const context = getFieldsetCompositionContext();

    let {
        as = 'div',
        children,
        class: className,
        id = context.legendId ?? uid,
        ref = $bindable(null),
        ...props
    }: FieldsetLegendProps = $props();

    const registerLegend: Attachment<HTMLElement> = () => context.registerLegend(id);
</script>

<svelte:element
    this={as}
    bind:this={ref}
    {@attach registerLegend}
    {id}
    data-disabled={context.disabled ? '' : undefined}
    data-slot="fieldset-legend"
    class={cn('font-semibold text-foreground', className)}
    {...props}
>
    {@render children?.(context.state)}
</svelte:element>
