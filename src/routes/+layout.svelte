<script lang="ts">
    import { onMount } from 'svelte';
    import { resolve } from '$app/paths';
    import { Toaster } from '$lib/index.js';
    import '$lib/styles.css';

    let { children } = $props();
    const playgroundHref = `${resolve('/')}#playground`;
    const apiHref = `${resolve('/')}#api`;
    let currentSection = $state<'home' | 'playground' | 'api'>('home');
    let isCompact = $state(false);
    let isMenuOpen = $state(false);
    let menuButton: HTMLButtonElement;

    function closeMenu(restoreFocus = false) {
        isMenuOpen = false;
        if (restoreFocus) queueMicrotask(() => menuButton?.focus());
    }

    function handleWindowKeydown(event: KeyboardEvent) {
        if (event.key !== 'Escape' || !isMenuOpen) return;
        event.preventDefault();
        closeMenu(true);
    }

    $effect(() => {
        const previousOverflow = document.body.style.overflow;
        if (isMenuOpen) document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    });

    onMount(() => {
        let observer: IntersectionObserver | undefined;
        let compactObserver: IntersectionObserver | undefined;
        let disposed = false;
        queueMicrotask(() => {
            if (disposed) return;
            if (typeof IntersectionObserver === 'undefined') return;

            const sentinel = document.querySelector('[data-nav-sentinel]');
            if (sentinel) {
                compactObserver = new IntersectionObserver(
                    ([entry]) => {
                        isCompact = !entry.isIntersecting;
                    },
                    { rootMargin: '-48px 0px 0px', threshold: [0, 1] }
                );
                compactObserver.observe(sentinel);
            }

            const targets = ['playground', 'api']
                .map((id) => document.getElementById(id))
                .filter((target): target is HTMLElement => target !== null);
            if (!targets.length) return;
            const intersectionRatios = Object.fromEntries(targets.map((target) => [target.id, 0]));

            observer = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        intersectionRatios[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
                    }

                    const visible = targets
                        .map((target) => ({ id: target.id, ratio: intersectionRatios[target.id] ?? 0 }))
                        .filter((entry) => entry.ratio > 0)
                        .sort((a, b) => b.ratio - a.ratio)[0];
                    currentSection = visible?.id === 'playground' || visible?.id === 'api' ? visible.id : 'home';
                },
                { rootMargin: '-16% 0px -68% 0px', threshold: [0, 0.25, 0.75] }
            );
            for (const target of targets) observer.observe(target);
        });

        return () => {
            disposed = true;
            observer?.disconnect();
            compactObserver?.disconnect();
        };
    });
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<a
    class="skip-link"
    href="#main-content">Skip to content</a
>

<span
    class="nav-sentinel"
    data-nav-sentinel
    aria-hidden="true"
></span>

<header class="site-header">
    <nav
        class="nav-island"
        class:is-compact={isCompact}
        class:is-menu-open={isMenuOpen}
        aria-label="Primary navigation"
    >
        <a
            class="wordmark"
            href={resolve('/')}
            aria-label="Sileo Svelte home"
            aria-current={currentSection === 'home' ? 'page' : undefined}
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
        <div class="nav-links desktop-nav">
            <!-- eslint-disable svelte/no-navigation-without-resolve -- hashes are appended to the resolved base path -->
            <a
                href={playgroundHref}
                aria-current={currentSection === 'playground' ? 'location' : undefined}>Playground</a
            >
            <a
                href={apiHref}
                aria-current={currentSection === 'api' ? 'location' : undefined}>API</a
            >
            <!-- eslint-enable svelte/no-navigation-without-resolve -->
            <a
                class="github-link"
                href="https://github.com/mielsense/sileo-svelte"
                rel="noreferrer"
                aria-label="View Sileo Svelte on GitHub"
            >
                <span aria-hidden="true">↗</span>
            </a>
        </div>
        <button
            class="menu-toggle"
            class:is-open={isMenuOpen}
            bind:this={menuButton}
            type="button"
            aria-controls="mobile-navigation"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onclick={() => (isMenuOpen = !isMenuOpen)}
        >
            <span></span>
            <span></span>
        </button>
    </nav>
    <nav
        id="mobile-navigation"
        class="mobile-menu"
        class:is-open={isMenuOpen}
        aria-label="Mobile navigation"
        aria-hidden={!isMenuOpen}
        inert={!isMenuOpen}
        data-mobile-menu
    >
        <a
            href={resolve('/')}
            aria-current={currentSection === 'home' ? 'page' : undefined}
            onclick={() => closeMenu()}>Home</a
        >
        <!-- eslint-disable svelte/no-navigation-without-resolve -- hashes are appended to the resolved base path -->
        <a
            href={playgroundHref}
            aria-current={currentSection === 'playground' ? 'location' : undefined}
            onclick={() => closeMenu()}>Playground</a
        >
        <a
            href={apiHref}
            aria-current={currentSection === 'api' ? 'location' : undefined}
            onclick={() => closeMenu()}>API</a
        >
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
        <a
            href="https://github.com/mielsense/sileo-svelte"
            rel="noreferrer"
            onclick={() => closeMenu()}
        >
            GitHub <span aria-hidden="true">↗</span>
        </a>
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

    .nav-sentinel {
        position: absolute;
        top: 48px;
        left: 0;
        width: 1px;
        height: 1px;
        pointer-events: none;
    }

    .site-header {
        position: fixed;
        z-index: 20;
        top: 0;
        right: 0;
        left: 0;
        padding: 16px 24px 0;
        pointer-events: none;
    }

    .nav-island {
        position: relative;
        z-index: 2;
        display: flex;
        width: max-content;
        max-width: 100%;
        min-height: 48px;
        margin: 0 auto;
        padding: 4px 4px 4px 12px;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        border: 1px solid rgb(255 255 255 / 0%);
        border-radius: 9999px;
        background: rgb(24 24 24 / 0%);
        box-shadow: inset 0 1px 0 rgb(255 255 255 / 0%);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        pointer-events: auto;
        transform-origin: top center;
        transition:
            transform 700ms var(--ease-sileo),
            background-color 700ms var(--ease-sileo),
            border-color 700ms var(--ease-sileo),
            box-shadow 700ms var(--ease-sileo);
    }

    .nav-island.is-compact,
    .nav-island.is-menu-open {
        border-color: rgb(255 255 255 / 12%);
        background: rgb(24 24 24 / 80%);
        box-shadow: inset 0 1px 0 rgb(255 255 255 / 8%);
    }

    .nav-island.is-compact {
        transform: translateY(-8px);
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

    .nav-links a[aria-current='location'] {
        background: var(--surface-3);
        color: var(--text);
    }

    .nav-links a:active {
        transform: scale(0.98);
    }

    .nav-links .github-link {
        width: 40px;
        padding: 8px;
        background: #ffffff;
        color: #000000;
        font-size: 18px;
        line-height: 28px;
    }

    .nav-links .github-link:hover {
        background: #d9d9d9;
        color: #000000;
    }

    .menu-toggle,
    .mobile-menu {
        display: none;
    }

    @media (max-width: 520px) {
        .site-header {
            padding: 12px 8px 0;
        }

        .nav-island {
            min-height: 44px;
            padding-left: 8px;
            gap: 24px;
        }

        .wordmark {
            font-size: 12px;
        }

        .wordmark svg {
            width: 20px;
            height: 20px;
        }

        .desktop-nav {
            display: none;
        }

        .menu-toggle {
            position: relative;
            display: grid;
            width: 32px;
            height: 32px;
            padding: 0;
            place-items: center;
            border: 0;
            border-radius: 9999px;
            background: #ffffff;
            color: #000000;
            cursor: pointer;
        }

        .menu-toggle span {
            position: absolute;
            width: 12px;
            height: 2px;
            border-radius: 9999px;
            background: currentColor;
            transition: transform 700ms var(--ease-sileo);
        }

        .menu-toggle span:first-child {
            transform: translateY(-3px);
        }

        .menu-toggle span:last-child {
            transform: translateY(3px);
        }

        .menu-toggle.is-open span:first-child {
            transform: rotate(45deg);
        }

        .menu-toggle.is-open span:last-child {
            transform: rotate(-45deg);
        }

        .mobile-menu {
            position: fixed;
            z-index: 1;
            inset: 0;
            display: flex;
            padding: 96px 24px 48px;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            background: rgb(0 0 0 / 80%);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition:
                opacity 700ms var(--ease-sileo),
                visibility 700ms var(--ease-sileo);
        }

        .mobile-menu.is-open {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
        }

        .mobile-menu a {
            display: flex;
            padding: 8px 0;
            align-items: center;
            gap: 8px;
            color: var(--text-muted);
            font-size: 36px;
            font-weight: 600;
            line-height: 40px;
            letter-spacing: -0.03em;
            text-decoration: none;
            opacity: 0;
            transform: translateY(48px);
            transition:
                color 200ms var(--ease-sileo),
                opacity 700ms var(--ease-sileo),
                transform 700ms var(--ease-sileo);
        }

        .mobile-menu.is-open a {
            opacity: 1;
            transform: translateY(0);
        }

        .mobile-menu a:hover,
        .mobile-menu a[aria-current] {
            color: var(--text);
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
        .nav-island,
        .menu-toggle span,
        .mobile-menu,
        .mobile-menu a,
        .nav-links a {
            transition-duration: 0.01ms;
        }
    }
</style>
