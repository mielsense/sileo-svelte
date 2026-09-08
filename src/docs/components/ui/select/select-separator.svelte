<script
    module
    lang="ts"
>
    import type { SvelteHTMLElements } from 'svelte/elements';
    export type SelectSeparatorProps = Omit<SvelteHTMLElements['div'], 'children' | 'id'> & {
        as?: keyof HTMLElementTagNameMap;
        ref?: HTMLElement | null;
        id?: string;
        orientation?: 'horizontal' | 'vertical';
    };
</script>

<script lang="ts">
    import Part from './select-parts.svelte';
    let { ref = $bindable(null), ...props }: SelectSeparatorProps = $props();
</script>

<Part
    bind:ref
    kind="separator"
    {...props}
/>
