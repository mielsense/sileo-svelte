<script
    module
    lang="ts"
>
    import type { Select as ShardsSelect } from '@shardsui/svelte/select';
    import type { ComponentProps } from 'svelte';
    export type SelectLabelProps = ComponentProps<typeof ShardsSelect.Label>;
</script>

<script lang="ts">
    import { Select as P } from '@shardsui/svelte/select';
    import { cn } from '$docs/utils.js';
    let { class: className, ref = $bindable(null), ...props }: SelectLabelProps = $props();
</script>

<P.Label
    bind:ref
    class={cn(
        'not-in-data-[slot=field]:mb-2 inline-flex cursor-default items-center gap-2 font-medium text-base/4.5 text-foreground sm:text-sm/4',
        className
    )}
    data-slot="select-label"
    {...props}
/>
