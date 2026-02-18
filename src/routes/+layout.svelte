<script lang="ts">
    import { Toaster } from '$lib/index.js';
    import '$lib/styles.css';

    let { children } = $props();
</script>

{@render children()}

<Toaster
    position="top-right"
    options={{
        fill: 'var(--page-fg, #0f1115)',
        styles: {
            descriptionColor: 'color-mix(in oklch, var(--page-bg, #f6f6f7) 82%, transparent)'
        }
    }}
/>
