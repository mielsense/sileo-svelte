<script lang="ts">
    interface Props {
        title?: string;
        language?: string;
        code: string;
    }

    let { title, language = 'bash', code }: Props = $props();

    let copied = $state(false);

    async function copy() {
        await navigator.clipboard.writeText(code);
        copied = true;
        setTimeout(() => (copied = false), 1200);
    }
</script>

<div class="overflow-hidden rounded-xl border border-black/10 bg-zinc-950/95 dark:border-white/10 dark:bg-black/40">
    <div
        class="flex items-center justify-between border-b border-black/10 px-3 py-2 text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400"
    >
        <span>{title ?? language}</span>
        <button
            class="rounded-md bg-zinc-800 px-2 py-1 text-zinc-200 dark:bg-white/10"
            onclick={copy}
        >
            {copied ? 'Copied' : 'Copy'}
        </button>
    </div>
    <pre class="overflow-x-auto p-4 text-sm text-zinc-100"><code>{code}</code></pre>
</div>
