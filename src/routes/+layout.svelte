<script lang="ts">
    import { resolve } from '$app/paths';
    import { Toaster } from '$lib/index.js';
    import '$lib/styles.css';

    let { children } = $props();
    const playgroundHref = `${resolve('/')}#playground`;
    const apiHref = `${resolve('/')}#api`;
</script>

<a
    class="skip-link"
    href="#main-content">Skip to content</a
>

<header class="site-header">
    <nav
        class="nav-island"
        aria-label="Primary navigation"
    >
        <a
            class="wordmark"
            href={resolve('/')}
            aria-label="Sileo Svelte home"
        >
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    d="M5 8.5C5 6.57 6.57 5 8.5 5h7C17.43 5 19 6.57 19 8.5v7c0 1.93-1.57 3.5-3.5 3.5h-7A3.5 3.5 0 0 1 5 15.5v-7Z"
                />
                <path d="M8.25 9.25h7.5M8.25 12h5.5M8.25 14.75h3.5" />
            </svg>
            <span>Sileo Svelte</span>
        </a>
        <div class="nav-links">
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- hash is appended to the resolved base path -->
            <a href={playgroundHref}>Playground</a>
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- hash is appended to the resolved base path -->
            <a href={apiHref}>API</a>
            <a
                class="github-link"
                href="https://github.com/mielsense/sileo-svelte"
                rel="noreferrer"
            >
                GitHub
                <span aria-hidden="true">↗</span>
            </a>
        </div>
    </nav>
</header>

{@render children()}

<Toaster
    position="top-right"
    options={{
        fill: '#181818',
        styles: {
            titleColor: '#ffffff',
            descriptionColor: '#bdbdbd'
        }
    }}
/>

<style>
    :global(:root) {
        color-scheme: dark;
        font-family: Geist, Manrope, sans-serif;
        font-synthesis: none;
        --black: #000000;
        --surface-1: #181818;
        --surface-2: #1f1f1f;
        --surface-3: #272727;
        --surface-4: #313131;
        --text: #ffffff;
        --text-soft: #bdbdbd;
        --text-muted: #8f8f8f;
        --line: #272727;
        --ease-sileo: cubic-bezier(0.32, 0.72, 0, 1);
        scroll-behavior: smooth;
        background: var(--black);
    }

    :global(*) {
        box-sizing: border-box;
    }

    :global(html) {
        min-width: 320px;
        background: var(--black);
    }

    :global(body) {
        min-width: 320px;
        min-height: 100dvh;
        margin: 0;
        overflow-x: hidden;
        background: var(--black);
        color: var(--text);
        font-family: Geist, Manrope, sans-serif;
        -webkit-font-smoothing: antialiased;
    }

    :global(button),
    :global(input) {
        font: inherit;
    }

    :global(button),
    :global(a) {
        -webkit-tap-highlight-color: transparent;
    }

    :global(a) {
        color: inherit;
    }

    :global(:focus-visible) {
        outline: 2px solid #ffffff;
        outline-offset: 4px;
    }

    .skip-link {
        position: fixed;
        z-index: 40;
        top: 8px;
        left: 8px;
        padding: 8px 12px;
        transform: translateY(-160%);
        border-radius: 4px;
        background: #ffffff;
        color: #000000;
        font-size: 14px;
        font-weight: 700;
        text-decoration: none;
        transition: transform 200ms var(--ease-sileo);
    }

    .skip-link:focus {
        transform: translateY(0);
    }

    .site-header {
        position: absolute;
        z-index: 20;
        top: 0;
        right: 0;
        left: 0;
        padding: 16px 24px 0;
        pointer-events: none;
    }

    .nav-island {
        display: flex;
        width: min(100%, 76rem);
        min-height: 48px;
        margin: 0 auto;
        padding: 4px 4px 4px 12px;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        border: 1px solid var(--surface-3);
        border-radius: 9999px;
        background: rgb(24 24 24 / 92%);
        box-shadow: 0 12px 40px rgb(0 0 0 / 35%);
        pointer-events: auto;
    }

    .wordmark,
    .nav-links,
    .nav-links a {
        display: flex;
        align-items: center;
    }

    .wordmark {
        min-width: 0;
        gap: 8px;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: -0.01em;
        text-decoration: none;
    }

    .wordmark svg {
        width: 24px;
        height: 24px;
        flex: 0 0 auto;
        fill: none;
        stroke: currentColor;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 1.5;
    }

    .nav-links {
        gap: 4px;
    }

    .nav-links a {
        min-height: 40px;
        padding: 8px 12px;
        justify-content: center;
        gap: 4px;
        border-radius: 9999px;
        color: var(--text-soft);
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        transition:
            background-color 200ms var(--ease-sileo),
            color 200ms var(--ease-sileo),
            transform 200ms var(--ease-sileo);
    }

    .nav-links a:hover {
        background: var(--surface-3);
        color: var(--text);
    }

    .nav-links a:active {
        transform: scale(0.98);
    }

    .nav-links .github-link {
        background: #ffffff;
        color: #000000;
    }

    .nav-links .github-link:hover {
        background: #d9d9d9;
        color: #000000;
    }

    @media (max-width: 520px) {
        .site-header {
            padding: 12px 8px 0;
        }

        .nav-island {
            min-height: 44px;
            padding-left: 8px;
            gap: 4px;
        }

        .wordmark {
            font-size: 12px;
        }

        .wordmark svg {
            width: 20px;
            height: 20px;
        }

        .nav-links {
            gap: 0;
        }

        .nav-links a {
            min-height: 36px;
            padding: 8px;
            font-size: 12px;
        }
    }

    @media (max-width: 350px) {
        .wordmark span {
            position: absolute;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip: rect(0 0 0 0);
            clip-path: inset(50%);
            white-space: nowrap;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        :global(:root) {
            scroll-behavior: auto;
        }

        .skip-link,
        .nav-links a {
            transition-duration: 0.01ms;
        }
    }
</style>
