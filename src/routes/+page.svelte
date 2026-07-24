<script lang="ts">
    import type { Action } from 'svelte/action';
    import { page } from '$app/state';
    import { sileo, type SileoPosition } from '$lib/index.js';
    import { scenarios } from './_components/scenarios.js';

    const positions: { value: SileoPosition; label: string }[] = [
        { value: 'top-left', label: 'Top left' },
        { value: 'top-center', label: 'Top center' },
        { value: 'top-right', label: 'Top right' },
        { value: 'bottom-left', label: 'Bottom left' },
        { value: 'bottom-center', label: 'Bottom center' },
        { value: 'bottom-right', label: 'Bottom right' }
    ];

    const mountCode = `<script lang="ts">
    import { Toaster } from 'sileo-svelte';
    import 'sileo-svelte/styles.css';

    let { children } = $props();
\u003C/script>

{@render children()}
<Toaster position="top-right" />`;

    const updateCode = `const id = sileo.loading('Uploading release');

sileo.update(id, {
    state: 'success',
    title: 'Release uploaded',
    description: 'The same toast changed in place.'
});

sileo.close(id);`;

    const promiseCode = `await sileo.promise(() => publishRelease(), {
    loading: { title: 'Publishing release' },
    success: (release) => ({
        title: \`\${release.version} is live\`
    }),
    error: (error) => ({
        title: 'Publish failed',
        description: error instanceof Error ? error.message : 'Unknown error'
    })
});`;

    const scopedCode = `const billing = sileo.with({
    position: 'bottom-right',
    duration: 4000,
    styles: { titleColor: '#ffffff' }
});

billing.success('Invoice paid');`;

    let selectedScenarioId = $state('core');
    let selectedPosition = $state<SileoPosition>('top-right');
    let installStatus = $state('');
    let scenarioCopyStatus = $state('');
    let referenceCopyStatus = $state('');

    const selectedScenario = $derived(scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0]);
    const canonicalUrl = $derived(new URL(page.url.pathname, page.url.origin).href);
    const socialImageUrl = $derived(new URL('/og-image.svg', page.url.origin).href);

    type TokenKind = 'plain' | 'keyword' | 'string' | 'comment' | 'function';
    interface CodeToken {
        text: string;
        kind: TokenKind;
    }

    function tokenize(source: string): CodeToken[] {
        const matcher =
            /(\/\/[^\n]*|`(?:\\.|[^`])*`|'(?:\\.|[^'])*'|"(?:\\.|[^"])*"|\b(?:const|let|await|async|return|import|from|type|if|else|new)\b|\b(?:sileo|success|info|action|loading|update|promise|with|close)\b)/g;
        const tokens: CodeToken[] = [];
        let cursor = 0;

        for (const match of source.matchAll(matcher)) {
            const index = match.index ?? 0;
            if (index > cursor) tokens.push({ text: source.slice(cursor, index), kind: 'plain' });
            const text = match[0];
            const kind: TokenKind = text.startsWith('//')
                ? 'comment'
                : text.startsWith("'") || text.startsWith('"') || text.startsWith('`')
                  ? 'string'
                  : /^(const|let|await|async|return|import|from|type|if|else|new)$/.test(text)
                    ? 'keyword'
                    : 'function';
            tokens.push({ text, kind });
            cursor = index + text.length;
        }

        if (cursor < source.length) tokens.push({ text: source.slice(cursor), kind: 'plain' });
        return tokens;
    }

    async function writeClipboard(value: string): Promise<boolean> {
        try {
            await navigator.clipboard.writeText(value);
            return true;
        } catch {
            return false;
        }
    }

    async function copyInstall() {
        installStatus = (await writeClipboard('bun add sileo-svelte'))
            ? 'Install command copied'
            : 'Could not copy the install command';
    }

    async function copyScenario() {
        scenarioCopyStatus = (await writeClipboard(selectedScenario.code))
            ? `${selectedScenario.label} example copied`
            : `Could not copy the ${selectedScenario.label} example`;
    }

    async function copyReference(label: string, source: string) {
        referenceCopyStatus = (await writeClipboard(source))
            ? `${label} copied`
            : `Could not copy ${label.toLowerCase()}`;
    }

    function runScenario() {
        selectedScenario.run({
            position: selectedPosition,
            richDescription,
            richIcon
        });
    }

    function runHeroFlow() {
        const id = sileo.loading({
            title: 'Preparing preview',
            position: 'top-right'
        });

        setTimeout(() => {
            sileo.update(id, {
                state: 'success',
                title: 'Motion ready',
                description: 'The same toast changed state in place.'
            });
        }, 900);
    }

    const reveal: Action<HTMLElement> = (node) => {
        const prefersReducedMotion =
            typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
            node.classList.add('is-visible');
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    node.classList.add('is-visible');
                    observer.unobserve(node);
                }
            },
            { threshold: 0.12 }
        );
        observer.observe(node);

        return {
            destroy() {
                observer.disconnect();
            }
        };
    };
</script>

<svelte:head>
    <title>Sileo Svelte — physics-based toast notifications</title>
    <meta
        name="description"
        content="Physics-based, gooey toast notifications for Svelte 5 with typed helpers, promise flows, and rich snippets."
    />
    <meta
        name="theme-color"
        content="#000000"
    />
    <link
        rel="canonical"
        href={canonicalUrl}
    />
    <meta
        property="og:type"
        content="website"
    />
    <meta
        property="og:title"
        content="Sileo Svelte — physics-based toast notifications"
    />
    <meta
        property="og:description"
        content="Physics-based, gooey toast notifications for Svelte 5."
    />
    <meta
        property="og:image"
        content={socialImageUrl}
    />
    <meta
        property="og:url"
        content={canonicalUrl}
    />
    <meta
        property="og:image:alt"
        content="Sileo Svelte toast motion lab"
    />
    <meta
        name="twitter:card"
        content="summary_large_image"
    />
    <meta
        name="twitter:title"
        content="Sileo Svelte — physics-based toast notifications"
    />
    <meta
        name="twitter:description"
        content="Physics-based, gooey toast notifications for Svelte 5."
    />
    <meta
        name="twitter:image"
        content={socialImageUrl}
    />
</svelte:head>

{#snippet richDescription()}
    <div class="rich-description">
        <strong>Release v2.4</strong>
        <span>Six regions are healthy.</span>
    </div>
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

<main id="main-content">
    <section
        class="hero"
        aria-labelledby="hero-title"
    >
        <div class="hero-inner">
            <div class="hero-copy">
                <p class="eyebrow hero-enter enter-one">Sileo Svelte · notification motion lab</p>
                <h1
                    id="hero-title"
                    class="hero-enter enter-two"
                >
                    Toast motion that feels native to Svelte.
                </h1>
                <p class="hero-lede hero-enter enter-three">Physics-based, gooey notifications built for Svelte 5.</p>
                <div class="install-flow hero-enter enter-four">
                    <button
                        class="install-button"
                        type="button"
                        aria-label="Copy bun install command"
                        onclick={copyInstall}
                    >
                        <span aria-hidden="true">$</span>
                        <code>bun add sileo-svelte</code>
                        <span class="copy-label">Copy</span>
                    </button>
                    <span class="npm-option">npm i sileo-svelte</span>
                </div>
                <p
                    class="copy-status"
                    aria-live="polite"
                >
                    {installStatus}
                </p>
            </div>

            <div class="hero-stage hero-enter enter-stage">
                <div class="stage-axis axis-top">
                    <span>state</span>
                    <span>success</span>
                </div>
                <div class="toast-specimen">
                    <div class="toast-topline">
                        <span
                            class="state-mark"
                            aria-hidden="true">✓</span
                        >
                        <strong>Release is live</strong>
                        <span class="toast-time">now</span>
                    </div>
                    <p>Traffic moved to v2.4 across six regions.</p>
                    <div
                        class="toast-progress"
                        aria-hidden="true"
                    >
                        <span></span>
                    </div>
                </div>
                <div class="stage-axis axis-bottom">
                    <span>motion</span>
                    <span>spring · morph · settle</span>
                </div>
                <button
                    class="primary-button"
                    type="button"
                    onclick={runHeroFlow}>Try the motion</button
                >
            </div>
        </div>
    </section>

    <section
        id="playground"
        class="section playground"
        aria-labelledby="playground-title"
        data-reveal
        use:reveal
    >
        <header class="section-heading">
            <p class="eyebrow">Playground</p>
            <h2 id="playground-title">One scenario at a time.</h2>
            <p>Choose a workflow, keep a viewport, and run the exact code shown beside it.</p>
        </header>

        <div class="playground-grid">
            <aside
                class="lab-stage"
                aria-label="Live example controls"
            >
                <div class="sticky-stage">
                    <div class="stage-readout">
                        <span>Live viewport</span>
                        <strong>{positions.find((position) => position.value === selectedPosition)?.label}</strong>
                    </div>
                    <div
                        class="position-control"
                        role="radiogroup"
                        aria-label="Toast position"
                    >
                        {#each positions as position (position.value)}
                            <label>
                                <input
                                    type="radio"
                                    name="toast-position"
                                    value={position.value}
                                    bind:group={selectedPosition}
                                />
                                <span>{position.label}</span>
                            </label>
                        {/each}
                    </div>
                    <div
                        class="stage-diagram"
                        aria-hidden="true"
                    >
                        <span class:active={selectedPosition === 'top-left'}></span>
                        <span class:active={selectedPosition === 'top-center'}></span>
                        <span class:active={selectedPosition === 'top-right'}></span>
                        <span class:active={selectedPosition === 'bottom-left'}></span>
                        <span class:active={selectedPosition === 'bottom-center'}></span>
                        <span class:active={selectedPosition === 'bottom-right'}></span>
                    </div>
                </div>
            </aside>

            <div class="scenario-workspace">
                <nav
                    class="scenario-list"
                    aria-label="Notification scenarios"
                >
                    {#each scenarios as scenario, index (scenario.id)}
                        <button
                            type="button"
                            aria-label={scenario.label}
                            aria-pressed={selectedScenarioId === scenario.id}
                            class:active={selectedScenarioId === scenario.id}
                            onclick={() => {
                                selectedScenarioId = scenario.id;
                                scenarioCopyStatus = '';
                            }}
                        >
                            <span>{String(index + 1).padStart(2, '0')}</span>
                            <strong>{scenario.label}</strong>
                            <span aria-hidden="true">→</span>
                        </button>
                    {/each}
                </nav>

                <article
                    class="scenario-detail"
                    aria-live="polite"
                >
                    <div class="scenario-copy">
                        <p class="eyebrow">{selectedScenario.eyebrow}</p>
                        <h3>{selectedScenario.label}</h3>
                        <p>{selectedScenario.outcome}</p>
                        <dl class="parameter-list">
                            {#each selectedScenario.parameters as parameter (parameter)}
                                {@const [name, value] = parameter.split(': ')}
                                <div>
                                    <dt>{name}</dt>
                                    <dd>{value}</dd>
                                </div>
                            {/each}
                        </dl>
                    </div>

                    <div class="code-plane">
                        <div class="code-toolbar">
                            <span>example.svelte</span>
                            <button
                                type="button"
                                aria-label={`Copy ${selectedScenario.label} example`}
                                onclick={copyScenario}>Copy code</button
                            >
                        </div>
                        <pre
                            data-scenario-source
                            aria-label={`${selectedScenario.label} source code`}><code
                                >{#each tokenize(selectedScenario.code) as token, tokenIndex (tokenIndex)}<span
                                        class:code-keyword={token.kind === 'keyword'}
                                        class:code-string={token.kind === 'string'}
                                        class:code-comment={token.kind === 'comment'}
                                        class:code-function={token.kind === 'function'}>{token.text}</span
                                    >{/each}</code
                            ></pre>
                    </div>
                    <div class="scenario-actions">
                        <p
                            class="copy-status"
                            aria-live="polite"
                        >
                            {scenarioCopyStatus}
                        </p>
                        <button
                            class="primary-button"
                            type="button"
                            aria-label={`Run ${selectedScenario.label} example`}
                            onclick={runScenario}>Run example</button
                        >
                    </div>
                </article>
            </div>
        </div>
    </section>

    <section
        id="docs"
        class="section docs"
        aria-labelledby="docs-title"
        data-reveal
        use:reveal
    >
        <header class="section-heading">
            <p class="eyebrow">Start here</p>
            <h2 id="docs-title">Mount once. Call from anywhere.</h2>
            <p>The package is Svelte 5 native and ships its toast styles as a separate export.</p>
        </header>

        <div class="docs-row">
            <div class="docs-copy">
                <span class="step-number">01</span>
                <h3>Install and mount</h3>
                <p>Import the stylesheet once, then place one <code>&lt;Toaster&gt;</code> in your root layout.</p>
                <div class="command-line"><span>$</span><code>bun add sileo-svelte</code></div>
            </div>
            <div class="code-plane reference-code">
                <div class="code-toolbar">
                    <span>src/routes/+layout.svelte</span>
                    <button
                        type="button"
                        onclick={() => copyReference('Mount example', mountCode)}>Copy</button
                    >
                </div>
                <pre aria-label="Mount example source code"><code>{mountCode}</code></pre>
            </div>
        </div>

        <div class="docs-row">
            <div class="docs-copy">
                <span class="step-number">02</span>
                <h3>Create, update, close</h3>
                <p>
                    Creation helpers return an id. Reuse it to morph content, then choose a collapse or immediate exit.
                </p>
                <ul>
                    <li><code>update</code> morphs the current toast.</li>
                    <li><code>close</code> collapses before exit.</li>
                    <li><code>dismiss</code> starts exit immediately.</li>
                    <li><code>clear</code> removes one viewport or all.</li>
                </ul>
            </div>
            <div class="code-plane reference-code">
                <div class="code-toolbar">
                    <span>update.ts</span>
                    <button
                        type="button"
                        onclick={() => copyReference('Update example', updateCode)}>Copy</button
                    >
                </div>
                <pre aria-label="Update example source code"><code>{updateCode}</code></pre>
            </div>
        </div>

        <div class="docs-row">
            <div class="docs-copy">
                <span class="step-number">03</span>
                <h3>Promise workflow</h3>
                <p>
                    <code>sileo.promise</code> preserves the original promise result and moves one toast through each state.
                </p>
            </div>
            <div class="code-plane reference-code">
                <div class="code-toolbar">
                    <span>publish.ts</span>
                    <button
                        type="button"
                        onclick={() => copyReference('Promise example', promiseCode)}>Copy</button
                    >
                </div>
                <pre aria-label="Promise example source code"><code>{promiseCode}</code></pre>
            </div>
        </div>

        <div class="docs-row">
            <div class="docs-copy">
                <span class="step-number">04</span>
                <h3>Scoped defaults</h3>
                <p>
                    <code>sileo.with</code> returns a scoped API. Nested <code>classes</code> and <code>styles</code> merge
                    by key.
                </p>
            </div>
            <div class="code-plane reference-code">
                <div class="code-toolbar">
                    <span>billing.ts</span>
                    <button
                        type="button"
                        onclick={() => copyReference('Scoped example', scopedCode)}>Copy</button
                    >
                </div>
                <pre aria-label="Scoped example source code"><code>{scopedCode}</code></pre>
            </div>
        </div>

        <p
            class="reference-status"
            aria-live="polite"
        >
            {referenceCopyStatus}
        </p>
    </section>

    <section
        class="section appearance"
        aria-labelledby="appearance-title"
        data-reveal
        use:reveal
    >
        <header class="section-heading">
            <p class="eyebrow">Appearance</p>
            <h2 id="appearance-title">Style the toast, not the site.</h2>
            <p>
                Use typed per-toast styles for local changes and CSS variables for system-wide geometry and state color.
            </p>
        </header>

        <div class="appearance-grid">
            <div>
                <h3>Geometry variables</h3>
                <dl class="variable-list">
                    <div>
                        <dt><code>--sileo-duration</code></dt>
                        <dd>600ms</dd>
                    </div>
                    <div>
                        <dt><code>--sileo-height</code></dt>
                        <dd>40px</dd>
                    </div>
                    <div>
                        <dt><code>--sileo-width</code></dt>
                        <dd>350px</dd>
                    </div>
                    <div>
                        <dt><code>--sileo-z-index</code></dt>
                        <dd>2147483647</dd>
                    </div>
                </dl>
            </div>
            <div>
                <h3>Typed appearance</h3>
                <p>
                    <code>SileoClasses</code> targets title, description, badge, and button. <code>SileoStyles</code>
                    maps typed colors to local CSS variables, including hover background.
                </p>
                <p>
                    Set <code>fill</code>, <code>roundness</code>, or <code>icon: null</code> per toast. Semantic state
                    colors remain controlled by <code>--sileo-state-*</code>.
                </p>
            </div>
        </div>
    </section>

    <section
        id="api"
        class="section api"
        aria-labelledby="api-title"
        data-reveal
        use:reveal
    >
        <header class="section-heading">
            <p class="eyebrow">Public API</p>
            <h2 id="api-title">Small surface, typed end to end.</h2>
            <p>
                Every creation method returns a string id. Loading and action states stay open until updated or closed.
            </p>
        </header>

        <div class="api-block">
            <h3>Creation and lifecycle</h3>
            <div class="method-list">
                <code>show</code>
                <code>success</code>
                <code>error</code>
                <code>warning</code>
                <code>info</code>
                <code>action</code>
                <code>loading</code>
                <code>promise</code>
                <code>with</code>
                <code>update</code>
                <code>dismiss</code>
                <code>close</code>
                <code>clear</code>
            </div>
        </div>

        <div class="api-block">
            <h3><code>&lt;Toaster&gt;</code> props</h3>
            <div class="table-scroll">
                <table>
                    <thead>
                        <tr><th>Prop</th><th>Type</th><th>Default</th><th>Purpose</th></tr>
                    </thead>
                    <tbody>
                        <tr
                            ><td><code>position</code></td><td><code>SileoPosition</code></td><td>top-right</td><td
                                >Default viewport.</td
                            ></tr
                        >
                        <tr
                            ><td><code>offset</code></td><td>number, string, config</td><td>undefined</td><td
                                >Viewport edge offsets.</td
                            ></tr
                        >
                        <tr
                            ><td><code>options</code></td><td><code>Partial&lt;SileoOptions&gt;</code></td><td
                                >undefined</td
                            ><td>Global toast defaults.</td></tr
                        >
                        <tr
                            ><td><code>children</code></td><td>Snippet</td><td>undefined</td><td
                                >Content before viewports.</td
                            ></tr
                        >
                    </tbody>
                </table>
            </div>
        </div>

        <div class="api-block">
            <h3><code>SileoOptions</code></h3>
            <div class="table-scroll">
                <table>
                    <thead>
                        <tr><th>Field</th><th>Type</th><th>Default</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>title</code></td><td>string</td><td>State name</td></tr>
                        <tr><td><code>description</code></td><td>string or Snippet</td><td>undefined</td></tr>
                        <tr
                            ><td><code>position</code></td><td><code>SileoPosition</code></td><td>Toaster position</td
                            ></tr
                        >
                        <tr><td><code>duration</code></td><td>number or null</td><td>6000</td></tr>
                        <tr><td><code>icon</code></td><td>Snippet or null</td><td>State icon</td></tr>
                        <tr><td><code>classes</code></td><td><code>SileoClasses</code></td><td>undefined</td></tr>
                        <tr><td><code>styles</code></td><td><code>SileoStyles</code></td><td>undefined</td></tr>
                        <tr><td><code>fill</code></td><td>string</td><td>#1c1c1e</td></tr>
                        <tr><td><code>roundness</code></td><td>number</td><td>18</td></tr>
                        <tr><td><code>autopilot</code></td><td>boolean or timing config</td><td>true</td></tr>
                        <tr><td><code>button</code></td><td><code>SileoButton</code></td><td>undefined</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="api-block exports">
            <h3>Exported types</h3>
            <p>
                <code>SileoApi</code>, <code>SileoScopedApi</code>, <code>SileoInput</code>,
                <code>SileoOptions</code>, <code>SileoPosition</code>, <code>SileoState</code>,
                <code>SileoClasses</code>, <code>SileoStyles</code>, <code>SileoButton</code>, and
                <code>SileoPromiseOptions</code> are exported beside <code>Toaster</code> and <code>sileo</code>.
            </p>
        </div>
    </section>

    <section
        class="final-cta"
        aria-labelledby="final-title"
        data-reveal
        use:reveal
    >
        <p class="eyebrow">Ready to wire it in</p>
        <h2 id="final-title">Start with one toast.</h2>
        <a
            class="primary-button"
            href="https://github.com/mielsense/sileo-svelte"
            rel="noreferrer"
        >
            Read the source <span aria-hidden="true">↗</span>
        </a>
    </section>
</main>

<footer>
    <div class="footer-inner">
        <div>
            <strong>Sileo Svelte</strong>
            <p>An unofficial Svelte 5 port of Sileo by Aaryan.</p>
        </div>
        <nav aria-label="Project links">
            <a href="https://github.com/mielsense/sileo-svelte">GitHub</a>
            <a href="https://www.npmjs.com/package/sileo-svelte">npm</a>
            <a href="https://github.com/mielsense/sileo-svelte/blob/main/LICENSE">MIT license</a>
            <a href="https://github.com/hiaaryan/sileo">Original Sileo</a>
            <a href="https://github.com/mielsense">Author</a>
        </nav>
    </div>
</footer>

<style>
    main {
        overflow: clip;
    }

    .hero {
        display: grid;
        min-height: min(900px, 100dvh);
        padding: 96px 24px 64px;
        place-items: center;
        border-bottom: 1px solid var(--line);
    }

    .hero-inner {
        display: grid;
        width: min(100%, 76rem);
        grid-template-columns: minmax(0, 1fr) minmax(22rem, 0.86fr);
        align-items: center;
        gap: 80px;
    }

    .hero-copy {
        max-width: 43rem;
    }

    .eyebrow {
        margin: 0 0 16px;
        color: var(--text-muted);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        line-height: 16px;
        text-transform: uppercase;
    }

    h1,
    h2,
    h3,
    p {
        text-wrap: pretty;
    }

    h1,
    h2 {
        text-wrap: balance;
    }

    h1 {
        max-width: 12ch;
        margin: 0;
        background: linear-gradient(90deg, #ffffff, #9b9b9b);
        background-clip: text;
        color: transparent;
        font-size: clamp(48px, 6vw, 72px);
        font-weight: 700;
        letter-spacing: -0.055em;
        line-height: 1;
    }

    .hero-lede {
        max-width: 34rem;
        margin: 24px 0 0;
        color: var(--text-soft);
        font-size: 18px;
        line-height: 28px;
    }

    .install-flow {
        display: flex;
        margin-top: 32px;
        align-items: center;
        gap: 16px;
    }

    .install-button,
    .primary-button {
        border: 0;
        cursor: pointer;
        font-weight: 700;
        text-decoration: none;
        transition:
            background-color 200ms var(--ease-sileo),
            color 200ms var(--ease-sileo),
            transform 200ms var(--ease-sileo);
    }

    .install-button {
        display: inline-flex;
        min-height: 48px;
        padding: 8px 12px;
        align-items: center;
        gap: 12px;
        border-radius: 8px;
        background: #ffffff;
        color: #000000;
        font-size: 14px;
    }

    .install-button code {
        font-family: inherit;
        font-weight: 700;
    }

    .install-button > span:first-child {
        color: #666666;
    }

    .copy-label {
        padding-left: 12px;
        border-left: 1px solid #bdbdbd;
        color: #414141;
    }

    .install-button:hover,
    .primary-button:hover {
        background: #d9d9d9;
    }

    .install-button:active,
    .primary-button:active {
        transform: scale(0.98);
    }

    .npm-option {
        color: var(--text-muted);
        font-size: 12px;
        line-height: 16px;
    }

    .copy-status {
        min-height: 20px;
        margin: 8px 0 0;
        color: var(--text-muted);
        font-size: 12px;
        line-height: 20px;
    }

    .hero-stage {
        position: relative;
        display: grid;
        min-height: 30rem;
        padding: 32px;
        align-content: center;
        border-right: 1px solid var(--surface-3);
        border-left: 1px solid var(--surface-3);
    }

    .hero-stage::before,
    .hero-stage::after {
        position: absolute;
        right: 0;
        left: 0;
        height: 1px;
        background: var(--surface-3);
        content: '';
    }

    .hero-stage::before {
        top: 32px;
    }

    .hero-stage::after {
        bottom: 32px;
    }

    .stage-axis {
        position: absolute;
        right: 16px;
        left: 16px;
        display: flex;
        justify-content: space-between;
        color: #707070;
        font-size: 12px;
        line-height: 16px;
    }

    .axis-top {
        top: 8px;
    }

    .axis-bottom {
        bottom: 8px;
    }

    .toast-specimen {
        position: relative;
        width: min(100%, 22rem);
        margin: 0 auto;
        padding: 12px;
        border-radius: 18px;
        background: var(--surface-1);
        box-shadow: 0 24px 64px rgb(0 0 0 / 60%);
        transform: translateY(-8px);
    }

    .toast-topline {
        display: grid;
        grid-template-columns: 24px 1fr auto;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        line-height: 20px;
    }

    .state-mark {
        display: grid;
        width: 24px;
        height: 24px;
        place-items: center;
        border-radius: 9999px;
        background: #ffffff;
        color: #000000;
        font-size: 12px;
        font-weight: 700;
    }

    .toast-time {
        color: #707070;
        font-size: 12px;
    }

    .toast-specimen p {
        margin: 12px 0 16px 32px;
        color: var(--text-soft);
        font-size: 14px;
        line-height: 20px;
    }

    .toast-progress {
        height: 2px;
        margin-left: 32px;
        overflow: hidden;
        background: var(--surface-4);
    }

    .toast-progress span {
        display: block;
        width: 68%;
        height: 100%;
        background: #ffffff;
        transform-origin: left;
        animation: settle 2.4s var(--ease-sileo) infinite alternate;
    }

    .primary-button {
        display: inline-flex;
        min-height: 40px;
        padding: 8px 12px;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 4px;
        background: #ffffff;
        color: #000000;
        font-size: 16px;
        line-height: 24px;
    }

    .hero-stage .primary-button {
        width: fit-content;
        margin: 40px auto 0;
    }

    .hero-enter {
        animation: hero-in 700ms var(--ease-sileo) both;
    }

    .enter-two {
        animation-delay: 80ms;
    }

    .enter-three {
        animation-delay: 160ms;
    }

    .enter-four {
        animation-delay: 240ms;
    }

    .enter-stage {
        animation-delay: 160ms;
    }

    .section {
        width: min(100% - 48px, 76rem);
        margin: 0 auto;
        padding: 96px 0;
        border-bottom: 1px solid var(--line);
    }

    [data-reveal] {
        opacity: 0;
        transform: translateY(64px);
        transition:
            opacity 800ms var(--ease-sileo),
            transform 800ms var(--ease-sileo);
    }

    [data-reveal]:global(.is-visible) {
        opacity: 1;
        transform: translateY(0);
    }

    .section-heading {
        max-width: 42rem;
        margin-bottom: 64px;
    }

    .section-heading h2,
    .final-cta h2 {
        margin: 0;
        color: var(--text);
        font-size: clamp(36px, 5vw, 60px);
        font-weight: 700;
        letter-spacing: -0.05em;
        line-height: 1;
    }

    .section-heading > p:last-child {
        max-width: 60ch;
        margin: 24px 0 0;
        color: var(--text-soft);
        font-size: 18px;
        line-height: 28px;
    }

    .playground-grid {
        display: grid;
        grid-template-columns: minmax(16rem, 0.68fr) minmax(0, 1.32fr);
        gap: 64px;
        align-items: start;
    }

    .sticky-stage {
        position: sticky;
        top: 88px;
        min-height: 30rem;
        padding: 24px 0;
        border-top: 1px solid var(--surface-4);
        border-bottom: 1px solid var(--surface-4);
    }

    .stage-readout {
        display: flex;
        margin-bottom: 24px;
        justify-content: space-between;
        gap: 16px;
        font-size: 14px;
        line-height: 20px;
    }

    .stage-readout span {
        color: var(--text-muted);
    }

    .position-control {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4px;
    }

    .position-control label {
        position: relative;
        min-width: 0;
        cursor: pointer;
    }

    .position-control input {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        white-space: nowrap;
    }

    .position-control span {
        display: grid;
        min-height: 40px;
        padding: 4px;
        place-items: center;
        border: 1px solid var(--surface-3);
        border-radius: 4px;
        color: var(--text-muted);
        font-size: 12px;
        line-height: 16px;
        text-align: center;
        transition:
            background-color 200ms var(--ease-sileo),
            border-color 200ms var(--ease-sileo),
            color 200ms var(--ease-sileo),
            transform 200ms var(--ease-sileo);
    }

    .position-control input:checked + span {
        border-color: #ffffff;
        background: #ffffff;
        color: #000000;
    }

    .position-control input:focus-visible + span {
        outline: 2px solid #ffffff;
        outline-offset: 2px;
    }

    .position-control label:active span {
        transform: scale(0.98);
    }

    .stage-diagram {
        display: grid;
        height: 18rem;
        margin-top: 24px;
        padding: 16px;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: 1fr 1fr;
        align-items: start;
        gap: 16px;
        border: 1px solid var(--surface-3);
    }

    .stage-diagram span {
        width: 48px;
        height: 8px;
        justify-self: center;
        border-radius: 9999px;
        background: var(--surface-4);
        transition:
            background-color 700ms var(--ease-sileo),
            transform 700ms var(--ease-sileo);
    }

    .stage-diagram span:nth-child(n + 4) {
        align-self: end;
    }

    .stage-diagram span.active {
        background: #ffffff;
        transform: scaleX(1.5);
    }

    .scenario-workspace {
        min-width: 0;
    }

    .scenario-list {
        border-top: 1px solid var(--surface-4);
    }

    .scenario-list button {
        display: grid;
        width: 100%;
        min-height: 64px;
        padding: 12px 4px;
        grid-template-columns: 32px 1fr auto;
        align-items: center;
        gap: 12px;
        border: 0;
        border-bottom: 1px solid var(--surface-3);
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        text-align: left;
        transition:
            background-color 200ms var(--ease-sileo),
            color 200ms var(--ease-sileo),
            padding 200ms var(--ease-sileo);
    }

    .scenario-list button:hover,
    .scenario-list button.active {
        padding-right: 12px;
        padding-left: 12px;
        background: var(--surface-1);
        color: var(--text);
    }

    .scenario-list button > span {
        font-size: 12px;
        line-height: 16px;
    }

    .scenario-list strong {
        font-size: 16px;
        line-height: 24px;
    }

    .scenario-detail {
        padding-top: 48px;
    }

    .scenario-copy {
        max-width: 39rem;
    }

    .scenario-copy h3,
    .docs-copy h3,
    .appearance h3,
    .api-block h3 {
        margin: 0;
        color: var(--text);
        font-size: 24px;
        font-weight: 600;
        letter-spacing: -0.025em;
        line-height: 32px;
    }

    .scenario-copy > p:last-of-type,
    .docs-copy > p,
    .appearance-grid p,
    .exports p {
        max-width: 60ch;
        margin: 16px 0 0;
        color: var(--text-soft);
        font-size: 16px;
        line-height: 24px;
    }

    .parameter-list {
        display: flex;
        margin: 24px 0 0;
        flex-wrap: wrap;
        gap: 8px;
    }

    .parameter-list div {
        display: flex;
        padding: 8px 12px;
        gap: 4px;
        border: 1px solid var(--surface-3);
        border-radius: 4px;
        font-size: 12px;
        line-height: 16px;
    }

    .parameter-list dt {
        color: var(--text-muted);
    }

    .parameter-list dd {
        margin: 0;
        color: var(--text);
    }

    .code-plane {
        min-width: 0;
        margin-top: 32px;
        overflow: hidden;
        border: 1px solid var(--surface-3);
        border-radius: 8px;
        background: var(--surface-1);
    }

    .code-toolbar {
        display: flex;
        min-height: 40px;
        padding: 4px 8px 4px 12px;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 1px solid var(--surface-3);
        color: var(--text-muted);
        font-size: 12px;
        line-height: 16px;
    }

    .code-toolbar button {
        min-height: 32px;
        padding: 4px 8px;
        border: 0;
        border-radius: 4px;
        background: var(--surface-3);
        color: var(--text-soft);
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition:
            background-color 200ms var(--ease-sileo),
            color 200ms var(--ease-sileo),
            transform 200ms var(--ease-sileo);
    }

    .code-toolbar button:hover {
        background: var(--surface-4);
        color: var(--text);
    }

    .code-toolbar button:active {
        transform: scale(0.98);
    }

    pre {
        max-width: 100%;
        margin: 0;
        padding: 24px;
        overflow-x: auto;
        color: #d7d7d7;
        font-family: Geist, Manrope, sans-serif;
        font-size: 14px;
        line-height: 20px;
        tab-size: 4;
    }

    code {
        font-family: Geist, Manrope, sans-serif;
    }

    .code-keyword {
        color: #ffffff;
        font-weight: 700;
    }

    .code-string {
        color: #bdbdbd;
    }

    .code-comment {
        color: #707070;
    }

    .code-function {
        color: #e7e7e7;
        font-weight: 600;
    }

    .scenario-actions {
        display: flex;
        min-height: 64px;
        margin-top: 16px;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
    }

    .scenario-actions .copy-status {
        margin: 0;
    }

    .rich-description {
        display: grid;
        gap: 4px;
    }

    .rich-description span {
        color: #bdbdbd;
    }

    .docs {
        padding-bottom: 64px;
    }

    .docs-row {
        display: grid;
        padding: 64px 0;
        grid-template-columns: minmax(0, 0.72fr) minmax(0, 1.28fr);
        align-items: start;
        gap: 64px;
        border-top: 1px solid var(--surface-3);
    }

    .step-number {
        display: block;
        margin-bottom: 24px;
        color: var(--text-muted);
        font-size: 12px;
        font-variant-numeric: tabular-nums;
        line-height: 16px;
    }

    .command-line {
        display: flex;
        margin-top: 24px;
        padding: 12px 16px;
        gap: 12px;
        border-left: 2px solid #ffffff;
        background: var(--surface-1);
        color: var(--text-soft);
        font-size: 14px;
        line-height: 20px;
    }

    .docs-copy ul {
        display: grid;
        margin: 24px 0 0;
        padding: 0;
        gap: 8px;
        color: var(--text-soft);
        font-size: 14px;
        line-height: 20px;
        list-style: none;
    }

    .docs-copy li::before {
        margin-right: 8px;
        color: var(--text-muted);
        content: '—';
    }

    .reference-code {
        margin: 0;
    }

    .reference-status {
        min-height: 24px;
        margin: 0;
        color: var(--text-muted);
        font-size: 14px;
        line-height: 20px;
        text-align: right;
    }

    .appearance-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 64px;
    }

    .variable-list {
        margin: 24px 0 0;
        border-top: 1px solid var(--surface-3);
    }

    .variable-list div {
        display: flex;
        min-height: 48px;
        padding: 8px 0;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 1px solid var(--surface-3);
        font-size: 14px;
        line-height: 20px;
    }

    .variable-list dd {
        margin: 0;
        color: var(--text-muted);
        font-variant-numeric: tabular-nums;
    }

    .api-block {
        padding: 48px 0;
        border-top: 1px solid var(--surface-3);
    }

    .method-list {
        display: flex;
        margin-top: 24px;
        flex-wrap: wrap;
        gap: 8px;
    }

    .method-list code {
        padding: 8px 12px;
        border: 1px solid var(--surface-3);
        border-radius: 4px;
        color: var(--text-soft);
        font-size: 14px;
        line-height: 20px;
    }

    .table-scroll {
        max-width: 100%;
        margin-top: 24px;
        overflow-x: auto;
    }

    table {
        width: 100%;
        min-width: 42rem;
        border-collapse: collapse;
        color: var(--text-soft);
        font-size: 14px;
        line-height: 20px;
        text-align: left;
    }

    th,
    td {
        padding: 12px 16px 12px 0;
        border-bottom: 1px solid var(--surface-3);
        vertical-align: top;
    }

    th {
        color: var(--text-muted);
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    td:first-child {
        color: var(--text);
    }

    .final-cta {
        display: grid;
        min-height: 32rem;
        padding: 96px 24px;
        place-items: center;
        align-content: center;
        text-align: center;
    }

    .final-cta .primary-button {
        margin-top: 32px;
    }

    footer {
        border-top: 1px solid var(--line);
    }

    .footer-inner {
        display: flex;
        width: min(100% - 48px, 76rem);
        min-height: 12rem;
        margin: 0 auto;
        padding: 48px 0;
        align-items: flex-start;
        justify-content: space-between;
        gap: 48px;
    }

    .footer-inner strong {
        font-size: 16px;
        line-height: 24px;
    }

    .footer-inner p {
        margin: 8px 0 0;
        color: var(--text-muted);
        font-size: 14px;
        line-height: 20px;
    }

    .footer-inner nav {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px 24px;
    }

    .footer-inner a {
        color: var(--text-soft);
        font-size: 14px;
        line-height: 20px;
        text-decoration-color: var(--surface-4);
        text-underline-offset: 4px;
        transition: color 200ms var(--ease-sileo);
    }

    .footer-inner a:hover {
        color: var(--text);
    }

    @keyframes hero-in {
        from {
            opacity: 0;
            transform: translateY(24px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes settle {
        from {
            transform: scaleX(0.35);
        }
        to {
            transform: scaleX(1);
        }
    }

    @media (max-width: 900px) {
        .hero-inner {
            gap: 40px;
        }

        .playground-grid {
            grid-template-columns: minmax(14rem, 0.58fr) minmax(0, 1.42fr);
            gap: 40px;
        }

        .docs-row {
            gap: 40px;
        }
    }

    @media (max-width: 720px) {
        .hero {
            min-height: 100dvh;
            padding: 88px 16px 40px;
        }

        .hero-inner {
            grid-template-columns: 1fr;
            gap: 32px;
        }

        h1 {
            max-width: 11ch;
            font-size: clamp(40px, 13vw, 48px);
        }

        .hero-lede {
            margin-top: 16px;
            font-size: 16px;
            line-height: 24px;
        }

        .install-flow {
            margin-top: 24px;
            flex-wrap: wrap;
            gap: 8px 16px;
        }

        .hero-stage {
            min-height: 16rem;
            padding: 24px 16px;
        }

        .hero-stage .primary-button {
            margin-top: 24px;
        }

        .toast-specimen {
            transform: none;
        }

        .section {
            width: min(100% - 32px, 76rem);
            padding: 80px 0;
        }

        .section-heading {
            margin-bottom: 48px;
        }

        .section-heading > p:last-child {
            margin-top: 16px;
            font-size: 16px;
            line-height: 24px;
        }

        .playground-grid,
        .docs-row,
        .appearance-grid {
            grid-template-columns: 1fr;
        }

        .playground-grid {
            gap: 48px;
        }

        .sticky-stage {
            position: relative;
            top: auto;
            min-height: auto;
        }

        .stage-diagram {
            height: 12rem;
        }

        .scenario-detail {
            padding-top: 40px;
        }

        .docs-row {
            padding: 48px 0;
            gap: 32px;
        }

        .appearance-grid {
            gap: 48px;
        }

        .footer-inner {
            display: grid;
            width: min(100% - 32px, 76rem);
        }

        .footer-inner nav {
            justify-content: flex-start;
        }
    }

    @media (max-width: 420px) {
        .hero {
            align-items: start;
        }

        .hero-stage {
            margin-top: 0;
        }

        .install-button {
            width: 100%;
            justify-content: space-between;
        }

        .npm-option {
            display: block;
        }

        .toast-specimen {
            padding: 12px;
        }

        .toast-specimen p {
            margin-left: 0;
        }

        .toast-progress {
            margin-left: 0;
        }

        .position-control {
            grid-template-columns: repeat(2, 1fr);
        }

        .scenario-actions {
            align-items: stretch;
            flex-direction: column-reverse;
        }

        .scenario-actions .primary-button {
            width: 100%;
        }

        pre {
            padding: 16px;
            font-size: 12px;
            line-height: 20px;
        }

        .parameter-list {
            display: grid;
        }

        .parameter-list div {
            justify-content: space-between;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .hero-enter,
        .toast-progress span {
            animation: none;
        }

        [data-reveal] {
            opacity: 1;
            transform: none;
            transition: none;
        }

        .install-button,
        .primary-button,
        .position-control span,
        .stage-diagram span,
        .scenario-list button,
        .code-toolbar button {
            transition-duration: 0.01ms;
        }
    }
</style>
