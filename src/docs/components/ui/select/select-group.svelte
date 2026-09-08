<script
    module
    lang="ts"
>
    import type { Select as P } from '@shardsui/svelte/select';
    import type { ComponentProps } from 'svelte';
    export type SelectGroupProps = ComponentProps<typeof P.Group>;
</script>

<script lang="ts">
    import Part from './select-parts.svelte';
    let { ref = $bindable(null), ...props }: SelectGroupProps = $props();
</script>

<Part
    bind:ref
    kind="group"
    {...props}
/>
