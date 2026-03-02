<script lang="ts">
    import { resolve } from '$app/paths';
    import { page } from '$app/stores';
    import { Toaster } from '$lib/index.js';
    import '../app.css';
    import '$lib/styles.css';

    let { children } = $props();
</script>

<div class="min-h-screen bg-[#050505] text-zinc-100">
    <div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6">
        <header class="flex items-center justify-between border-b border-white/10 py-6 text-sm">
            <a
                href={resolve('/')}
                class="font-semibold tracking-tight">Sileo</a
            >
            <nav class="flex items-center gap-7 text-zinc-400">
                <a
                    href="https://github.com/mielsense/sileo-svelte"
                    target="_blank"
                    rel="noreferrer"
                    class="transition hover:text-white"
                >
                    GitHub
                </a>
                <a
                    href={resolve('/docs')}
                    class={`transition hover:text-white ${$page.url.pathname === '/docs' ? 'text-white' : ''}`}
                >
                    Docs
                </a>
                <a
                    href={resolve('/play')}
                    class={`transition hover:text-white ${$page.url.pathname === '/play' ? 'text-white' : ''}`}
                >
                    Playground
                </a>
            </nav>
        </header>

        <div class="flex-1">{@render children()}</div>

        <footer class="mt-10 flex items-center justify-between border-t border-white/10 py-6 text-sm text-zinc-500">
            <p>Sileo — MIT License</p>
            <a
                href={resolve('/play')}
                class="transition hover:text-zinc-200">Playground →</a
            >
        </footer>
    </div>
</div>

<Toaster
    position="top-right"
    options={{ duration: 4500 }}
/>
