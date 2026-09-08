<script
    module
    lang="ts"
>
    import type { Select as P } from '@shardsui/svelte/select';
    import type { ComponentProps } from 'svelte';
    export type SelectGroupLabelProps = ComponentProps<typeof P.GroupLabel>;
</script>

<script lang="ts">
    import Part from './select-parts.svelte';
    let { ref = $bindable(null), ...props }: SelectGroupLabelProps = $props();
</script>

<Part
    bind:ref
    kind="group-label"
    {...props}
/>
