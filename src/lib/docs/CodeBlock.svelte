<script lang="ts">
    interface Props {
        title?: string;
        language?: string;
        code: string;
    }

    let { title, language = 'ts', code }: Props = $props();
    let copied = $state(false);

    async function copy() {
        await navigator.clipboard.writeText(code);
        copied = true;
        setTimeout(() => (copied = false), 1200);
    }
</script>

<div class="site-card overflow-hidden rounded-xl">
    <div
        class="flex items-center justify-between border-b px-3 py-2 text-xs"
        style="border-color:var(--site-border)"
    >
        <div class="site-muted flex items-center gap-2">
            <span>{title ?? 'Code'}</span>
            <span class="rounded bg-black/10 px-1.5 py-0.5 uppercase dark:bg-white/10">{language}</span>
        </div>
        <button
            class="site-pill !rounded-md !px-2 !py-1 text-xs"
            onclick={copy}>{copied ? 'Copied' : 'Copy'}</button
        >
    </div>
    <pre
        class="overflow-x-auto p-4 text-sm leading-6"
        style="background:var(--site-code);color:#e5e7eb"><code>{code}</code></pre>
</div>
