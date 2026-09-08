<script lang="ts">
    import { Button } from '$docs/components/ui/button/index.js';
    import { resolve } from '$app/paths';
    import { page } from '$app/state';
    const status = $derived(page.status);
</script>

<svelte:head>
    <title>{status === 404 ? 'Page not found' : 'Page unavailable'} · Sileo Svelte</title>
    <meta
        name="robots"
        content="noindex"
    />
</svelte:head>

<main
    id="main-content"
    class="error-main"
>
    <div class="error-content">
        <p class="error-status">Error {status}</p>
        <h1>{status === 404 ? 'Page not found' : 'Page unavailable'}</h1>
        <p class="error-description">
            {status === 404 ? 'There is no page at this address.' : 'This page could not load.'}
        </p>
        <div class="error-actions">
            <Button href={resolve('/docs')}>Open documentation</Button>
            <Button
                variant="outline"
                href={resolve('/playground')}>Open playground</Button
            >
        </div>
    </div>
</main>
