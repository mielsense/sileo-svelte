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
                title: 'File uploaded',
                description: 'Share this file with your team?',
                autopilot: false,
                button: {
                    title: 'Share now',
                    onClick: (id: string) => sileo.dismiss(id)
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
    <h1 class="text-7xl font-bold tracking-tight md:text-8xl">Playground.</h1>
    <p class="site-muted mt-6 text-lg">Pick a position, click any type to fire it live.</p>
</section>

<section class="pb-10 text-center">
    <div class="mb-6 flex flex-wrap items-center justify-center gap-2">
        {#each positions as pos (pos)}
            <button
                class={`site-pill ${selected === pos ? '!bg-[var(--site-fg)] !text-[var(--site-bg)]' : ''}`}
                onclick={() => (selected = pos)}
            >
                {pos}
            </button>
        {/each}
    </div>

    <div
        class="mx-auto mb-6 h-px w-full max-w-3xl"
        style="background:var(--site-border)"
    ></div>

    <div class="flex flex-wrap items-center justify-center gap-2">
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
        <button
            class="site-pill"
            onclick={actionToast}>Action</button
        >
        <button
            class="site-pill"
            onclick={promiseToast}>Promise</button
        >
    </div>
</section>
