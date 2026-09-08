<script lang="ts">
    import { Button } from '$docs/components/ui/button/index.js';
    import { resolve } from '$app/paths';
    import Sileo from '$lib/Sileo.svelte';
    import type { SileoState } from '$lib/index.js';
    import './home.css';

    const examples: Array<{ state: SileoState; label: string; title: string; description: string }> = [
        { state: 'success', label: 'Success', title: 'Changes saved', description: 'Your draft is ready to share.' },
        { state: 'loading', label: 'Loading', title: 'Uploading files', description: '' },
        { state: 'error', label: 'Error', title: 'Upload failed', description: 'Check your connection and try again.' },
        {
            state: 'info',
            label: 'Info',
            title: 'A new version is ready',
            description: 'Refresh when you are ready to update.'
        }
    ];
    let selected = $state(0);
    let revision = $state(0);
    const example = $derived(examples[selected]);
</script>

<svelte:head>
    <title>Sileo Svelte · Toast notifications for Svelte 5</title>
    <meta
        name="description"
        content="Animated toast notifications for Svelte 5. Handle promises, add actions, and update messages in place."
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
            <p class="home-eyebrow">Sileo Svelte</p>
            <h1 id="home-title">Toasts for Svelte.</h1>
            <p class="home-lede">
                A compact toast that expands when there is more to say. Update it as a promise resolves, or add an
                action for the next step.
            </p>
            <div class="home-actions">
                <Button
                    size="default"
                    href={resolve('/docs')}>Get started <span aria-hidden="true">→</span></Button
                >
                <Button
                    variant="outline"
                    size="default"
                    href={resolve('/playground')}>Playground</Button
                >
            </div>
        </section>
        <section
            class="home-demo"
            aria-label="Try a notification"
        >
            <div class="home-demo-toolbar">
                <span class="home-demo-label">Try it</span>
                <div
                    class="home-demo-controls"
                    role="group"
                    aria-label="Notification state"
                >
                    {#each examples as item, index (item.state)}
                        <Button
                            type="button"
                            variant={selected === index ? 'secondary' : 'ghost'}
                            aria-pressed={selected === index}
                            onclick={() => {
                                selected = index;
                                revision += 1;
                            }}>{item.label}</Button
                        >
                    {/each}
                </div>
            </div>
            <div
                class="home-demo-canvas"
                data-home-demo
                data-demo-state={example.state}
            >
                <div class="home-demo-toast">
                    <Sileo
                        id="home-demo"
                        toastState={example.state}
                        title={example.title}
                        description={example.description}
                        position="center"
                        expand="bottom"
                        refreshKey={`home-${revision}`}
                        canExpand
                        autoExpandDelayMs={180}
                    />
                </div>
            </div>
            <p class="home-demo-hint">Select a state. Hover over the toast to expand it.</p>
        </section>
    </div>
</main>
