<script
    module
    lang="ts"
>
    import { Field as FieldPrimitive } from '@shardsui/svelte/field';
    import type { ComponentProps } from 'svelte';

    export type FieldControlProps = ComponentProps<typeof FieldPrimitive.Control>;
</script>

<script lang="ts">
    import { untrack } from 'svelte';
    import { getFieldRelationshipContext } from './relationship-context.svelte.js';

    const uid = $props.id();
    const relationships = getFieldRelationshipContext();

    let {
        id = relationships?.resolveDefaultControlId(uid) ?? uid,
        ref = $bindable(null),
        value = $bindable(),
        ...props
    }: FieldControlProps = $props();

    untrack(() => {
        if (id) relationships?.registerInitialControlId(id);
    });
    $effect(() => {
        const nextId = id;
        return untrack(() => (nextId ? relationships?.registerControlId(nextId) : undefined));
    });
</script>

<FieldPrimitive.Control
    bind:ref
    bind:value
    {id}
    {...props}
/>
