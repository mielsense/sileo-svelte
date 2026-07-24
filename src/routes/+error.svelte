<script lang="ts">
    import { resolve } from '$app/paths';
    import { page } from '$app/state';

    const status = $derived(page.status);
    const playgroundHref = `${resolve('/')}#playground`;
</script>

<svelte:head>
    <title>{status === 404 ? 'Page not found' : 'Page unavailable'} — Sileo Svelte</title>
    <meta
        name="robots"
        content="noindex"
    />
</svelte:head>

<main id="main-content">
    <div class="error-copy">
        <p class="status">{status}</p>
        <p class="label">Sileo Svelte</p>
        <h1>{status === 404 ? 'Page not found' : 'This page is unavailable'}</h1>
        <p>
            {status === 404
                ? 'The route does not exist in this notification lab.'
                : 'The route could not be rendered. Return to the playground and try again.'}
        </p>
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- hash is appended to the resolved base path -->
        <a href={playgroundHref}>Back to playground</a>
    </div>

    <div
        class="error-stage"
        aria-hidden="true"
    >
        <div class="lost-toast">
            <span>×</span>
            <strong>Route not found</strong>
            <small>closed</small>
        </div>
    </div>
</main>

<style>
    main {
        display: grid;
        width: min(100% - 48px, 76rem);
        min-height: 100dvh;
        margin: 0 auto;
        padding: 112px 0 64px;
        grid-template-columns: 1fr 1fr;
        align-items: center;
        gap: 80px;
    }

    .error-copy {
        max-width: 38rem;
    }

    .status,
    .label {
        color: var(--text-muted);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        line-height: 16px;
        text-transform: uppercase;
    }

    .status {
        margin: 0 0 8px;
        font-variant-numeric: tabular-nums;
    }

    .label {
        margin: 0 0 16px;
    }

    h1 {
        max-width: 9ch;
        margin: 0;
        color: #ffffff;
        font-size: clamp(48px, 7vw, 72px);
        font-weight: 700;
        letter-spacing: -0.055em;
        line-height: 1;
        text-wrap: balance;
    }

    .error-copy > p:last-of-type {
        max-width: 52ch;
        margin: 24px 0 0;
        color: var(--text-soft);
        font-size: 18px;
        line-height: 28px;
    }

    a {
        display: inline-flex;
        min-height: 40px;
        margin-top: 32px;
        padding: 8px 12px;
        align-items: center;
        border-radius: 4px;
        background: #ffffff;
        color: #000000;
        font-size: 16px;
        font-weight: 700;
        line-height: 24px;
        text-decoration: none;
        transition:
            background-color 200ms var(--ease-sileo),
            transform 200ms var(--ease-sileo);
    }

    a:hover {
        background: #d9d9d9;
    }

    a:active {
        transform: scale(0.98);
    }

    .error-stage {
        display: grid;
        min-height: 30rem;
        padding: 32px;
        place-items: center;
        border-right: 1px solid var(--surface-3);
        border-left: 1px solid var(--surface-3);
    }

    .lost-toast {
        display: grid;
        width: min(100%, 22rem);
        min-height: 48px;
        padding: 12px;
        grid-template-columns: 24px 1fr auto;
        align-items: center;
        gap: 8px;
        border-radius: 18px;
        background: var(--surface-1);
        box-shadow: 0 24px 64px rgb(0 0 0 / 60%);
        opacity: 0.58;
        transform: translateY(24px) scale(0.96);
    }

    .lost-toast span {
        display: grid;
        width: 24px;
        height: 24px;
        place-items: center;
        border-radius: 9999px;
        background: #ffffff;
        color: #000000;
        font-weight: 700;
    }

    .lost-toast strong {
        font-size: 14px;
        line-height: 20px;
    }

    .lost-toast small {
        color: var(--text-muted);
        font-size: 12px;
        line-height: 16px;
    }

    @media (max-width: 720px) {
        main {
            width: min(100% - 32px, 76rem);
            padding-top: 96px;
            grid-template-columns: 1fr;
            gap: 48px;
        }

        .error-stage {
            min-height: 16rem;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        a {
            transition-duration: 0.01ms;
        }
    }
</style>
