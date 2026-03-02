<script lang="ts">
    import { resolve } from '$app/paths';
    import { sileo } from '$lib/index.js';

    function fire(type: 'success' | 'error' | 'warning' | 'info' | 'action') {
        const payload = {
            success: { title: 'Saved', description: 'Your preferences have been synced.' },
            error: { title: 'Payment failed', description: 'Your card was declined.' },
            warning: { title: 'Storage low', description: 'You are close to your plan limit.' },
            info: { title: 'Deployment ready', description: 'Version 1.0.0 is available.' },
            action: { title: 'Heads up', description: 'This is a neutral toast.' }
        }[type];

        if (type === 'success') return sileo.success(payload);
        if (type === 'error') return sileo.error(payload);
        if (type === 'warning') return sileo.warning(payload);
        if (type === 'info') return sileo.info(payload);
        return sileo.action(payload);
    }

    async function firePromise() {
        await sileo.promise(
            async () => {
                await new Promise((resolve) => setTimeout(resolve, 1200));
                return { name: 'Sileo Svelte' };
            },
            {
                loading: { title: 'Publishing release…' },
                success: (result: { name: string }) => ({
                    title: 'Published',
                    description: `${result.name} is now live.`
                }),
                error: { title: 'Publish failed', description: 'Please retry.' }
            }
        );
    }
</script>

<section class="flex min-h-[76vh] flex-col items-center justify-center text-center">
    <h1 class="text-7xl font-bold tracking-tight text-zinc-100 md:text-8xl">Sileo.</h1>
    <p class="mt-6 max-w-xl text-lg text-zinc-400">
        An opinionated toast component for Svelte. Real Motion animations, smooth state morphing, and a minimal API.
    </p>

    <div class="mt-10 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-200">
        npm i sileo-svelte motion
    </div>

    <div class="mt-7 flex gap-6 text-sm text-zinc-400">
        <a
            href={resolve('/play')}
            class="hover:text-zinc-200">Playground →</a
        >
        <a
            href={resolve('/docs')}
            class="hover:text-zinc-200">Documentation</a
        >
    </div>
</section>

<section class="pb-10 text-center">
    <p class="mb-4 text-xs uppercase tracking-[0.25em] text-zinc-500">Try it</p>
    <div class="flex flex-wrap items-center justify-center gap-2">
        <button
            class="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-300"
            onclick={() => fire('success')}>Success</button
        >
        <button
            class="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-300"
            onclick={() => fire('error')}>Error</button
        >
        <button
            class="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-300"
            onclick={() => fire('warning')}>Warning</button
        >
        <button
            class="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-300"
            onclick={() => fire('info')}>Info</button
        >
        <button
            class="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-300"
            onclick={() => fire('action')}>Action</button
        >
        <button
            class="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-300"
            onclick={firePromise}>Promise</button
        >
    </div>
</section>
