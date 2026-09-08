<script lang="ts">
    import { onDestroy, onMount, tick, type Snippet } from 'svelte';

    import Sileo from './Sileo.svelte';
    import {
        store,
        dismissToast,
        completeToastCollapse,
        completeToastExit,
        registerToastInstance,
        pillAlign,
        expandDir,
        timeoutKey,
        type SileoItem,
        type SileoOffsetValue,
        type SileoOffsetConfig
    } from './store.svelte.js';
    import { SILEO_POSITIONS, type SileoOptions, type SileoPosition } from './types.js';
    import { DEFAULT_DURATION } from './constants.js';

    /* ---------------------------------- Props --------------------------------- */

    interface Props {
        children?: Snippet;
        position?: SileoPosition;
        offset?: SileoOffsetValue | SileoOffsetConfig;
        options?: Partial<SileoOptions>;
    }

    let { children, position = 'top-right', offset, options }: Props = $props();

    /* ------------------------------- Latest ID -------------------------------- */

    const latestItem = $derived.by(() => {
        const toasts = store.toasts;
        for (let i = toasts.length - 1; i >= 0; i--) {
            if (!toasts[i].exiting) return toasts[i];
        }
        return undefined;
    });
    const latest = $derived(latestItem?.id);

    /* ---------------------------------- State --------------------------------- */

    let focusedId = $state<string>();
    let activeId = $derived(focusedId ?? latest);
    let hovering = false;
    let liveMounted = $state(false);
    let announcement = $state('');
    let observedKeys: string[] = [];
    let announcementRevision = 0;
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- timers are non-reactive internal state; SvelteMap causes infinite loops in the timer $effect
    const timers = new Map<string, number>();
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- lifecycle registrations are non-reactive disposers
    const mounted = new Map<string, () => void>();

    /* --------------------------------- Sync ----------------------------------- */

    $effect(() => {
        store.position = position;
    });

    $effect(() => {
        store.globalOptions = options;
    });

    onMount(() => {
        liveMounted = true;
        return () => {
            liveMounted = false;
        };
    });

    $effect(() => {
        const toasts = store.toasts;
        if (!liveMounted) return;

        const previousKeys = new Set(observedKeys);
        const changed = toasts.filter((item) => !item.closing && !item.exiting && !previousKeys.has(timeoutKey(item)));
        observedKeys = toasts.map(timeoutKey);
        if (!changed.length) return;

        const revision = ++announcementRevision;
        announcement = '';
        void tick().then(() => {
            if (!liveMounted || revision !== announcementRevision) return;
            announcement = changed
                .filter((item) =>
                    store.toasts.some(
                        (toast) => timeoutKey(toast) === timeoutKey(item) && !toast.closing && !toast.exiting
                    )
                )
                .map((item) =>
                    [
                        item.title ?? item.state ?? 'Notification',
                        typeof item.description === 'string' ? item.description : undefined
                    ]
                        .filter(Boolean)
                        .join('. ')
                )
                .join(' ');
        });
    });

    onDestroy(() => {
        for (const unregister of mounted.values()) unregister();
        mounted.clear();
        if (store.position === position) store.position = 'top-right';
        if (store.globalOptions === options) store.globalOptions = undefined;
    });

    /* --------------------------------- Helpers -------------------------------- */

    function clearAllTimers() {
        for (const t of timers.values()) clearTimeout(t);
        timers.clear();
    }

    function schedule(items: SileoItem[]) {
        if (hovering || focusedId !== undefined) return;

        for (const item of items) {
            if (item.exiting || item.closing) continue;
            const key = timeoutKey(item);
            if (timers.has(key)) continue;

            const dur = item.duration === undefined ? DEFAULT_DURATION : item.duration;
            if (dur === null || dur <= 0) continue;

            timers.set(
                key,
                window.setTimeout(() => dismissToast(item.id, item.instanceId), dur)
            );
        }
    }

    /* ------------------------------ Timer Management -------------------------- */

    $effect(() => {
        const toasts = store.toasts;

        if (focusedId && !toasts.some((item) => item.id === focusedId && !item.exiting)) focusedId = undefined;
        const toastKeys = new Set(toasts.map(timeoutKey));
        for (const [key, unregister] of mounted) {
            if (!toastKeys.has(key)) {
                unregister();
                mounted.delete(key);
            }
        }
        for (const item of toasts) {
            const key = timeoutKey(item);
            if (!mounted.has(key)) mounted.set(key, registerToastInstance(item));
        }

        // Clean up timers for removed toasts
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
        activeId = focusedId ?? latest;
        if (hovering) {
            hovering = false;
            schedule(store.toasts);
        }
    }

    function handleFocusChange(toastId: string, focused: boolean) {
        focusedId = focused ? toastId : undefined;
        if (focused) clearAllTimers();
        else schedule(store.toasts);
    }

    function handleActivate(toastId: string) {
        activeId = toastId;
    }
</script>

{#if children}
    {@render children()}
{/if}

<div
    data-sileo-live-region
    role="status"
    aria-live="polite"
    aria-atomic="true"
>
    {announcement}
</div>

{#each SILEO_POSITIONS as pos (pos)}
    {#if byPosition[pos]?.length}
        <section
            data-sileo-viewport
            data-position={pos}
            style={getViewportStyle(pos)}
        >
            {#each byPosition[pos] ?? [] as item (item.id)}
                <Sileo
                    id={item.id}
                    toastState={item.state}
                    title={item.title}
                    description={item.description}
                    position={pillAlign(pos)}
                    expand={expandDir(pos)}
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
                    onActivate={() => handleActivate(item.id)}
                    onFocusChange={(focused) => handleFocusChange(item.id, focused)}
                    onDismiss={() => dismissToast(item.id, item.instanceId)}
                    onCollapseComplete={() => completeToastCollapse(item.id, item.instanceId)}
                    onExitComplete={() => completeToastExit(item.id, item.instanceId)}
                />
            {/each}
        </section>
    {/if}
{/each}
