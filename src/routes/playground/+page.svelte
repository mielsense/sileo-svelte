<script lang="ts">
    import ToastBuilder from './ToastBuilder.svelte';
    import PreviewPanel from './PreviewPanel.svelte';
    let mode = $state<'build' | 'examples'>('build');
    import * as Select from '$docs/components/ui/select/index.js';
    import { Button } from '$docs/components/ui/button/index.js';
    import { onDestroy, onMount } from 'svelte';
    let ready = $state(false);
    onMount(() => {
        ready = true;
    });
    import { page } from '$app/state';
    import Sileo from '$lib/Sileo.svelte';
    import './playground.css';
    import type { SileoButton, SileoPosition } from '$lib/index.js';
    import { scenarios, type ScenarioCompletion, type ScenarioToast } from '../_components/scenarios.js';

    const positions: Array<{ value: SileoPosition; label: string }> = [
        { value: 'top-left', label: 'Top left' },
        { value: 'top-center', label: 'Top center' },
        { value: 'top-right', label: 'Top right' },
        { value: 'bottom-left', label: 'Bottom left' },
        { value: 'bottom-center', label: 'Bottom center' },
        { value: 'bottom-right', label: 'Bottom right' }
    ];

    let viewMode = $state<'preview' | 'code'>('preview');
    let selectedScenarioId = $state('core');
    let selectedPosition = $state<SileoPosition>('top-right');
    let selectedStatus = $state('');
    let preview = $state<ScenarioToast>({
        state: 'success',
        title: 'Release saved',
        description: 'Draft v2.4 is ready for review.',
        position: 'top-right'
    });
    let previewKey = $state('preview-0');
    let previewExiting = $state(false);
    let sequence = 0;
    let timer: number | undefined;

    const selectedScenario = $derived(scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0]);
    const selectedSource = $derived(selectedScenario.source(selectedPosition));
    const canonicalUrl = $derived(
        page.url.origin === 'null' ? page.url.pathname : new URL(page.url.pathname, page.url.origin).href
    );
    const previewButton = $derived.by<SileoButton | undefined>(() => {
        if (!preview.button) return undefined;
        return { title: preview.button.title, onClick: handlePreviewButton };
    });

    function context() {
        return { position: selectedPosition, richDescription, richIcon };
    }

    function updatePreview(next: ScenarioToast) {
        preview = next;
        previewExiting = false;
        previewKey = `preview-${++sequence}`;
    }

    function clearCompletion() {
        if (timer === undefined) return;
        window.clearTimeout(timer);
        timer = undefined;
    }

    function scheduleCompletion(completion: ScenarioCompletion) {
        clearCompletion();
        timer = window.setTimeout(() => {
            timer = undefined;
            updatePreview(completion.final);
        }, completion.delayMs);
    }

    function selectScenario(id: string) {
        clearCompletion();
        selectedScenarioId = id;
        selectedStatus = `${scenarios.find((scenario) => scenario.id === id)?.label ?? 'Scenario'} selected`;
        const next = scenarios.find((scenario) => scenario.id === id);
        if (next) updatePreview(next.initial(context()));
    }

    function runScenario() {
        viewMode = 'preview';
        clearCompletion();
        const currentContext = context();
        updatePreview(selectedScenario.initial(currentContext));
        if (selectedScenario.completion?.trigger === 'run') scheduleCompletion(selectedScenario.completion);
    }

    function handlePreviewButton() {
        const completion = selectedScenario.completion;
        if (completion?.trigger === 'button') {
            if (completion.pending) updatePreview(completion.pending);
            scheduleCompletion(completion);
        } else {
            previewExiting = true;
        }
    }

    function previewAlignment(position: SileoPosition): 'left' | 'center' | 'right' {
        return position.endsWith('left') ? 'left' : position.endsWith('right') ? 'right' : 'center';
    }

    function previewExpansion(position: SileoPosition): 'top' | 'bottom' {
        return position.startsWith('top') ? 'bottom' : 'top';
    }

    onDestroy(clearCompletion);
</script>

<svelte:head>
    <title>Playground · Sileo Svelte</title>
    <meta
        name="description"
        content="Run Sileo Svelte notification states, positions, promise flows, actions, and rich snippets."
    />
    <link
        rel="canonical"
        href={canonicalUrl}
    />
</svelte:head>

{#snippet richDescription()}
    <div class="rich-description"><strong>Release v2.4</strong><span>Six regions are healthy.</span></div>
{/snippet}

{#snippet richIcon()}
    <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
    >
        <path d="M12 3v18M3 12h18" />
    </svg>
{/snippet}

<main
    id="main-content"
    class="playground-page"
    inert={!ready}
    data-playground-ready={ready}
>
    <header class="playground-header">
        <h1>Playground</h1>
        <div
            class="playground-modes"
            role="group"
            aria-label="Playground mode"
        >
            <Button
                variant={mode === 'build' ? 'secondary' : 'ghost'}
                aria-pressed={mode === 'build'}
                onclick={() => (mode = 'build')}>Build a toast</Button
            ><Button
                variant={mode === 'examples' ? 'secondary' : 'ghost'}
                aria-pressed={mode === 'examples'}
                onclick={() => (mode = 'examples')}>Examples</Button
            >
        </div>
    </header>

    {#if mode === 'build'}
        <ToastBuilder />
    {:else}
        <div class="playground-layout">
            <aside
                class="scenario-rail"
                aria-label="Notification scenarios"
            >
                <div class="builder-field">
                    <Select.Root
                        items={scenarios.map((scenario) => ({ value: scenario.id, label: scenario.label }))}
                        value={selectedScenarioId}
                        onValueChange={(value) => {
                            if (value) selectScenario(value);
                        }}
                    >
                        <Select.Label>Example</Select.Label><Select.Trigger><Select.Value /></Select.Trigger>
                        <Select.Popup alignItemWithTrigger={false}
                            >{#each scenarios as scenario (scenario.id)}<Select.Item value={scenario.id}
                                    >{scenario.label}</Select.Item
                                >{/each}</Select.Popup
                        >
                    </Select.Root>
                </div>
                <p
                    class="example-description"
                    data-scenario-detail
                >
                    {selectedScenario.outcome}
                </p>
                <div class="position-field">
                    <Select.Root
                        items={positions}
                        value={selectedPosition}
                        onValueChange={(value) => {
                            if (value) selectedPosition = value;
                        }}
                        aria-label="Toast position"
                    >
                        <Select.Label>Position</Select.Label>
                        <Select.Trigger><Select.Value /></Select.Trigger>
                        <Select.Popup alignItemWithTrigger={false}>
                            {#each positions as position (position.value)}
                                <Select.Item value={position.value}>{position.label}</Select.Item>
                            {/each}
                        </Select.Popup>
                    </Select.Root>
                </div>
                <Button
                    class="run-example"
                    type="button"
                    onclick={runScenario}>Run example <span aria-hidden="true">↗</span></Button
                >
            </aside>

            <section
                class="playground-workspace"
                aria-label="Example preview"
            >
                <span
                    class="visually-hidden"
                    aria-live="polite">{selectedStatus}</span
                >
                <PreviewPanel
                    source={selectedSource}
                    bind:viewMode
                    label={`${selectedScenario.label} example`}
                    onClear={() => {
                        clearCompletion();
                        previewExiting = true;
                    }}
                    clearDisabled={previewExiting}
                >
                    <div class="preview-stage">
                        <div
                            class={[
                                'playground-toast-host',
                                {
                                    'at-top': selectedPosition.startsWith('top'),
                                    'at-bottom': selectedPosition.startsWith('bottom'),
                                    'at-left': selectedPosition.endsWith('left'),
                                    'at-center': selectedPosition.endsWith('center'),
                                    'at-right': selectedPosition.endsWith('right')
                                }
                            ]}
                            data-playground-preview
                        >
                            <Sileo
                                id="scenario-preview"
                                className="embedded-toast"
                                toastState={preview.state}
                                title={preview.title}
                                description={preview.description}
                                icon={preview.icon}
                                fill={preview.fill}
                                styles={preview.styles}
                                classes={preview.classes}
                                button={previewButton}
                                roundness={preview.roundness}
                                exiting={previewExiting}
                                refreshKey={previewKey}
                                position={previewAlignment(selectedPosition)}
                                expand={previewExpansion(selectedPosition)}
                                canExpand
                                autoExpandDelayMs={preview.state === 'loading' ? undefined : 120}
                            />
                        </div>
                    </div>
                </PreviewPanel>
            </section>
        </div>
    {/if}
</main>
