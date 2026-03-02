<script lang="ts">
    import type { Snippet } from 'svelte';
    import Sileo from './Sileo.svelte';
    import { store } from './store.svelte.js';
    import { SILEO_POSITIONS, type SileoPosition, type SileoToastOptions } from './types.js';

    interface Props {
        children?: Snippet;
        position?: SileoPosition;
        options?: Partial<SileoToastOptions>;
    }

    let { children, position = 'top-right', options = {} }: Props = $props();

    $effect(() => {
        store.position = position;
        store.defaults = options;
    });

    const byPosition = $derived.by(() => {
        const grouped: Partial<Record<SileoPosition, typeof store.toasts>> = {};
        for (const pos of SILEO_POSITIONS) grouped[pos] = [];
        for (const toast of store.toasts) {
            grouped[toast.position] = [...(grouped[toast.position] ?? []), toast];
        }
        return grouped;
    });

    function dismiss(id: string) {
        store.setToasts(store.toasts.map((toast) => (toast.id === id ? { ...toast, exiting: true } : toast)));
    }

    function remove(id: string) {
        store.setToasts(store.toasts.filter((toast) => toast.id !== id));
    }
</script>

{#if children}
    {@render children()}
{/if}

{#each SILEO_POSITIONS as pos (pos)}
    {@const toasts = byPosition[pos] ?? []}
    {#if toasts.length}
        <section
            class="sileo-viewport"
            data-position={pos}
            aria-live="polite"
            aria-atomic="true"
        >
            {#each toasts as toast (toast.id)}
                <Sileo
                    {toast}
                    onRemove={remove}
                    onDismiss={dismiss}
                />
            {/each}
        </section>
    {/if}
{/each}
