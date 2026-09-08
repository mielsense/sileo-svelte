<script
    module
    lang="ts"
>
    import { Field as FieldPrimitive } from '@shardsui/svelte/field';
    import type { ComponentProps } from 'svelte';

    export type FieldItemProps = ComponentProps<typeof FieldPrimitive.Item> & {
        /** See `FieldRootProps.controlId` for the explicit-child SSR contract. */
        controlId?: string;
    };
</script>

<script lang="ts">
    import { cn } from '$docs/utils.js';
    import FieldRelationshipProvider from './field-relationship-provider.svelte';

    const uid = $props.id();
    let {
        children: child,
        class: className,
        controlId = `${uid}-control`,
        ref = $bindable(null),
        ...props
    }: FieldItemProps = $props();
    let relationshipLabelId = $state<string | undefined>();
    let relationshipDescribedBy = $state<string | undefined>();
</script>

<FieldPrimitive.Item
    bind:ref
    data-slot="field-item"
    class={cn('flex', className)}
    {...props}
>
    {#snippet children(state: Parameters<NonNullable<FieldItemProps['children']>>[0])}
        <FieldRelationshipProvider
            bind:describedBy={relationshipDescribedBy}
            bind:labelId={relationshipLabelId}
            defaultControlId={controlId}
        >
            {@render child?.(state)}
        </FieldRelationshipProvider>
    {/snippet}
</FieldPrimitive.Item>
