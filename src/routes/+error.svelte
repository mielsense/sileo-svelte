<script lang="ts">
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
    <div>
        <p class="error-status">Error {status}</p>
        <h1>{status === 404 ? 'Page not found' : 'Page unavailable'}</h1>
        <p>
            {status === 404
                ? 'There is no documentation page at this address.'
                : 'The documentation page could not load.'}
        </p>
        <div class="doc-actions">
            <a
                class="primary-action"
                href={resolve('/docs')}>Open documentation</a
            >
            <a
                class="secondary-action"
                href={resolve('/playground')}>Open playground</a
            >
        </div>
    </div>
</main>
