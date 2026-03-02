<script lang="ts">
    import { resolve } from '$app/paths';
    import { sileo } from '$lib/index.js';

    function show(kind: 'success' | 'error' | 'warning' | 'info') {
        sileo[kind]({
            title: `${kind[0].toUpperCase()}${kind.slice(1)} toast`,
            description: 'Preview from docs page.'
        });
    }
</script>

<section class="grid gap-10 py-10 md:grid-cols-[220px_1fr]">
    <aside class="space-y-7 text-sm text-zinc-500">
        <div>
            <p class="mb-2 text-xs uppercase tracking-[0.2em]">Basics</p>
            <a
                class="block rounded-lg bg-white/10 px-3 py-2 text-zinc-100"
                href={resolve('/docs')}>Kickstart</a
            >
        </div>
        <div class="space-y-2">
            <p class="text-xs uppercase tracking-[0.2em]">API</p>
            <p>sileo</p>
            <p>Toaster</p>
        </div>
        <div class="space-y-2">
            <p class="text-xs uppercase tracking-[0.2em]">Guides</p>
            <p>Styling</p>
        </div>
    </aside>

    <article class="space-y-10">
        <div>
            <h1 class="text-4xl font-semibold text-zinc-100">Getting Started</h1>
            <p class="mt-4 max-w-3xl text-zinc-400">
                Sileo is a tiny, opinionated toast component for Svelte. It uses Motion-powered animations for smooth,
                production-ready notifications.
            </p>
        </div>

        <div class="space-y-3">
            <h2 class="text-2xl font-semibold text-zinc-100">Installation</h2>
            <pre
                class="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-200">npm install sileo-svelte motion</pre>
        </div>

        <div class="space-y-3">
            <h2 class="text-2xl font-semibold text-zinc-100">Quick setup</h2>
            <p class="text-zinc-400">
                Add <code>Toaster</code> to your layout, then call <code>sileo</code> from anywhere.
            </p>
            <pre
                class="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-200">{`import { Toaster, sileo } from 'sileo-svelte';
import 'sileo-svelte/styles.css';

<Toaster position="top-right" />

sileo.success({ title: 'Saved' });`}</pre>
        </div>

        <div class="space-y-4">
            <h2 class="text-2xl font-semibold text-zinc-100">Fire a toast</h2>
            <div class="rounded-xl border border-white/10 bg-black/40 p-6">
                <div class="flex flex-wrap gap-2">
                    <button
                        class="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-300"
                        onclick={() => show('success')}>Success</button
                    >
                    <button
                        class="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-300"
                        onclick={() => show('error')}>Error</button
                    >
                    <button
                        class="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-300"
                        onclick={() => show('warning')}>Warning</button
                    >
                    <button
                        class="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-300"
                        onclick={() => show('info')}>Info</button
                    >
                </div>
            </div>
        </div>
    </article>
</section>
