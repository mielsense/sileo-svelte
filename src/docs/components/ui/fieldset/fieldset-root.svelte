<script
    module
    lang="ts"
>
    import { Fieldset as FieldsetPrimitive } from '@shardsui/svelte/fieldset';
    import type { ComponentProps } from 'svelte';

    export type FieldsetRootProps = ComponentProps<typeof FieldsetPrimitive.Root> & {
        /**
         * Hydration-stable ID shared with `Fieldset.Legend` when the relationship must exist in SSR.
         * Pass the same explicit ID to the Legend.
         */
        legendId?: string;
    };
</script>

<script lang="ts">
    import { createFieldsetCompositionContext } from './context.svelte.js';

    let { class: className, disabled = false, legendId, ref = $bindable(null), ...props }: FieldsetRootProps = $props();

    const context = createFieldsetCompositionContext(
        () => disabled,
        () => true,
        () => legendId
    );
</script>

<FieldsetPrimitive.Root
    bind:ref
    {disabled}
    aria-labelledby={context.legendId}
    data-slot="fieldset"
    class={className}
    {...props}
/>
