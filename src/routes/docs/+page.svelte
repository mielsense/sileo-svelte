<script lang="ts">
    import CodeBlock from '$lib/docs/CodeBlock.svelte';
    import { sileo } from '$lib/index.js';

    const nav = [
        { id: 'kickstart', label: 'Kickstart' },
        { id: 'api', label: 'Core API' },
        { id: 'options', label: 'Toast options' },
        { id: 'advanced', label: 'Complex patterns' },
        { id: 'styling', label: 'Styling + Tailwind' },
        { id: 'theme', label: 'Theme support' }
    ];

    const installCode = `npm install sileo-svelte motion`;
    const quickSetupCode = `import { Toaster, sileo } from 'sileo-svelte';
import 'sileo-svelte/styles.css';

<Toaster position="top-right" theme="system" />

sileo.success({ title: 'Saved', description: 'Project synced.' });`;
    const apiCode = `sileo.show(input)
sileo.success(input)
sileo.error(input)
sileo.warning(input)
sileo.info(input)
sileo.action(input)
sileo.loading(input)
sileo.promise(promise, options)
sileo.update(id, options)
sileo.dismiss(id)
sileo.close(id)
sileo.clear(position?)
sileo.with(defaults)`;
    const optionsCode = `type SileoOptions = {
  title?: string;
  description?: string | Snippet;
  position?: 'top-left' | 'top-center' | ...;
  duration?: number | null;
  icon?: Snippet | null;
  fill?: string;
  roundness?: number;
  classes?: { title?: string; description?: string; badge?: string; button?: string };
  styles?: { titleColor?: string; descriptionColor?: string; badgeColor?: string; ... };
  button?: { title: string; onClick: (id: string) => void };
  autopilot?: boolean | { expand?: number; collapse?: number };
};`;

    function show(kind: 'success' | 'error' | 'warning' | 'info') {
        sileo[kind]({ title: `${kind[0].toUpperCase()}${kind.slice(1)} toast`, description: 'Preview from docs.' });
    }

    function complexAction() {
        sileo.action({
            title: 'File uploaded',
            description: 'Share it with your team?',
            autopilot: false,
            button: {
                title: 'Share now',
                onClick: (id) => {
                    sileo.update(id, {
                        state: 'loading',
                        title: 'Sharing…',
                        description: 'Creating share link…',
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
                button: '!bg-slate-900 !text-white'
            },
            styles: {
                badgeBackground: '#e2e8f0',
                badgeColor: '#0f172a'
            },
            button: {
                title: 'Close',
                onClick: (id) => sileo.dismiss(id)
            }
        });
    }
</script>

<section class="grid gap-10 py-10 md:grid-cols-[240px_1fr]">
    <aside class="site-muted sticky top-8 h-fit space-y-3 text-sm">
        <p class="text-xs uppercase tracking-[0.2em]">Docs</p>
        {#each nav as item (item.id)}
            <a
                class="block rounded-lg px-3 py-2 transition hover:opacity-100 opacity-80"
                href={`#${item.id}`}>{item.label}</a
            >
        {/each}
    </aside>

    <article class="space-y-12">
        <section
            id="kickstart"
            class="scroll-mt-24 space-y-4"
        >
            <h1 class="text-4xl font-semibold">Getting Started</h1>
            <p class="site-muted max-w-3xl">
                Sileo is an SVG morphing toast component for Svelte with spring-like transitions and advanced update
                flow. The docs below are complete enough to use in production without opening the README.
            </p>
            <CodeBlock
                title="Install"
                language="bash"
                code={installCode}
            />
            <CodeBlock
                title="Quick setup"
                language="svelte"
                code={quickSetupCode}
            />
        </section>

        <section
            id="api"
            class="scroll-mt-24 space-y-4"
        >
            <h2 class="text-2xl font-semibold">Core API</h2>
            <CodeBlock
                title="sileo methods"
                language="ts"
                code={apiCode}
            />
            <div class="site-card rounded-xl p-5">
                <p class="site-muted mb-3 text-sm">Live preview:</p>
                <div class="flex flex-wrap gap-2">
                    <button
                        class="site-pill"
                        onclick={() => show('success')}>Success</button
                    >
                    <button
                        class="site-pill"
                        onclick={() => show('error')}>Error</button
                    >
                    <button
                        class="site-pill"
                        onclick={() => show('warning')}>Warning</button
                    >
                    <button
                        class="site-pill"
                        onclick={() => show('info')}>Info</button
                    >
                </div>
            </div>
        </section>

        <section
            id="options"
            class="scroll-mt-24 space-y-4"
        >
            <h2 class="text-2xl font-semibold">Toast options</h2>
            <p class="site-muted">
                Every method accepts a full options object. Use `autopilot` and `button` for richer interaction.
            </p>
            <CodeBlock
                title="SileoOptions"
                language="ts"
                code={optionsCode}
            />
        </section>

        <section
            id="advanced"
            class="scroll-mt-24 space-y-4"
        >
            <h2 class="text-2xl font-semibold">Complex patterns</h2>
            <p class="site-muted">Action toasts can morph through states while preserving id and placement.</p>
            <div class="flex flex-wrap gap-2">
                <button
                    class="site-pill"
                    onclick={complexAction}>Run action flow</button
                >
                <button
                    class="site-pill"
                    onclick={promiseFlow}>Run promise flow</button
                >
            </div>
            <CodeBlock
                title="Action flow"
                language="ts"
                code={`const id = sileo.action({
  title: 'File uploaded',
  autopilot: false,
  button: { title: 'Share now', onClick: (id) => sileo.update(id, { state: 'loading' }) }
});`}
            />
        </section>

        <section
            id="styling"
            class="scroll-mt-24 space-y-4"
        >
            <h2 class="text-2xl font-semibold">Styling + Tailwind</h2>
            <p class="site-muted">
                Library itself is CSS-based. Consumers can still pass Tailwind utility classes through `classes`.
            </p>
            <button
                class="site-pill"
                onclick={stylingDemo}>Run styling demo</button
            >
            <CodeBlock
                title="Tailwind usage"
                language="ts"
                code={`sileo.info({
  classes: { title: '!text-slate-900', description: '!text-slate-700' },
  styles: { badgeBackground: '#e2e8f0', badgeColor: '#0f172a' },
  button: { title: 'Close', onClick: (id) => sileo.dismiss(id) }
});`}
            />
        </section>

        <section
            id="theme"
            class="scroll-mt-24 space-y-4"
        >
            <h2 class="text-2xl font-semibold">Theme support</h2>
            <p class="site-muted">
                Top-right toggle controls `dark / light / system`. It updates docs palette and toaster fill defaults so
                both docs and toasts stay readable.
            </p>
        </section>
    </article>
</section>
