<script lang="ts">
    import { animate } from 'motion';
    import { onMount, untrack, type Snippet } from 'svelte';
    import type { SileoToast } from './store.svelte.js';

    interface Props {
        toast: SileoToast;
        onRemove: (id: string) => void;
        onDismiss: (id: string) => void;
    }

    let { toast, onRemove, onDismiss }: Props = $props();

    let rootEl: HTMLDivElement | undefined = $state();
    let bodyEl: HTMLDivElement | undefined = $state();
    let progressEl: HTMLDivElement | undefined = $state();

    const stateLabel = $derived(toast.state === 'default' ? 'notice' : toast.state);

    const styleVars = $derived.by(() => {
        const styles = toast.styles;
        if (!styles) return undefined;
        const out: string[] = [];
        if (styles.background) out.push(`--sileo-bg:${styles.background}`);
        if (styles.foreground) out.push(`--sileo-fg:${styles.foreground}`);
        if (styles.mutedForeground) out.push(`--sileo-muted:${styles.mutedForeground}`);
        if (styles.badgeBackground) out.push(`--sileo-badge-bg:${styles.badgeBackground}`);
        if (styles.badgeForeground) out.push(`--sileo-badge-fg:${styles.badgeForeground}`);
        if (styles.actionBackground) out.push(`--sileo-action-bg:${styles.actionBackground}`);
        if (styles.actionForeground) out.push(`--sileo-action-fg:${styles.actionForeground}`);
        if (styles.borderColor) out.push(`--sileo-border:${styles.borderColor}`);
        return out.join(';');
    });

    function runExit() {
        const el = rootEl;
        if (!el) return onRemove(toast.id);
        animate(
            el,
            { opacity: [1, 0], y: [0, -8], scale: [1, 0.97] },
            { duration: 0.18, easing: 'ease-in' }
        ).finished.then(() => onRemove(toast.id));
    }

    onMount(() => {
        const root = rootEl;
        if (root)
            animate(root, { opacity: [0, 1], y: [14, 0], scale: [0.98, 1] }, { duration: 0.24, easing: 'ease-out' });
        const body = bodyEl;
        if (body) animate(body, { opacity: [0.7, 1] }, { duration: 0.2 });
    });

    $effect(() => {
        if (toast.exiting) runExit();
    });

    $effect(() => {
        const bar = progressEl;
        const duration = toast.duration;
        const id = toast.id;
        if (!bar || duration === null || duration <= 0 || toast.state === 'loading') return;

        bar.style.transformOrigin = 'left';
        const control = animate(bar, { scaleX: [1, 0] }, { duration: duration / 1000, easing: 'linear' });

        control.finished.then(() => {
            if (untrack(() => toast.id) === id) onDismiss(id);
        });

        return () => control.cancel();
    });
</script>

<div
    bind:this={rootEl}
    role="status"
    class={`sileo-toast ${toast.classNames?.root ?? ''}`}
    data-state={toast.state}
    style={styleVars}
>
    <div
        bind:this={bodyEl}
        class="sileo-main"
    >
        <div class="sileo-heading">
            <span class={`sileo-badge ${toast.classNames?.badge ?? ''}`}>{stateLabel}</span>
            <h4 class={`sileo-title ${toast.classNames?.title ?? ''}`}>{toast.title}</h4>
        </div>
        {#if toast.description}
            <div class={`sileo-description ${toast.classNames?.description ?? ''}`}>
                {#if typeof toast.description === 'string'}
                    {toast.description}
                {:else}
                    {@render (toast.description as Snippet)()}
                {/if}
            </div>
        {/if}
        {#if toast.action}
            <button
                class={`sileo-action ${toast.classNames?.action ?? ''}`}
                onclick={() => toast.action?.onClick(toast.id)}
            >
                {toast.action.label}
            </button>
        {/if}
    </div>

    {#if toast.closeable}
        <button
            class="sileo-close"
            aria-label="Dismiss toast"
            onclick={() => onDismiss(toast.id)}>×</button
        >
    {/if}

    <div
        bind:this={progressEl}
        class="sileo-progress"
    ></div>
</div>
