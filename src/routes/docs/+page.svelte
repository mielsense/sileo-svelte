<script lang="ts">
    import CodeBlock from '$lib/docs/CodeBlock.svelte';
    import { sileo } from '$lib/index.js';

    const nav = [
        { id: 'kickstart', label: 'Kickstart' },
        { id: 'api', label: 'Core API' },
        { id: 'options', label: 'Options reference' },
        { id: 'snippets', label: 'Custom snippets' },
        { id: 'promise', label: 'Promise patterns' },
        { id: 'advanced', label: 'Advanced flows' },
        { id: 'styling', label: 'Styling + Tailwind' },
        { id: 'theme', label: 'Theme support' },
        { id: 'migration', label: 'Migration notes' }
    ];

    const installCode = `npm install sileo-svelte motion`;
    const setupCode = `import { Toaster, sileo } from 'sileo-svelte';
import 'sileo-svelte/styles.css';

<Toaster position="top-right" theme="system" />

sileo.success({
  title: 'Saved',
  description: 'Project synced.'
});`;

    const methodsCode = `sileo.show(input, description?)
sileo.success(input, description?)
sileo.error(input, description?)
sileo.warning(input, description?)
sileo.info(input, description?)
sileo.action(input, description?)
sileo.loading(input, description?)
sileo.promise(promise, options)
sileo.update(id, options)
sileo.dismiss(id)
sileo.close(id)
sileo.clear(position?)
sileo.with(defaults)`;

    const optionsCode = `type SileoOptions = {
  title?: string;
  description?: string | Snippet;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  duration?: number | null;
  icon?: Snippet | null;
  fill?: string;
  roundness?: number;
  autopilot?: boolean | { expand?: number; collapse?: number };
  classes?: {
    title?: string;
    description?: string;
    badge?: string;
    button?: string;
  };
  styles?: {
    titleColor?: string;
    descriptionColor?: string;
    badgeColor?: string;
    badgeBackground?: string;
    buttonColor?: string;
    buttonBackground?: string;
    buttonHoverBackground?: string;
  };
  button?: {
    title: string;
    onClick: (id: string) => void;
  };
};`;

    const snippetCode = `<script lang="ts">
  import { sileo } from 'sileo-svelte';

  function openToast() {
    sileo.show({
      title: 'Custom snippet',
      description: () => (
        <div class="flex items-center gap-2">
          <span>Deploy complete.</span>
          <a href="/releases" class="underline">View release</a>
        </div>
      )
    });
  }
<${'/script'}>`;

    const promiseCode = `const id = sileo.loading({ title: 'Uploading…' });

sileo.promise(uploadFile(), {
  id,
  loading: { title: 'Uploading chunks…' },
  success: (file) => ({
    state: 'action',
    title: 'File uploaded',
    description: file.name,
    button: { title: 'Share now', onClick: (toastId) => sileo.dismiss(toastId) }
  }),
  error: (err) => ({
    title: 'Upload failed',
    description: err instanceof Error ? err.message : 'Unknown error',
    duration: null
  })
});`;

    const stylingCode = `sileo.info({
  title: 'Tailwind-compatible styling',
  fill: '#f8fafc',
  classes: {
    title: '!text-slate-900 font-semibold',
    description: '!text-slate-700',
    button: '!bg-blue-500 !text-white !border !border-blue-700'
  },
  styles: {
    badgeBackground: '#dbeafe',
    badgeColor: '#1e3a8a'
  },
  button: { title: 'Close', onClick: (id) => sileo.dismiss(id) }
});`;

    function fire(kind: 'success' | 'error' | 'warning' | 'info') {
        sileo[kind]({ title: `${kind[0].toUpperCase()}${kind.slice(1)} toast`, description: 'Preview from docs.' });
    }

    function actionFlow() {
        sileo.action({
            title: 'File uploaded',
            description: 'Share this file with your team?',
            autopilot: false,
            button: {
                title: 'Share now',
                onClick: (id) => {
                    sileo.update(id, {
                        state: 'loading',
                        title: 'Sharing…',
                        description: 'Creating secure link…',
                        duration: null
                    });
                    setTimeout(() => {
                        sileo.update(id, {
                            state: 'success',
                            title: 'Shared',
                            description: 'Link copied to clipboard.',
                            duration: 4200
                        });
                    }, 900);
                }
            }
        });
    }

    async function promiseFlow() {
        await sileo.promise(
            async () => {
                await new Promise((resolve) => setTimeout(resolve, 1200));
                return { release: 'v1.0.0' };
            },
            {
                loading: { title: 'Deploying…' },
                success: (data) => ({ title: `${data.release} live`, description: 'Traffic switched successfully.' }),
                error: () => ({ title: 'Deploy failed', description: 'Rollback initiated.' })
            }
        );
    }

    function stylingDemo() {
        sileo.info({
            title: 'Tailwind-compatible styling',
            description: 'Use classes + style vars together.',
            fill: '#f8fafc',
            classes: {
                title: '!text-slate-900 font-semibold',
                description: '!text-slate-700',
                button: '!bg-blue-500 !text-white !border !border-blue-700'
            },
            styles: {
                badgeBackground: '#dbeafe',
                badgeColor: '#1e3a8a'
            },
            button: {
                title: 'Close',
                onClick: (id) => sileo.dismiss(id)
            }
        });
    }
</script>

<section class="grid gap-10 py-10 md:grid-cols-[260px_1fr]">
    <aside class="site-muted sticky top-8 h-fit space-y-3 text-sm">
        <p class="text-xs uppercase tracking-[0.2em]">Docs</p>
        {#each nav as item (item.id)}
            <a
                class="block rounded-lg px-3 py-2 opacity-80 transition hover:opacity-100"
                href={`#${item.id}`}>{item.label}</a
            >
        {/each}
    </aside>

    <article class="min-w-0 space-y-12">
        <section
            id="kickstart"
            class="scroll-mt-24 space-y-4"
        >
            <h1 class="text-4xl font-semibold">Getting Started</h1>
            <p class="site-muted max-w-3xl">
                Sileo is an SVG-morphing toast component for Svelte 5. It is optimized for smooth state transitions,
                easy API ergonomics, and complex real-world workflows (action steps, long-running promises, toast
                morphing, and strongly typed options).
            </p>
            <CodeBlock
                title="Install"
                language="bash"
                code={installCode}
            />
            <CodeBlock
                title="Quick setup"
                language="svelte"
                code={setupCode}
            />
        </section>

        <section
            id="api"
            class="scroll-mt-24 space-y-4"
        >
            <h2 class="text-2xl font-semibold">Core API</h2>
            <p class="site-muted">
                All shorthand methods accept both string and object input. Use `.with(...)` to create scoped APIs per
                domain.
            </p>
            <CodeBlock
                title="sileo methods"
                language="ts"
                code={methodsCode}
            />
            <div class="site-card rounded-xl p-5">
                <p class="site-muted mb-3 text-sm">Live preview:</p>
                <div class="flex flex-wrap gap-2">
                    <button
                        class="site-pill"
                        onclick={() => fire('success')}>Success</button
                    >
                    <button
                        class="site-pill"
                        onclick={() => fire('error')}>Error</button
                    >
                    <button
                        class="site-pill"
                        onclick={() => fire('warning')}>Warning</button
                    >
                    <button
                        class="site-pill"
                        onclick={() => fire('info')}>Info</button
                    >
                </div>
            </div>
        </section>

        <section
            id="options"
            class="scroll-mt-24 space-y-4"
        >
            <h2 class="text-2xl font-semibold">Options reference</h2>
            <p class="site-muted">
                This includes the fields most teams customize in production: timing, shape, custom content, CTA action,
                and style overrides.
            </p>
            <CodeBlock
                title="SileoOptions"
                language="ts"
                code={optionsCode}
            />
        </section>

        <section
            id="snippets"
            class="scroll-mt-24 space-y-4"
        >
            <h2 class="text-2xl font-semibold">Custom snippets</h2>
            <p class="site-muted">
                `description` and `icon` can be Svelte snippets. This is useful for rich content (links, status chips,
                micro layouts) while keeping the same toast animation and lifecycle behavior.
            </p>
            <CodeBlock
                title="Snippet example"
                language="svelte"
                code={snippetCode}
            />
        </section>

        <section
            id="promise"
            class="scroll-mt-24 space-y-4"
        >
            <h2 class="text-2xl font-semibold">Promise patterns</h2>
            <p class="site-muted">
                Use `sileo.promise(...)` to morph one toast through loading/success/error states without losing position
                or id.
            </p>
            <CodeBlock
                title="Promise + morph"
                language="ts"
                code={promiseCode}
            />
            <button
                class="site-pill"
                onclick={promiseFlow}>Run promise flow</button
            >
        </section>

        <section
            id="advanced"
            class="scroll-mt-24 space-y-4"
        >
            <h2 class="text-2xl font-semibold">Advanced flows</h2>
            <p class="site-muted">
                Action toasts can run multi-step user journeys. Keep button visible with `autopilot: false` for explicit
                interaction.
            </p>
            <button
                class="site-pill"
                onclick={actionFlow}>Run action flow</button
            >
        </section>

        <section
            id="styling"
            class="scroll-mt-24 space-y-4"
        >
            <h2 class="text-2xl font-semibold">Styling + Tailwind</h2>
            <p class="site-muted">
                The toast library itself stays CSS-based. Consumers can pass Tailwind utility classes via `classes`.
            </p>
            <button
                class="site-pill"
                onclick={stylingDemo}>Run styling demo</button
            >
            <CodeBlock
                title="Tailwind + style vars"
                language="ts"
                code={stylingCode}
            />
        </section>

        <section
            id="theme"
            class="scroll-mt-24 space-y-4"
        >
            <h2 class="text-2xl font-semibold">Theme support</h2>
            <p class="site-muted">
                Use the top-right toggle (`dark` / `light` / `system`). Docs colors and toast default fills are resolved
                from the same mode, so foreground/background contrast remains correct in both themes.
            </p>
            <CodeBlock
                title="Themed Toaster"
                language="svelte"
                code={`<Toaster theme="system" options={{ duration: 5200 }} />`}
            />
        </section>

        <section
            id="migration"
            class="scroll-mt-24 space-y-4"
        >
            <h2 class="text-2xl font-semibold">Migration notes</h2>
            <ul class="site-muted list-disc space-y-2 pl-5">
                <li>Use `button` for action CTA content inside a toast.</li>
                <li>Use `autopilot: false` when actions should stay visible until user interaction.</li>
                <li>Use `sileo.update(id, next)` to morph one toast through multiple states.</li>
                <li>Use `sileo.with(...)` for feature-specific defaults (position, roundness, style tokens).</li>
            </ul>
        </section>
    </article>
</section>
