<script lang="ts">
    import { sileo } from '$lib/index.js';
    import type { SileoPosition } from '$lib/types.js';

    let selected = $state<SileoPosition>('top-right');

    const positions: SileoPosition[] = [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right'
    ];

    const at = (input: Parameters<typeof sileo.show>[0]) =>
        typeof input === 'string' ? { title: input, position: selected } : { ...input, position: selected };

    function show(kind: 'success' | 'error' | 'warning' | 'info') {
        sileo[kind](
            at({ title: `${kind[0].toUpperCase()}${kind.slice(1)} toast`, description: `Position: ${selected}` })
        );
    }

    function actionToast() {
        sileo.action(
            at({
                title: 'Action required',
                description: 'Review deployment logs.',
                autopilot: false,
                button: {
                    title: 'Dismiss',
                    onClick: (id: string) => sileo.dismiss(id)
                }
            })
        );
    }

    function iconToast() {
        sileo.info(
            at({
                title: 'Custom styles',
                description: 'Styling API lets you blend with your design system.',
                fill: '#f8fafc',
                classes: {
                    title: 'styles-demo-title',
                    description: 'styles-demo-description',
                    button: 'styles-demo-button'
                },
                styles: {
                    badgeColor: '#111827',
                    badgeBackground: '#e5e7eb'
                }
            })
        );
    }

    async function promiseToast() {
        await sileo.promise(
            async () => {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                return true;
            },
            {
                position: selected,
                loading: { title: 'Uploading file…' },
                success: { title: 'Uploaded', description: 'File is now available.' },
                error: { title: 'Failed', description: 'Could not upload file.' }
            }
        );
    }
</script>

<section class="flex min-h-[76vh] flex-col items-center justify-center text-center">
    <h1 class="text-7xl font-bold tracking-tight text-zinc-100 md:text-8xl">Playground.</h1>
    <p class="mt-6 text-lg text-zinc-400">Pick a position, click any type to fire it live.</p>
</section>

<section class="pb-10 text-center">
    <div class="mb-6 flex flex-wrap items-center justify-center gap-2">
        {#each positions as pos (pos)}
            <button
                class={`rounded-xl px-4 py-2 text-sm ${selected === pos ? 'bg-zinc-100 text-zinc-900' : 'bg-white/10 text-zinc-400'}`}
                onclick={() => (selected = pos)}
            >
                {pos}
            </button>
        {/each}
    </div>

    <div class="mx-auto mb-6 h-px w-full max-w-3xl bg-white/10"></div>

    <div class="flex flex-wrap items-center justify-center gap-2">
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
        <button
            class="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-300"
            onclick={actionToast}>Action</button
        >
        <button
            class="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-300"
            onclick={iconToast}>Icon</button
        >
        <button
            class="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-300"
            onclick={promiseToast}>Promise</button
        >
    </div>
</section>
