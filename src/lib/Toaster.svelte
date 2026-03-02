<script lang="ts">
    import type { Snippet } from 'svelte';

    import Sileo from './Sileo.svelte';
    import {
        store,
        pillAlign,
        expandDir,
        timeoutKey,
        type SileoItem,
        type SileoOffsetValue,
        type SileoOffsetConfig
    } from './store.svelte.js';
    import { SILEO_POSITIONS, type SileoOptions, type SileoPosition } from './types.js';

    /* -------------------------------- Constants ------------------------------- */

    const DEFAULT_DURATION = 6000;
    const EXIT_DURATION = DEFAULT_DURATION * 0.1;

    /* ---------------------------------- Props --------------------------------- */

    interface Props {
        children?: Snippet;
        position?: SileoPosition;
        offset?: SileoOffsetValue | SileoOffsetConfig;
        options?: Partial<SileoOptions>;
    }

    let { children, position = 'top-right', offset, options }: Props = $props();

    /* ------------------------------- Latest ID -------------------------------- */

    const latest = $derived.by(() => {
        const toasts = store.toasts;
        for (let i = toasts.length - 1; i >= 0; i--) {
            if (!toasts[i].exiting) return toasts[i].id;
        }
        return undefined;
    });

    /* ---------------------------------- State --------------------------------- */

    let activeId = $derived(latest);
    let hovering = false;
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- timers are non-reactive internal state; SvelteMap causes infinite loops in the timer $effect
    const timers = new Map<string, number>();

    /* --------------------------------- Sync ----------------------------------- */

    $effect(() => {
        store.position = position;
    });

    $effect(() => {
        store.globalOptions = options;
    });

    /* --------------------------------- Helpers -------------------------------- */

    function dismissToast(id: string) {
        const item = store.toasts.find((t) => t.id === id);
        if (!item || item.exiting) return;

        store.update((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));

        setTimeout(() => store.update((prev) => prev.filter((t) => t.id !== id)), EXIT_DURATION);
    }

    function clearAllTimers() {
        for (const t of timers.values()) clearTimeout(t);
        timers.clear();
    }

    function schedule(items: SileoItem[]) {
        if (hovering) return;

        for (const item of items) {
            if (item.exiting) continue;
            const key = timeoutKey(item);
            if (timers.has(key)) continue;

            const dur = item.duration ?? DEFAULT_DURATION;
            if (dur === null || dur <= 0) continue;

            timers.set(
                key,
                window.setTimeout(() => dismissToast(item.id), dur)
            );
        }
    }

    /* ------------------------------ Timer Management -------------------------- */

    $effect(() => {
        const toasts = store.toasts;

        // Clean up timers for removed toasts
        const toastKeys = new Set(toasts.map(timeoutKey));
        for (const [key, timer] of timers) {
            if (!toastKeys.has(key)) {
                clearTimeout(timer);
                timers.delete(key);
            }
        }

        schedule(toasts);
    });

    $effect(() => {
        return () => {
            clearAllTimers();
        };
    });

    /* ----------------------------- By Position -------------------------------- */

    const byPosition = $derived.by(() => {
        const map = {} as Partial<Record<SileoPosition, SileoItem[]>>;
        for (const t of store.toasts) {
            const pos = t.position ?? position;
            const arr = map[pos];
            if (arr) {
                arr.push(t);
            } else {
                map[pos] = [t];
            }
        }
        return map;
    });

    /* ----------------------------- Viewport Style ----------------------------- */

    function getViewportStyle(pos: SileoPosition): string | undefined {
        if (offset === undefined) return undefined;

        const o =
            typeof offset === 'object'
                ? offset
                : {
                      top: offset,
                      right: offset,
                      bottom: offset,
                      left: offset
                  };

        const parts: string[] = [];
        const px = (v: SileoOffsetValue) => (typeof v === 'number' ? `${v}px` : v);

        if (pos.startsWith('top') && o.top != null) parts.push(`top:${px(o.top)}`);
        if (pos.startsWith('bottom') && o.bottom != null) parts.push(`bottom:${px(o.bottom)}`);
        if (pos.endsWith('left') && o.left != null) parts.push(`left:${px(o.left)}`);
        if (pos.endsWith('right') && o.right != null) parts.push(`right:${px(o.right)}`);

        return parts.length ? parts.join(';') : undefined;
    }

    /* -------------------------------- Handlers -------------------------------- */

    function handleMouseEnter(toastId: string) {
        activeId = toastId;
        if (!hovering) {
            hovering = true;
            clearAllTimers();
        }
    }

    function handleMouseLeave() {
        activeId = latest;
        if (hovering) {
            hovering = false;
            schedule(store.toasts);
        }
    }
</script>

{#if children}
    {@render children()}
{/if}

{#each SILEO_POSITIONS as pos (pos)}
    {@const items = byPosition[pos]}
    {#if items && items.length > 0}
        {@const pill = pillAlign(pos)}
        {@const dir = expandDir(pos)}
        <section
            data-sileo-viewport
            data-position={pos}
            aria-live="polite"
            style={getViewportStyle(pos)}
        >
            {#each items as item (item.id)}
                <Sileo
                    id={item.id}
                    toastState={item.state}
                    title={item.title}
                    description={item.description}
                    position={pill}
                    expand={dir}
                    icon={item.icon}
                    fill={item.fill}
                    classes={item.classes}
                    styles={item.styles}
                    button={item.button}
                    roundness={item.roundness}
                    closing={item.closing}
                    exiting={item.exiting}
                    autoExpandDelayMs={item.autoExpandDelayMs}
                    autoCollapseDelayMs={item.autoCollapseDelayMs}
                    refreshKey={item.instanceId}
                    canExpand={activeId === undefined || activeId === item.id}
                    onmouseenter={() => handleMouseEnter(item.id)}
                    onmouseleave={() => handleMouseLeave()}
                    onDismiss={() => dismissToast(item.id)}
                />
            {/each}
        </section>
    {/if}
{/each}
