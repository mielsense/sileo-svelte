import type { Snippet } from 'svelte';
import { sileo, type SileoOptions, type SileoPosition, type SileoState } from '$lib/index.js';

export interface ScenarioContext {
    position: SileoPosition;
    richDescription: Snippet;
    richIcon: Snippet;
}

export interface ScenarioToast extends SileoOptions {
    state: SileoState;
}

export interface ScenarioCompletion {
    trigger: 'run' | 'button';
    delayMs: number;
    pending?: ScenarioToast;
    final: ScenarioToast;
}

export interface Scenario {
    id: string;
    label: string;
    eyebrow: string;
    outcome: string;
    parameters: string[];
    source: (position: SileoPosition) => string;
    initial: (context: ScenarioContext) => ScenarioToast;
    completion?: ScenarioCompletion;
    run: (context: ScenarioContext) => string;
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const scriptExample = (position: SileoPosition, body: string, button = 'Run example') => `<script lang="ts">
    import { sileo } from 'sileo-svelte';

    const position = '${position}';

${body
    .split('\n')
    .map((line) => (line ? `    ${line}` : ''))
    .join('\n')}
</script>

<button onclick={run}>${button}</button>`;

const coreInitial = (position: SileoPosition): ScenarioToast => ({
    state: 'success',
    title: 'Release saved',
    description: 'Draft v2.4 is ready for review.',
    position
});

const promiseInitial = (position: SileoPosition): ScenarioToast => ({
    state: 'loading',
    title: 'Uploading build',
    position,
    duration: null
});

const actionInitial = (position: SileoPosition): ScenarioToast => ({
    state: 'action',
    title: 'Payment needs attention',
    description: 'The first charge was declined.',
    position,
    duration: null,
    button: {
        title: 'Retry',
        onClick: (id) => {
            sileo.update(id, {
                state: 'loading',
                title: 'Retrying payment'
            });
            setTimeout(() => {
                sileo.update(id, {
                    state: 'success',
                    title: 'Payment captured'
                });
            }, 1400);
        }
    }
});

const scopedInitial = (position: SileoPosition): ScenarioToast => ({
    state: 'info',
    title: 'Invoice ready',
    description: 'Invoice 4921 can be downloaded.',
    position,
    duration: 4000,
    fill: '#181818'
});

const stylesInitial = (position: SileoPosition): ScenarioToast => ({
    state: 'action',
    title: 'Custom surface',
    description: 'Typed styles stay with this toast.',
    position,
    fill: '#1f1f1f',
    roundness: 8,
    duration: null,
    styles: {
        buttonBackground: '#ffffff',
        buttonColor: '#000000'
    },
    button: {
        title: 'Close',
        onClick: (id) => sileo.close(id)
    }
});

export const scenarios: Scenario[] = [
    {
        id: 'core',
        label: 'Core states',
        eyebrow: 'State helpers',
        outcome: 'Create a semantic toast with a title, description, and the currently selected viewport.',
        parameters: ['state: success', 'duration: 6000ms', 'autopilot: true'],
        source: (position) =>
            scriptExample(
                position,
                `function run() {
    sileo.success({
        title: 'Release saved',
        description: 'Draft v2.4 is ready for review.',
        position
    });
}`
            ),
        initial: ({ position }) => coreInitial(position),
        run: ({ position }) => sileo.success(coreInitial(position))
    },
    {
        id: 'promise',
        label: 'Async promise',
        eyebrow: 'One continuous toast',
        outcome: 'Keep one toast id while an asynchronous task moves from loading to success.',
        parameters: ['loading: persistent', 'result: deterministic', 'position: preserved'],
        source: (position) =>
            scriptExample(
                position,
                `const delay = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

function run() {
    const id = sileo.loading({
        title: 'Uploading build',
        position
    });

    void sileo.promise(() => delay(900), {
        id,
        loading: { title: 'Uploading build' },
        success: {
            title: 'Build uploaded',
            description: 'Artifacts are ready for release.'
        },
        error: { title: 'Upload failed' }
    });
}`
            ),
        initial: ({ position }) => promiseInitial(position),
        completion: {
            trigger: 'run',
            delayMs: 900,
            final: {
                state: 'success',
                title: 'Build uploaded',
                description: 'Artifacts are ready for release.'
            }
        },
        run: ({ position }) => {
            const id = sileo.loading({
                title: 'Uploading build',
                position
            });

            void sileo.promise(() => delay(900), {
                id,
                loading: { title: 'Uploading build' },
                success: {
                    title: 'Build uploaded',
                    description: 'Artifacts are ready for release.'
                },
                error: { title: 'Upload failed' }
            });
            return id;
        }
    },
    {
        id: 'action',
        label: 'Action and retry',
        eyebrow: 'Persistent interaction',
        outcome: 'Give the reader time to act, then reuse the same toast for a deterministic retry.',
        parameters: ['state: action', 'duration: null', 'id: reused'],
        source: (position) =>
            scriptExample(
                position,
                `function run() {
    sileo.action({
        title: 'Payment needs attention',
        description: 'The first charge was declined.',
        position,
        button: {
            title: 'Retry',
            onClick: (id) => {
                sileo.update(id, {
                    state: 'loading',
                    title: 'Retrying payment'
                });
                setTimeout(() => {
                    sileo.update(id, {
                        state: 'success',
                        title: 'Payment captured'
                    });
                }, 1400);
            }
        }
    });
}`
            ),
        initial: ({ position }) => actionInitial(position),
        completion: {
            trigger: 'button',
            delayMs: 1400,
            pending: {
                state: 'loading',
                title: 'Retrying payment'
            },
            final: {
                state: 'success',
                title: 'Payment captured'
            }
        },
        run: ({ position }) => sileo.action(actionInitial(position))
    },
    {
        id: 'scoped',
        label: 'Scoped defaults',
        eyebrow: 'Reusable configuration',
        outcome: 'Create a local API with shared defaults while the selected viewport still stays explicit.',
        parameters: ['duration: 4000ms', 'fill: #181818', 'scope: billing'],
        source: (position) =>
            scriptExample(
                position,
                `const billing = sileo.with({
    duration: 4000,
    fill: '#181818'
});

function run() {
    billing.info({
        title: 'Invoice ready',
        description: 'Invoice 4921 can be downloaded.',
        position
    });
}`
            ),
        initial: ({ position }) => scopedInitial(position),
        run: ({ position }) => {
            const billing = sileo.with({
                duration: 4000,
                fill: '#181818'
            });
            return billing.info({
                title: 'Invoice ready',
                description: 'Invoice 4921 can be downloaded.',
                position
            });
        }
    },
    {
        id: 'styles',
        label: 'Custom styles',
        eyebrow: 'Per toast variables',
        outcome: 'Set typed colors and roundness on one toast. The package does not require a utility CSS framework.',
        parameters: ['roundness: 8', 'fill: #1f1f1f', 'button style: local'],
        source: (position) =>
            scriptExample(
                position,
                `function run() {
    sileo.action({
        title: 'Custom surface',
        description: 'Typed styles stay with this toast.',
        position,
        fill: '#1f1f1f',
        roundness: 8,
        styles: {
            buttonBackground: '#ffffff',
            buttonColor: '#000000'
        },
        button: {
            title: 'Close',
            onClick: (id) => sileo.close(id)
        }
    });
}`
            ),
        initial: ({ position }) => stylesInitial(position),
        run: ({ position }) => sileo.action(stylesInitial(position))
    },
    {
        id: 'snippets',
        label: 'Rich snippets',
        eyebrow: 'Native Svelte content',
        outcome: 'Pass Svelte snippets to the description and icon fields for structured notification content.',
        parameters: ['description: Snippet', 'icon: Snippet', 'state: info'],
        source: (position) => `<script lang="ts">
    import { sileo } from 'sileo-svelte';

    const position = '${position}';

    function run() {
        sileo.info({
            title: 'Release details',
            description: releaseDetails,
            icon: releaseIcon,
            position
        });
    }
</script>

{#snippet releaseDetails()}
    <div class="rich-description">
        <strong>Release v2.4</strong>
        <span>Six regions are healthy.</span>
    </div>
{/snippet}

{#snippet releaseIcon()}
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

<button onclick={run}>Run example</button>

<style>
    .rich-description {
        display: grid;
        gap: 4px;
    }
</style>`,
        initial: ({ position, richDescription, richIcon }) => ({
            state: 'info',
            title: 'Release details',
            description: richDescription,
            icon: richIcon,
            position
        }),
        run: ({ position, richDescription, richIcon }) =>
            sileo.info({
                title: 'Release details',
                description: richDescription,
                icon: richIcon,
                position
            })
    }
];
