import type { Snippet } from 'svelte';
import { sileo, type SileoPosition } from '$lib/index.js';

export interface ScenarioContext {
    position: SileoPosition;
    richDescription: Snippet;
    richIcon: Snippet;
}

export interface Scenario {
    id: string;
    label: string;
    eyebrow: string;
    outcome: string;
    parameters: string[];
    code: string;
    run: (context: ScenarioContext) => void;
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const scenarios: Scenario[] = [
    {
        id: 'core',
        label: 'Core states',
        eyebrow: 'State helpers',
        outcome: 'Create a semantic toast with a title, description, and the currently selected viewport.',
        parameters: ['state: success', 'duration: 6000ms', 'autopilot: true'],
        code: `sileo.success({
    title: 'Release saved',
    description: 'Draft v2.4 is ready for review.',
    position
});`,
        run: ({ position }) => {
            sileo.success({
                title: 'Release saved',
                description: 'Draft v2.4 is ready for review.',
                position
            });
        }
    },
    {
        id: 'promise',
        label: 'Async promise',
        eyebrow: 'One continuous toast',
        outcome: 'Keep one toast id while an asynchronous task moves from loading to success.',
        parameters: ['loading: persistent', 'result: deterministic', 'position: preserved'],
        code: `sileo.promise(() => delay(900), {
    position,
    loading: { title: 'Uploading build' },
    success: {
        title: 'Build uploaded',
        description: 'Artifacts are ready for release.'
    },
    error: { title: 'Upload failed' }
});`,
        run: ({ position }) => {
            void sileo.promise(() => delay(900), {
                position,
                loading: { title: 'Uploading build' },
                success: {
                    title: 'Build uploaded',
                    description: 'Artifacts are ready for release.'
                },
                error: { title: 'Upload failed' }
            });
        }
    },
    {
        id: 'action',
        label: 'Action and retry',
        eyebrow: 'Persistent interaction',
        outcome: 'Give the reader time to act, then reuse the same toast for a deterministic retry.',
        parameters: ['state: action', 'duration: null', 'id: reused'],
        code: `sileo.action({
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
            }, 900);
        }
    }
});`,
        run: ({ position }) => {
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
                        }, 900);
                    }
                }
            });
        }
    },
    {
        id: 'scoped',
        label: 'Scoped defaults',
        eyebrow: 'Reusable configuration',
        outcome: 'Create a local API with shared defaults while the selected viewport still stays explicit.',
        parameters: ['duration: 4000ms', 'fill: #181818', 'scope: billing'],
        code: `const billing = sileo.with({
    duration: 4000,
    fill: '#181818'
});

billing.info({
    title: 'Invoice ready',
    description: 'Invoice 4921 can be downloaded.',
    position
});`,
        run: ({ position }) => {
            const billing = sileo.with({
                duration: 4000,
                fill: '#181818'
            });

            billing.info({
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
        outcome: 'Adjust the product surface with typed style values without adding a utility CSS dependency.',
        parameters: ['roundness: 8', 'fill: #1f1f1f', 'button style: local'],
        code: `sileo.action({
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
});`,
        run: ({ position }) => {
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
        }
    },
    {
        id: 'snippets',
        label: 'Rich snippets',
        eyebrow: 'Native Svelte content',
        outcome: 'Pass Svelte snippets to the description and icon fields for structured notification content.',
        parameters: ['description: Snippet', 'icon: Snippet', 'state: info'],
        code: `{#snippet releaseDetails()}
    <strong>Release v2.4</strong>
    <span>Six regions are healthy.</span>
{/snippet}

sileo.info({
    title: 'Release details',
    description: releaseDetails,
    icon: releaseIcon,
    position
});`,
        run: ({ position, richDescription, richIcon }) => {
            sileo.info({
                title: 'Release details',
                description: richDescription,
                icon: richIcon,
                position
            });
        }
    }
];
