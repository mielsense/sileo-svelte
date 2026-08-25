<script lang="ts">
    import DocumentPage from '../_components/DocumentPage.svelte';
    import type { DocPageData } from '$lib/docs/types.js';
    let { data }: { data: DocPageData } = $props();
</script>

<DocumentPage {data} />
