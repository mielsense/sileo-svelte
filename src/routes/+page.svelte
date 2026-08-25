<script lang="ts">
    import { onMount } from 'svelte';
    import { resolve } from '$app/paths';
    import Sileo from '$lib/Sileo.svelte';
    import type { SileoState } from '$lib/index.js';
    import { PACKAGE_VERSION } from '../version.js';
    import './home.css';

    const demoSteps: Array<{ state: SileoState; title: string; description: string }> = [
        {
            state: 'loading',
            title: 'Publishing release',
            description: 'Preparing package artifacts.'
        },
        {
            state: 'success',
            title: 'Release published',
            description: `sileo-svelte@${PACKAGE_VERSION} is live.`
        },
        {
            state: 'action',
            title: 'Review deployment',
            description: 'One region needs your attention.'
        },
        {
            state: 'error',
            title: 'Deploy interrupted',
            description: 'The previous release is still serving.'
        }
    ];

    let demoIndex = $state(0);
    const demo = $derived(demoSteps[demoIndex]);

    onMount(() => {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (reducedMotion.matches) {
            demoIndex = 1;
            return;
        }

        let timer: number | undefined;
        const schedule = () => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                demoIndex = (demoIndex + 1) % demoSteps.length;
                schedule();
            }, 2400);
        };
        const handleVisibility = () => {
            window.clearTimeout(timer);
            if (!document.hidden) schedule();
        };

        schedule();
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            window.clearTimeout(timer);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    });
</script>

<svelte:head>
    <title>Sileo Svelte · Toasts shaped for Svelte</title>
    <meta
        name="description"
        content="An unofficial Svelte 5 port of Sileo with compact, animated notifications and a typed API."
    />
</svelte:head>

<main
    id="main-content"
    class="home-page"
>
    <div class="home-shell">
        <section
            class="home-copy"
            aria-labelledby="home-title"
        >
            <h1 id="home-title">Sileo, shaped for Svelte.</h1>
            <p class="home-lede">
                Compact notifications with fluid state changes, typed options, and space for useful detail.
            </p>

            <div class="home-actions">
                <a
                    class="primary-action home-primary-action"
                    href={resolve('/docs')}>Read the documentation</a
                >
                <a
                    class="secondary-action"
                    href={resolve('/playground')}>Open the playground</a
                >
            </div>

            <ul
                class="home-capabilities"
                aria-label="Library capabilities"
            >
                <li><strong>Svelte 5</strong><span>Native snippets</span></li>
                <li><strong>Typed API</strong><span>State-safe options</span></li>
                <li><strong>One toast</strong><span>Continuous updates</span></li>
            </ul>

            <p class="home-attribution">
                Sileo Svelte is an unofficial port of
                <a
                    href="https://github.com/hiaaryan/sileo"
                    aria-label="Original Sileo library"
                    rel="noreferrer">the original Sileo library</a
                >.
            </p>
        </section>

        <section
            class="home-demo shadow-elevated"
            aria-label="Looping Sileo notification demonstration"
        >
            <header class="home-demo-header">
                <div>
                    <span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>
                </div>
                <p>Live component</p>
                <span>Contained preview</span>
            </header>

            <div
                class="home-demo-canvas"
                data-home-demo
                data-demo-state={demo.state}
            >
                <div
                    class="home-demo-context"
                    aria-hidden="true"
                >
                    <div><span>Release</span><strong>v{PACKAGE_VERSION}</strong></div>
                    <div><span>Runtime</span><strong>Svelte 5</strong></div>
                </div>

                <div class="home-demo-toast">
                    <Sileo
                        id="home-demo-toast"
                        toastState={demo.state}
                        title={demo.title}
                        description={demo.description}
                        position="right"
                        expand="bottom"
                        refreshKey={`home-demo-${demoIndex}`}
                        canExpand
                        autoExpandDelayMs={180}
                    />
                </div>

                <div
                    class="home-demo-note"
                    aria-hidden="true"
                >
                    <span>State changes</span>
                    <span>Toast stays put</span>
                </div>
            </div>

            <footer class="home-demo-footer">
                <p><span aria-hidden="true"></span>{demo.title}</p>
                <div aria-label={`Demo ${demoIndex + 1} of ${demoSteps.length}`}>
                    {#each demoSteps as step, index (step.state)}
                        <span class:active={index === demoIndex}></span>
                    {/each}
                </div>
            </footer>
        </section>
    </div>
</main>
