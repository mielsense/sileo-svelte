<script lang="ts">
    import { Toaster } from '$lib/index.js';
    import '$lib/styles.css';

    let { children } = $props();
</script>

{@render children()}

<Toaster position="top-right" />
