<script lang="ts">
    import CodeBlock from '$lib/docs/CodeBlock.svelte';
    import { sileo } from '$lib/index.js';

    const nav = [
        { id: 'kickstart', label: 'Kickstart' },
        { id: 'api', label: 'API' },
        { id: 'promise', label: 'Promise flows' },
        { id: 'advanced', label: 'Advanced examples' },
        { id: 'styling', label: 'Styling + Tailwind' },
        { id: 'theming', label: 'Light/Dark theme' }
    ];

    function fire(kind: 'success' | 'error' | 'warning' | 'info') {
        sileo[kind]({ title: `${kind[0].toUpperCase()}${kind.slice(1)} toast`, description: 'Preview from docs.' });
    }

    function complexAction() {
        sileo.action({
            title: 'Deployment blocked',
            description: 'Review failed checks before continuing.',
            button: {
                title: 'Open checks',
                onClick: (id) => {
                    sileo.update(id, {
                        state: 'loading',
                        title: 'Opening checks…',
                        description: 'Fetching CI logs…',
                        duration: null
                    });

                    setTimeout(() => {
                        sileo.update(id, {
                            state: 'success',
                            title: 'Checks loaded',
                            description: 'You can safely deploy now.',
                            duration: 4500
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
                loading: { title: 'Shipping release…' },
                success: (result) => ({
                    title: `${result.release} deployed`,
                    description: 'Traffic switched to new release.'
                }),
                error: (err) => ({
                    title: 'Deploy failed',
                    description: err instanceof Error ? err.message : 'Unknown error'
                })
            }
        );
    }

    function styledTailwind() {
        sileo.info({
            title: 'Tailwind style injection',
            description: 'Classes and style vars can be combined.',
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
                title: 'Got it',
                onClick: (id) => sileo.dismiss(id)
            }
        });
    }
</script>

<section class="grid gap-10 py-10 md:grid-cols-[260px_1fr]">
    <aside class="sticky top-8 h-fit space-y-7 text-sm text-zinc-500">
        <div>
            <p class="mb-2 text-xs uppercase tracking-[0.2em]">Documentation</p>
            <div class="space-y-1">
                {#each nav as item (item.id)}
                    <a
                        class="block rounded-lg px-3 py-2 transition hover:bg-black/5 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-zinc-100"
                        href={`#${item.id}`}
                    >
                        {item.label}
                    </a>
                {/each}
            </div>
        </div>
    </aside>

    <article class="space-y-12">
        <section
            id="kickstart"
            class="scroll-mt-24 space-y-4"
        >
            <h1 class="text-4xl font-semibold">Getting Started</h1>
            <p class="max-w-3xl text-zinc-600 dark:text-zinc-400">
                Sileo is a gooey SVG toast component for Svelte. It supports smooth morphing updates, promise flows,
                custom actions, scoped defaults, and theme-friendly styling hooks.
            </p>
            <CodeBlock
                title="Install"
                code="npm install sileo-svelte motion"
            />
            <CodeBlock
                title="Quick setup"
                language="svelte"
                code={`import { Toaster, sileo } from 'sileo-svelte';\nimport 'sileo-svelte/styles.css';\n\n<Toaster position="top-right" />\n\nsileo.success({ title: 'Saved', description: 'Project synced.' });`}
            />
        </section>

        <section
            id="api"
            class="scroll-mt-24 space-y-4"
        >
            <h2 class="text-2xl font-semibold">API</h2>
            <CodeBlock
                title="Methods"
                language="ts"
                code="sileo.show(input)\nsileo.success(input)\nsileo.error(input)\nsileo.warning(input)\nsileo.info(input)\nsileo.action(input)\nsileo.loading(input)\nsileo.update(id, next)\nsileo.dismiss(id)\nsileo.close(id)\nsileo.clear(position?)\nsileo.promise(promise, options)\nsileo.with(defaults)"
            />
            <div
                class="rounded-xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.03]"
            >
                <p class="mb-3 text-sm text-zinc-600 dark:text-zinc-400">Live preview:</p>
                <div class="flex flex-wrap gap-2">
                    <button
                        class="rounded-xl bg-black/10 px-4 py-2 text-sm dark:bg-white/10"
                        onclick={() => fire('success')}>Success</button
                    >
                    <button
                        class="rounded-xl bg-black/10 px-4 py-2 text-sm dark:bg-white/10"
                        onclick={() => fire('error')}>Error</button
                    >
                    <button
                        class="rounded-xl bg-black/10 px-4 py-2 text-sm dark:bg-white/10"
                        onclick={() => fire('warning')}>Warning</button
                    >
                    <button
                        class="rounded-xl bg-black/10 px-4 py-2 text-sm dark:bg-white/10"
                        onclick={() => fire('info')}>Info</button
                    >
                </div>
            </div>
        </section>

        <section
            id="promise"
            class="scroll-mt-24 space-y-4"
        >
            <h2 class="text-2xl font-semibold">Promise flows</h2>
            <CodeBlock
                title="Morph loading → success/error"
                language="ts"
                code={`await sileo.promise(fetchData(), {\n  loading: { title: 'Loading…' },\n  success: (data) => ({ title: 'Done', description: data.message }),\n  error: (err) => ({ title: 'Failed', description: String(err) })\n});`}
            />
            <button
                class="rounded-xl bg-black/10 px-4 py-2 text-sm dark:bg-white/10"
                onclick={promiseFlow}>Run promise demo</button
            >
        </section>

        <section
            id="advanced"
            class="scroll-mt-24 space-y-4"
        >
            <h2 class="text-2xl font-semibold">Advanced examples</h2>
            <CodeBlock
                title="Action toast with in-place updates"
                language="ts"
                code={`const id = sileo.action({\n  title: 'Deployment blocked',\n  description: 'Review checks',\n  button: {\n    title: 'Open checks',\n    onClick: (id) => sileo.update(id, { state: 'loading', title: 'Opening…' })\n  }\n});`}
            />
            <button
                class="rounded-xl bg-black/10 px-4 py-2 text-sm dark:bg-white/10"
                onclick={complexAction}>Run action demo</button
            >
        </section>

        <section
            id="styling"
            class="scroll-mt-24 space-y-4"
        >
            <h2 class="text-2xl font-semibold">Styling + Tailwind</h2>
            <CodeBlock
                title="Tailwind classes + style vars"
                language="ts"
                code={`sileo.info({\n  title: 'Custom design',\n  classes: { title: '!text-slate-900', description: '!text-slate-700' },\n  styles: { badgeBackground: '#e2e8f0', badgeColor: '#0f172a' },\n  button: { title: 'Close', onClick: (id) => sileo.dismiss(id) }\n});`}
            />
            <button
                class="rounded-xl bg-black/10 px-4 py-2 text-sm dark:bg-white/10"
                onclick={styledTailwind}>Run styling demo</button
            >
        </section>

        <section
            id="theming"
            class="scroll-mt-24 space-y-4"
        >
            <h2 class="text-2xl font-semibold">Light/Dark mode</h2>
            <p class="text-zinc-600 dark:text-zinc-400">
                Use the theme toggle in the top-right nav (`dark`/`light`/`system`). The docs shell and Toaster theme
                both switch so toast fills adapt for readability.
            </p>
        </section>
    </article>
</section>
