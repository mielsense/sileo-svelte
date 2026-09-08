<script lang="ts">
    import { onDestroy } from 'svelte';
    import Copy01Icon from '@hugeicons/core-free-icons/Copy01Icon';
    import Tick02Icon from '@hugeicons/core-free-icons/Tick02Icon';
    import IconButton from './IconButton.svelte';
    import HugeiconsIcon from '$docs/hugeicons-icon.svelte';

    let { value, language }: { value: string; language: string } = $props();
    let status = $state('');
    let resetTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    async function copy() {
        try {
            await navigator.clipboard.writeText(value);
            status = 'Copied';
        } catch {
            status = 'Copy failed';
        }
        if (disposed) return;
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => (status = ''), 1600);
    }

    onDestroy(() => {
        disposed = true;
        clearTimeout(resetTimer);
    });
</script>

<IconButton
    class="code-copy-button"
    variant="ghost"
    size="icon-sm"
    aria-label={`Copy ${language} code`}
    tooltip={status || 'Copy code'}
    onclick={copy}
>
    <HugeiconsIcon
        icon={status === 'Copied' ? Tick02Icon : Copy01Icon}
        size={16}
        aria-hidden="true"
    />
</IconButton>
<span
    class="visually-hidden"
    aria-live="polite">{status}</span
>
