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

    const nextTheme: Record<ThemeMode, ThemeMode> = { dark: 'light', light: 'system', system: 'dark' };

    function applyTheme(mode: ThemeMode) {
        themeMode = mode;
        localStorage.setItem('sileo-docs-theme', mode);
    }

    $effect(() => {
        const saved = localStorage.getItem('sileo-docs-theme') as ThemeMode | null;
        if (saved === 'light' || saved === 'dark' || saved === 'system') themeMode = saved;

        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const sync = () => {
            resolvedTheme = themeMode === 'system' ? (mq.matches ? 'dark' : 'light') : themeMode;
        };
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    });
</script>

<div
    class="site-shell min-h-screen"
    data-theme={resolvedTheme}
>
    <div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6">
        <header
            class="flex items-center justify-between border-b py-6 text-sm"
            style="border-color:var(--site-border)"
        >
            <a
                href={resolve('/')}
                class="font-semibold tracking-tight">Sileo</a
            >
            <nav class="site-muted flex items-center gap-7">
                <a
                    href="https://github.com/mielsense/sileo-svelte"
                    target="_blank"
                    rel="noreferrer"
                    class="transition hover:opacity-100 opacity-85">GitHub</a
                >
                <a
                    href={resolve('/docs')}
                    class={`transition hover:opacity-100 ${$page.url.pathname === '/docs' ? 'opacity-100' : 'opacity-85'}`}
                    >Docs</a
                >
                <a
                    href={resolve('/play')}
                    class={`transition hover:opacity-100 ${$page.url.pathname === '/play' ? 'opacity-100' : 'opacity-85'}`}
                    >Playground</a
                >
                <button
                    class="site-pill !px-2 !py-1"
                    onclick={() => applyTheme(nextTheme[themeMode])}>{themeMode}</button
                >
            </nav>
        </header>

        <div class="flex-1">{@render children()}</div>

        <footer
            class="site-muted mt-10 flex items-center justify-between border-t py-6 text-sm"
            style="border-color:var(--site-border)"
        >
            <p>Sileo — MIT License</p>
            <a
                href={resolve('/play')}
                class="transition hover:opacity-100 opacity-85">Playground →</a
            >
        </footer>
    </div>
</div>

<Toaster
    position="top-right"
    options={{ duration: 5200 }}
    theme={themeMode}
/>
