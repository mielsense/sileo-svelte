<script lang="ts">
    import { resolve } from '$app/paths';
    import { sileo } from '$lib/index.js';

    function fire(type: 'success' | 'error' | 'warning' | 'info' | 'action') {
        const payload = {
            success: { title: 'Saved', description: 'Your preferences have been synced.' },
            error: { title: 'Payment failed', description: 'Your card was declined.' },
            warning: { title: 'Storage low', description: 'You are close to your plan limit.' },
            info: { title: 'Deployment ready', description: 'Version 1.0.0 is available.' },
            action: {
                title: 'File uploaded',
                description: 'Share this file with your team?',
                autopilot: false,
                button: {
                    title: 'Share now',
                    onClick: (id: string) => sileo.dismiss(id)
                }
            }
        }[type];

        if (type === 'success') return sileo.success(payload);
        if (type === 'error') return sileo.error(payload);
        if (type === 'warning') return sileo.warning(payload);
        if (type === 'info') return sileo.info(payload);
        return sileo.action(payload);
    }
</script>

<section class="flex min-h-[76vh] flex-col items-center justify-center text-center">
    <h1 class="text-7xl font-bold tracking-tight md:text-8xl">Sileo.</h1>
    <p class="site-muted mt-6 max-w-xl text-lg">
        An opinionated toast component for Svelte with gooey SVG morphing and real Motion transitions.
    </p>

    <div class="site-card mt-10 rounded-xl px-5 py-3 text-sm">npm i sileo-svelte motion</div>

    <div class="site-muted mt-7 flex gap-6 text-sm">
        <a
            href={resolve('/play')}
            class="hover:opacity-100 opacity-90">Playground →</a
        >
        <a
            href={resolve('/docs')}
            class="hover:opacity-100 opacity-90">Documentation</a
        >
    </div>
</section>

<section class="pb-10 text-center">
    <p class="site-muted mb-4 text-xs uppercase tracking-[0.25em]">Try it</p>
    <div class="flex flex-wrap items-center justify-center gap-2">
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
        <button
            class="site-pill"
            onclick={() => fire('action')}>Action</button
        >
    </div>
</section>
