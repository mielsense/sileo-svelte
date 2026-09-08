<script lang="ts">
    import IconButton from '../_components/IconButton.svelte';
    import type { Snippet } from 'svelte';
    import HugeiconsIcon from '$docs/hugeicons-icon.svelte';
    import Copy01Icon from '@hugeicons/core-free-icons/Copy01Icon';
    import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon';
    import Tick02Icon from '@hugeicons/core-free-icons/Tick02Icon';
    import { animate } from 'motion';
    import { Button } from '$docs/components/ui/button/index.js';
    import svelteLanguage from 'svelte-highlight/languages/svelte';
    import { ensureRegistered, registry } from 'svelte-highlight/registry';
    ensureRegistered(svelteLanguage);
    let {
        source,
        children,
        viewMode = $bindable('preview'),
        label = 'example',
        onCopy,
        onClear,
        clearDisabled = false
    }: {
        source: string;
        children: Snippet;
        viewMode?: 'preview' | 'code';
        label?: string;
        onCopy?: () => void;
        onClear?: () => void;
        clearDisabled?: boolean;
    } = $props();
    let copyStatus = $state('');
    const highlighted = $derived(registry.highlight(source, { language: svelteLanguage.name }).value);
    $effect(() => {
        void source;
        copyStatus = '';
    });
    function copyFeedback(node: HTMLElement) {
        $effect(() => {
            if (!copyStatus || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const animation = animate(node, { opacity: [0.4, 1], y: [3, 0] }, { duration: 0.16 });
            return () => animation.stop();
        });
    }
    function revealCode(node: HTMLElement) {
        $effect(() => {
            if (viewMode !== 'code' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const animation = animate(node, { opacity: [0, 1], y: [4, 0] }, { duration: 0.18 });
            return () => animation.stop();
        });
    }
    async function copy() {
        try {
            await navigator.clipboard.writeText(source);
            copyStatus = 'Copied';
            onCopy?.();
        } catch {
            copyStatus = 'Copy failed';
        }
    }
</script>

<div class="preview-panel">
    <div class="example-toolbar">
        <div
            class="view-switch"
            role="group"
            aria-label="Example view"
        >
            <Button
                variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
                aria-pressed={viewMode === 'preview'}
                onclick={() => (viewMode = 'preview')}>Preview</Button
            >
            <Button
                variant={viewMode === 'code' ? 'secondary' : 'ghost'}
                aria-pressed={viewMode === 'code'}
                onclick={() => (viewMode = 'code')}>Code</Button
            >
        </div>
        <div class="preview-actions">
            <IconButton
                variant="ghost"
                size="icon"
                aria-label={`Copy ${label}`}
                tooltip={copyStatus || 'Copy code'}
                onclick={copy}
            >
                <span {@attach copyFeedback}
                    ><HugeiconsIcon
                        icon={copyStatus === 'Copied' ? Tick02Icon : Copy01Icon}
                        size={16}
                        aria-hidden="true"
                    /></span
                >
            </IconButton>
            <span
                class="visually-hidden"
                aria-live="polite">{copyStatus}</span
            >
            {#if onClear}
                <IconButton
                    variant="ghost"
                    size="icon"
                    aria-label="Clear all"
                    tooltip="Clear all toasts"
                    disabled={clearDisabled}
                    onclick={onClear}
                >
                    <HugeiconsIcon
                        icon={Cancel01Icon}
                        size={16}
                        aria-hidden="true"
                    />
                </IconButton>
            {/if}
        </div>
    </div>
    <div hidden={viewMode !== 'preview'}>{@render children()}</div>
    <div
        class="source-panel"
        hidden={viewMode !== 'code'}
        aria-label="Example source"
    >
        <!-- The highlighter escapes all source text, including user-entered values. -->
        <!-- eslint-disable svelte/no-at-html-tags -->
        <pre {@attach revealCode}><code
                class="hljs"
                data-scenario-source>{@html highlighted}</code
            ></pre>
        <!-- eslint-enable svelte/no-at-html-tags -->
    </div>
</div>
