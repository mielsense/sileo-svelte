<script lang="ts">
    import { resolve } from '$app/paths';
    import { page } from '$app/state';
    import { Toaster } from '$lib/index.js';
    import '$lib/styles.css';
    import './tailwind.css';
    import './docs.css';
    import ThemeToggle from './_components/ThemeToggle.svelte';

    let { children } = $props();
    const onDocs = $derived(page.url.pathname.startsWith('/docs'));
    const onPlayground = $derived(page.url.pathname.startsWith('/playground'));
</script>

<a
    class="skip-link"
    href="#main-content">Skip to content</a
>

<header class="site-header">
    <a
        class="wordmark"
        href={resolve('/')}
        aria-label="Sileo Svelte home"
    >
        <span>Sileo</span>
        <span class="svelte-badge shadow-svelte">Svelte</span>
    </a>

    <nav
        class="header-links"
        aria-label="Primary navigation"
    >
        <a
            class:shadow-elevated={onDocs}
            href={resolve('/docs')}
            aria-current={onDocs ? 'page' : undefined}>Docs</a
        >
        <a
            class:shadow-elevated={onPlayground}
            href={resolve('/playground')}
            aria-current={onPlayground ? 'page' : undefined}>Playground</a
        >
    </nav>

    <div class="header-actions">
        <a
            class="header-agent-link"
            href={resolve('/llms.txt')}>llms.txt</a
        >
        <a
            class="icon-button"
            href="https://github.com/mielsense/sileo-svelte"
            rel="noreferrer"
            aria-label="View Sileo Svelte on GitHub"
            title="GitHub"
        >
            <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
            >
                <path
                    d="M10 2.25a7.75 7.75 0 0 0-2.45 15.1c.39.07.53-.17.53-.38v-1.5c-2.17.47-2.63-.92-2.63-.92-.35-.9-.87-1.14-.87-1.14-.71-.49.05-.48.05-.48.79.05 1.2.81 1.2.81.7 1.2 1.84.85 2.29.65.07-.51.27-.85.5-1.05-1.73-.2-3.55-.87-3.55-3.83 0-.85.3-1.54.8-2.08-.08-.2-.35-.99.08-2.05 0 0 .65-.21 2.13.8a7.38 7.38 0 0 1 3.88 0c1.48-1.01 2.13-.8 2.13-.8.43 1.06.16 1.85.08 2.05.5.54.8 1.23.8 2.08 0 2.97-1.82 3.62-3.55 3.82.28.24.53.72.53 1.45v2.15c0 .21.14.46.54.38A7.75 7.75 0 0 0 10 2.25Z"
                />
            </svg>
        </a>
        <ThemeToggle />
    </div>
</header>

{@render children()}
{#if onDocs}
    <Toaster
        position="bottom-right"
        offset={18}
    />
{/if}
