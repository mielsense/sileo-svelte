<script lang="ts">
    import { resolve } from '$app/paths';
    import { page } from '$app/stores';
    import { Toaster } from '$lib/index.js';
    import '../app.css';
    import '$lib/styles.css';

    type ThemeMode = 'light' | 'dark' | 'system';

    let { children } = $props();

    let themeMode = $state<ThemeMode>('system');
    let resolvedTheme = $state<'light' | 'dark'>('dark');

    const nextTheme: Record<ThemeMode, ThemeMode> = {
        dark: 'light',
        light: 'system',
        system: 'dark'
    };

    function applyTheme(mode: ThemeMode) {
        themeMode = mode;
        localStorage.setItem('sileo-docs-theme', mode);
    }

    $effect(() => {
        const saved = localStorage.getItem('sileo-docs-theme') as ThemeMode | null;
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
            themeMode = saved;
        }

        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const sync = () => {
            resolvedTheme = themeMode === 'system' ? (mq.matches ? 'dark' : 'light') : themeMode;
        };

        sync();
        mq.addEventListener('change', sync);

        return () => mq.removeEventListener('change', sync);
    });
</script>

<div class={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-[#050505] text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
    <div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6">
        <header
            class={`flex items-center justify-between py-6 text-sm ${resolvedTheme === 'dark' ? 'border-b border-white/10' : 'border-b border-black/10'}`}
        >
            <a
                href={resolve('/')}
                class="font-semibold tracking-tight">Sileo</a
            >
            <nav class={`flex items-center gap-7 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <a
                    href="https://github.com/mielsense/sileo-svelte"
                    target="_blank"
                    rel="noreferrer"
                    class="transition hover:text-current"
                >
                    GitHub
                </a>
                <a
                    href={resolve('/docs')}
                    class={`transition hover:text-current ${$page.url.pathname === '/docs' ? 'text-current' : ''}`}
                >
                    Docs
                </a>
                <a
                    href={resolve('/play')}
                    class={`transition hover:text-current ${$page.url.pathname === '/play' ? 'text-current' : ''}`}
                >
                    Playground
                </a>
                <button
                    class={`rounded-lg px-2 py-1 ${resolvedTheme === 'dark' ? 'bg-white/10 text-zinc-200' : 'bg-black/10 text-zinc-700'}`}
                    onclick={() => applyTheme(nextTheme[themeMode])}
                >
                    {themeMode}
                </button>
            </nav>
        </header>

        <div class="flex-1">{@render children()}</div>

        <footer
            class={`mt-10 flex items-center justify-between py-6 text-sm ${resolvedTheme === 'dark' ? 'border-t border-white/10 text-zinc-500' : 'border-t border-black/10 text-zinc-600'}`}
        >
            <p>Sileo — MIT License</p>
            <a
                href={resolve('/play')}
                class="transition hover:text-current">Playground →</a
            >
        </footer>
    </div>
</div>

<Toaster
    position="top-right"
    options={{ duration: 5200 }}
    theme={themeMode}
/>
