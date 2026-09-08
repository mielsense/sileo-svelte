<script
    module
    lang="ts"
>
    import { Field as FieldPrimitive } from '@shardsui/svelte/field';
    import type { ComponentProps } from 'svelte';

    export type FieldRootProps = ComponentProps<typeof FieldPrimitive.Root> & {
        /**
         * The control ID rendered by a later explicitly identified child. Set this alongside the
         * child's `id` so a preceding label has the correct native `for` value during SSR.
         */
        controlId?: string;
        /**
         * Hydration-stable ID shared with `Fieldset.Legend` when `as` is `"fieldset"` and the
         * relationship must exist in SSR. Pass the same explicit ID to the Legend.
         */
        legendId?: string;
    };
</script>

<script lang="ts">
    import { cn } from '$docs/utils.js';
    import { createFieldsetCompositionContext } from '../fieldset/context.svelte.js';
    import FieldRelationshipProvider from './field-relationship-provider.svelte';

    const uid = $props.id();
    let {
        as = 'div',
        children: child,
        class: className,
        controlId = `${uid}-control`,
        disabled = false,
        invalid,
        legendId,
        name,
        ref = $bindable(null),
        ...props
    }: FieldRootProps = $props();

    let relationshipLabelId = $state<string | undefined>();
    let relationshipDescribedBy = $state<string | undefined>();

    const fieldsetContext = createFieldsetCompositionContext(
        () => disabled,
        () => as === 'fieldset',
        () => (as === 'fieldset' ? legendId : undefined)
    );

    // Shards consumes its lowercase `disabled` prop for Field state. HTML attribute names are
    // ASCII-case-insensitive, while Svelte normalizes spread attributes during SSR and in the DOM,
    // so this distinct component prop reaches the same root as a native `disabled` attribute.
    const nativeFieldsetAttributes = $derived(as === 'fieldset' && disabled ? { DISABLED: true } : {});
    const fieldNameAttributes = $derived.by<{ name?: string }>(() => (name === undefined ? {} : { name }));
    const fieldInvalidAttributes = $derived.by<{ invalid?: boolean }>(() => (invalid === undefined ? {} : { invalid }));
</script>

<FieldPrimitive.Root
    {as}
    bind:ref
    {disabled}
    {...fieldNameAttributes}
    {...fieldInvalidAttributes}
    aria-labelledby={as === 'fieldset' ? fieldsetContext.legendId : undefined}
    data-slot="field"
    class={cn('flex flex-col items-start gap-2', className)}
    {...nativeFieldsetAttributes}
    {...props}
>
    {#snippet children(state: Parameters<NonNullable<FieldRootProps['children']>>[0])}
        <FieldRelationshipProvider
            bind:describedBy={relationshipDescribedBy}
            disabled={state.disabled}
            invalid={invalid === true}
            bind:labelId={relationshipLabelId}
            defaultControlId={controlId}
            {name}
        >
            {@render child?.(state)}
        </FieldRelationshipProvider>
    {/snippet}
</FieldPrimitive.Root>
