<script lang="ts">
    import { animate } from 'motion';
    import type { Snippet } from 'svelte';
    import { Button } from '$docs/components/ui/button/index.js';

    let { label, children }: { label: string; children: Snippet } = $props();
    let expanded = $state(false);
    const id = $props.id();

    function reveal(node: HTMLElement) {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        let controls: ReturnType<typeof animate> | undefined;
        let first = true;
        const settle = () => {
            controls?.stop();
            node.style.height = expanded ? 'auto' : '0px';
            node.style.opacity = expanded ? '1' : '0';
        };
        reduced.addEventListener('change', settle);
        $effect(() => {
            const open = expanded;
            let cancelled = false;
            const height = node.getBoundingClientRect().height;
            controls?.stop();
            if (first || reduced.matches) {
                first = false;
                settle();
            } else {
                controls = animate(
                    node,
                    { height: [height, open ? node.scrollHeight : 0], opacity: open ? 1 : 0 },
                    { type: 'spring', duration: 0.28, bounce: 0 }
                );
                void controls.then(() => {
                    if (!cancelled && open) node.style.height = 'auto';
                });
            }
            return () => {
                cancelled = true;
                controls?.stop();
            };
        });
        return () => {
            controls?.stop();
            reduced.removeEventListener('change', settle);
        };
    }
</script>

<div class="disclosure">
    <Button
        variant="ghost"
        class="disclosure-trigger"
        aria-expanded={expanded}
        aria-controls={id}
        onclick={() => (expanded = !expanded)}
    >
        {label}<svg
            class:expanded
            viewBox="0 0 16 16"
            aria-hidden="true"
            ><path
                d="m5 6 3 3 3-3"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
            /></svg
        >
    </Button>
    <div
        {id}
        class="disclosure-panel"
        inert={!expanded}
        aria-hidden={!expanded}
        {@attach reveal}
    >
        {@render children()}
    </div>
</div>

<style>
    .disclosure-panel {
        height: 0;
        opacity: 0;
        overflow: clip;
    }
    .disclosure :global(.disclosure-trigger) {
        width: 100%;
        justify-content: space-between;
        padding-inline: 0;
        background: transparent;
        font-size: 12px;
        color: var(--muted-foreground);
    }
    .disclosure :global(.disclosure-trigger:hover) {
        background: transparent;
        color: var(--foreground);
    }
    svg {
        transition: rotate 180ms ease;
    }
    svg.expanded {
        rotate: 180deg;
    }
    @media (prefers-reduced-motion: reduce) {
        .disclosure :global(.disclosure-trigger:hover) {
            background: transparent;
            color: var(--foreground);
        }
        svg {
            transition: none;
        }
    }
</style>
