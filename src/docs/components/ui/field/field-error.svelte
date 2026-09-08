<script
    module
    lang="ts"
>
    import { Field as FieldPrimitive } from '@shardsui/svelte/field';
    import type { ComponentProps } from 'svelte';

    export type FieldErrorProps = ComponentProps<typeof FieldPrimitive.Error>;
</script>

<script lang="ts">
    import { untrack } from 'svelte';
    import { cn } from '$docs/utils.js';
    import { getFieldRelationshipContext } from './relationship-context.svelte.js';

    const uid = $props.id();
    let { class: className, id = uid, match, ref = $bindable(null), ...props }: FieldErrorProps = $props();
    const relationships = getFieldRelationshipContext();
    untrack(() => {
        if (match === true) relationships?.registerInitialMessageId(id);
    });
    $effect(() => {
        const nextId = id;
        return match === true ? untrack(() => relationships?.registerMessageId(nextId)) : undefined;
    });
    const matchProps = $derived(match === undefined ? {} : { match });
</script>

<FieldPrimitive.Error
    bind:ref
    data-slot="field-error"
    class={cn('text-destructive-foreground text-xs', className)}
    {id}
    {...matchProps}
    {...props}
/>
