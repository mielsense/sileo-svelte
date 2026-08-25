<script lang="ts">
    import { onDestroy } from 'svelte';
    import { resolve } from '$app/paths';
    import { page } from '$app/state';
    import svelteLanguage from 'svelte-highlight/languages/svelte';
    import { ensureRegistered, registry } from 'svelte-highlight/registry';
    import Sileo from '$lib/Sileo.svelte';
    import type { SileoButton, SileoPosition } from '$lib/index.js';
    import { scenarios, type ScenarioCompletion, type ScenarioToast } from '../_components/scenarios.js';

    ensureRegistered(svelteLanguage);

    const positions: Array<{ value: SileoPosition; label: string }> = [
        { value: 'top-left', label: 'Top left' },
        { value: 'top-center', label: 'Top center' },
        { value: 'top-right', label: 'Top right' },
        { value: 'bottom-left', label: 'Bottom left' },
        { value: 'bottom-center', label: 'Bottom center' },
        { value: 'bottom-right', label: 'Bottom right' }
    ];

    let selectedScenarioId = $state('core');
    let selectedPosition = $state<SileoPosition>('top-right');
    let copyStatus = $state('');
    let selectedStatus = $state('');
    let preview = $state<ScenarioToast>({
        state: 'success',
        title: 'Release saved',
        description: 'Draft v2.4 is ready for review.',
        position: 'top-right'
    });
    let previewKey = $state('preview-0');
    let previewExiting = $state(false);
    let executionId: string | undefined;
    let sequence = 0;
    let timer: number | undefined;

    const selectedScenario = $derived(scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0]);
    const selectedSource = $derived(selectedScenario.source(selectedPosition));
    const highlightedSource = $derived(registry.highlight(selectedSource, { language: svelteLanguage.name }).value);
    const canonicalUrl = $derived(new URL(page.url.pathname, page.url.origin).href);
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
        copyStatus = '';
        executionId = undefined;
        const next = scenarios.find((scenario) => scenario.id === id);
        if (next) updatePreview(next.initial(context()));
    }

    function runScenario() {
        clearCompletion();
        const currentContext = context();
        updatePreview(selectedScenario.initial(currentContext));
        executionId = selectedScenario.run(currentContext);
        if (selectedScenario.completion?.trigger === 'run') scheduleCompletion(selectedScenario.completion);
    }

    function handlePreviewButton() {
        if (executionId) preview.button?.onClick(executionId);
        const completion = selectedScenario.completion;
        if (completion?.trigger === 'button') {
            if (completion.pending) updatePreview(completion.pending);
            scheduleCompletion(completion);
        } else {
            previewExiting = true;
        }
    }

    async function copySource() {
        try {
            await navigator.clipboard.writeText(selectedSource);
            copyStatus = `${selectedScenario.label} example copied`;
        } catch {
            copyStatus = `Could not copy the ${selectedScenario.label} example`;
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
>
    <header class="playground-header">
        <div>
            <p class="doc-kicker">Interactive reference</p>
            <h1>Notification playground</h1>
            <p>Run the package against six real scenarios. The source updates with the selected viewport position.</p>
        </div>
        <a
            class="secondary-action"
            href={resolve('/docs')}>Read the docs</a
        >
    </header>

    <div class="playground-layout shadow-elevated">
        <aside
            class="scenario-rail"
            aria-label="Notification scenarios"
        >
            <p>Scenarios</p>
            {#each scenarios as scenario (scenario.id)}
                <button
                    type="button"
                    aria-pressed={selectedScenarioId === scenario.id}
                    onclick={() => selectScenario(scenario.id)}
                >
                    <span>{scenario.label}</span>
                    <small>{scenario.eyebrow}</small>
                </button>
            {/each}
        </aside>

        <section
            class="playground-workspace"
            aria-labelledby="scenario-title"
        >
            <div
                class="scenario-summary"
                data-scenario-detail
                class:scenario-enter={selectedScenarioId}
            >
                <div>
                    <p>{selectedScenario.eyebrow}</p>
                    <h2 id="scenario-title">{selectedScenario.label}</h2>
                    <span>{selectedScenario.outcome}</span>
                </div>
                <button
                    class="primary-action"
                    type="button"
                    onclick={runScenario}>Run example</button
                >
            </div>
            <span
                class="visually-hidden"
                aria-live="polite">{selectedStatus}</span
            >

            <div
                class="position-picker"
                role="radiogroup"
                aria-label="Toast position"
            >
                {#each positions as position (position.value)}
                    <label>
                        <input
                            type="radio"
                            name="position"
                            value={position.value}
                            bind:group={selectedPosition}
                        />
                        <span>{position.label}</span>
                    </label>
                {/each}
            </div>

            <div class="preview-stage">
                <div
                    class="preview-grid"
                    aria-hidden="true"
                ></div>
                <div class="preview-label">
                    <span>Live viewport</span><strong
                        >{positions.find((item) => item.value === selectedPosition)?.label}</strong
                    >
                </div>
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

            <div class="scenario-details">
                <div>
                    <p>Runtime values</p>
                    <ul>
                        {#each selectedScenario.parameters as parameter (parameter)}<li>{parameter}</li>{/each}
                    </ul>
                </div>
            </div>
        </section>

        <aside
            class="source-panel"
            aria-label="Example source"
        >
            <div class="source-toolbar">
                <span>Example.svelte</span>
                <button
                    type="button"
                    aria-label={`Copy ${selectedScenario.label} example`}
                    onclick={copySource}>Copy</button
                >
            </div>
            <!-- Highlighted HTML is generated from package-owned scenario strings, not user input. -->
            <!-- eslint-disable svelte/no-at-html-tags -->
            <pre aria-label={`${selectedScenario.label} source code`}><code
                    class="hljs"
                    data-scenario-source>{@html highlightedSource}</code
                ></pre>
            <!-- eslint-enable svelte/no-at-html-tags -->
            <p aria-live="polite">{copyStatus}</p>
        </aside>
    </div>
</main>
