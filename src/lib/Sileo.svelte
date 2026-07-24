<script lang="ts">
    import { untrack, type Snippet } from 'svelte';
    import type { SileoButton, SileoClasses, SileoState, SileoStyles } from './types.js';
    import Check from './icons/Check.svelte';
    import LoaderCircle from './icons/LoaderCircle.svelte';
    import X from './icons/X.svelte';
    import CircleAlert from './icons/CircleAlert.svelte';
    import LifeBuoy from './icons/LifeBuoy.svelte';
    import ArrowRight from './icons/ArrowRight.svelte';

    /* --------------------------------- Config --------------------------------- */

    const HEIGHT = 40;
    const WIDTH = 350;
    const DEFAULT_ROUNDNESS = 18;
    const BLUR_RATIO = 0.5;
    const PILL_PADDING = 10;
    const MIN_EXPAND_RATIO = 2.25;
    const SWAP_COLLAPSE_MS = 200;
    const HEADER_EXIT_MS = 150;
    const SWIPE_DISMISS = 30;
    const SWIPE_MAX = 20;

    /* ---------------------------------- Types --------------------------------- */

    interface View {
        title?: string;
        description?: Snippet | string;
        toastState: SileoState;
        icon?: Snippet | null;
        classes?: SileoClasses;
        styles?: SileoStyles;
        button?: SileoButton;
        fill: string;
    }

    interface HeaderLayer {
        current: { key: string; view: View };
        prev: { key: string; view: View } | null;
    }

    /* ---------------------------------- Props --------------------------------- */

    interface Props {
        id: string;
        fill?: string;
        toastState?: SileoState;
        title?: string;
        description?: Snippet | string;
        position?: 'left' | 'center' | 'right';
        expand?: 'top' | 'bottom';
        className?: string;
        icon?: Snippet | null;
        classes?: SileoClasses;
        styles?: SileoStyles;
        button?: SileoButton;
        roundness?: number;
        closing?: boolean;
        exiting?: boolean;
        autoExpandDelayMs?: number;
        autoCollapseDelayMs?: number;
        canExpand?: boolean;
        interruptKey?: string;
        refreshKey?: string;
        onmouseenter?: (e: MouseEvent) => void;
        onmouseleave?: (e: MouseEvent) => void;
        onActivate?: () => void;
        onDismiss?: () => void;
    }

    let {
        id,
        fill = '#1c1c1e',
        toastState = 'success',
        title = toastState,
        description,
        position = 'left',
        expand = 'bottom',
        className,
        icon,
        classes,
        styles,
        button,
        roundness,
        closing = false,
        exiting = false,
        autoExpandDelayMs,
        autoCollapseDelayMs,
        canExpand,
        interruptKey,
        refreshKey,
        onmouseenter,
        onmouseleave,
        onActivate,
        onDismiss
    }: Props = $props();
    const componentId = $props.id();

    /* ---------------------------------- State --------------------------------- */

    const next: View = $derived({
        title,
        description,
        toastState,
        icon,
        classes,
        styles,
        button,
        fill
    });

    let view: View = $state(undefined as unknown as View);
    let applied: string | undefined = $state(undefined);
    let isExpanded = $state(false);
    let ready = $state(false);
    let pillWidth = $state(0);
    let contentHeight = $state(0);
    let canvasWidth = $state(WIDTH);
    let baseHeight = $state(HEIGHT);

    /* ---------------------------------- Refs ---------------------------------- */

    let buttonEl: HTMLDivElement | undefined = $state();
    let headerEl: HTMLElement | undefined = $state();
    let contentEl: HTMLDivElement | undefined = $state();
    let innerEl: HTMLDivElement | undefined = $state();

    let headerExitTimer: number | null = null;
    let autoExpandTimer: number | null = null;
    let autoCollapseTimer: number | null = null;
    let swapTimer: number | null = null;
    let lastRefreshKey: string | undefined = undefined;
    let pending: { key?: string; payload: View } | null = null;
    let headerPad: number | null = null;
    let pointerStart: number | null = null;
    let pointerMaxDelta = 0;
    let pointerStartedOpen: boolean | null = null;
    let suppressClick = false;
    let frozenExpanded = $state(HEIGHT * MIN_EXPAND_RATIO);

    let headerLayer: HeaderLayer = $state(undefined as unknown as HeaderLayer);

    // Initialize view from next on first run
    let initialized = false;

    $effect.pre(() => {
        if (!initialized) {
            initialized = true;
            view = next;
            applied = refreshKey;
            lastRefreshKey = refreshKey;
            headerLayer = {
                current: {
                    key: `${next.toastState}-${next.title}`,
                    view: next
                },
                prev: null
            };
        }
    });

    const hasDesc = $derived(view ? Boolean(view.description) || Boolean(view.button) : false);
    const isLoading = $derived(view?.toastState === 'loading');
    const open = $derived(hasDesc && isExpanded && !isLoading);
    const allowExpand = $derived(isLoading ? false : (canExpand ?? (!interruptKey || interruptKey === id)));

    const headerKey = $derived(`${view?.toastState}-${view?.title}`);
    const filterId = `${componentId}-gooey`;
    const contentId = `${componentId}-content`;
    const resolvedRoundness = $derived(Math.max(0, roundness ?? DEFAULT_ROUNDNESS));
    const blur = $derived(resolvedRoundness * BLUR_RATIO);

    /* ------------------------------ Measurements ------------------------------ */

    $effect(() => {
        const toast = buttonEl;
        const header = headerEl;
        if (!toast || !header) return;

        const sizeOf = (entry: ResizeObserverEntry) => {
            const borderSize = Array.isArray(entry.borderBoxSize) ? entry.borderBoxSize[0] : entry.borderBoxSize;
            return {
                width: borderSize?.inlineSize ?? entry.contentRect.width,
                height: borderSize?.blockSize ?? entry.contentRect.height
            };
        };

        const measure = () => {
            const toastRect = toast.getBoundingClientRect();
            const headerRect = header.getBoundingClientRect();
            if (toastRect.width > 0) canvasWidth = toastRect.width;
            if (headerRect.height > 0) baseHeight = headerRect.height;
        };

        measure();

        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const size = sizeOf(entry);
                if (entry.target === toast && size.width > 0) canvasWidth = size.width;
                if (entry.target === header && size.height > 0) baseHeight = size.height;
            }
        });
        ro.observe(toast);
        ro.observe(header);

        return () => ro.disconnect();
    });

    $effect(() => {
        const el = innerEl;
        const header = headerEl;
        // subscribe to headerLayer.current.key so we re-measure on change
        void headerLayer.current.key;
        if (!el || !header) return;

        if (headerPad === null) {
            const cs = getComputedStyle(header);
            headerPad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
        }
        const px = headerPad;

        const measure = () => {
            const w = el.scrollWidth + px + PILL_PADDING;
            if (w > PILL_PADDING) {
                pillWidth = w;
            }
        };
        measure();

        let rafId = 0;
        const ro = new ResizeObserver(() => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(measure);
        });
        ro.observe(el);

        return () => {
            cancelAnimationFrame(rafId);
            ro.disconnect();
        };
    });

    $effect(() => {
        const _hasDesc = hasDesc;
        const el = contentEl;
        if (!_hasDesc) {
            contentHeight = 0;
            return;
        }
        if (!el) return;

        const measure = () => {
            const h = el.scrollHeight;
            contentHeight = h;
        };
        measure();

        let rafId = 0;
        const ro = new ResizeObserver(() => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(measure);
        });
        ro.observe(el);

        return () => {
            cancelAnimationFrame(rafId);
            ro.disconnect();
        };
    });

    // Mark ready after first frame
    $effect(() => {
        const raf = requestAnimationFrame(() => {
            ready = true;
        });
        return () => cancelAnimationFrame(raf);
    });

    // Header layer management
    $effect(() => {
        const currentHeaderKey = headerKey;
        const currentView = view;

        untrack(() => {
            if (!currentView) return;
            if (headerLayer.current.key === currentHeaderKey) {
                headerLayer = {
                    ...headerLayer,
                    current: { key: currentHeaderKey, view: currentView }
                };
            } else {
                headerLayer = {
                    prev: headerLayer.current,
                    current: { key: currentHeaderKey, view: currentView }
                };
            }
        });
    });

    // Header exit timer
    $effect(() => {
        if (!headerLayer.prev) return;

        if (headerExitTimer) clearTimeout(headerExitTimer);

        headerExitTimer = window.setTimeout(() => {
            headerExitTimer = null;
            headerLayer = { ...headerLayer, prev: null };
        }, HEADER_EXIT_MS);

        return () => {
            if (headerExitTimer) {
                clearTimeout(headerExitTimer);
                headerExitTimer = null;
            }
        };
    });

    /* ----------------------------- Refresh logic ------------------------------ */

    $effect(() => {
        const currentRefreshKey = refreshKey;
        const currentNext = next;
        const currentOpen = open;

        untrack(() => {
            if (currentRefreshKey === undefined) {
                view = currentNext;
                applied = undefined;
                pending = null;
                lastRefreshKey = currentRefreshKey;
                return;
            }

            if (lastRefreshKey === currentRefreshKey) return;
            lastRefreshKey = currentRefreshKey;

            if (swapTimer) {
                clearTimeout(swapTimer);
                swapTimer = null;
            }

            if (currentOpen) {
                pending = { key: currentRefreshKey, payload: currentNext };
                isExpanded = false;
                swapTimer = window.setTimeout(() => {
                    swapTimer = null;
                    const p = pending;
                    if (!p) return;
                    view = p.payload;
                    applied = p.key;
                    pending = null;
                }, SWAP_COLLAPSE_MS);
            } else {
                pending = null;
                view = currentNext;
                applied = currentRefreshKey;
            }
        });
    });

    /* ----------------------------- Auto expand/collapse ----------------------- */

    $effect(() => {
        const _hasDesc = hasDesc;
        const _exiting = exiting;
        const _allowExpand = allowExpand;
        const _autoExpandDelayMs = autoExpandDelayMs;
        const _autoCollapseDelayMs = autoCollapseDelayMs;
        void applied;

        if (autoExpandTimer) clearTimeout(autoExpandTimer);
        if (autoCollapseTimer) clearTimeout(autoCollapseTimer);

        if (!_hasDesc) return;

        if (_exiting || closing || !_allowExpand) {
            isExpanded = false;
            return;
        }

        if (_autoExpandDelayMs == null && _autoCollapseDelayMs == null) return;

        const expandDelay = _autoExpandDelayMs ?? 0;
        const collapseDelay = _autoCollapseDelayMs ?? 0;

        if (expandDelay > 0) {
            autoExpandTimer = window.setTimeout(() => {
                isExpanded = true;
            }, expandDelay);
        } else {
            isExpanded = true;
        }

        if (collapseDelay > 0) {
            autoCollapseTimer = window.setTimeout(() => {
                isExpanded = false;
            }, collapseDelay);
        }

        return () => {
            if (autoExpandTimer) clearTimeout(autoExpandTimer);
            if (autoCollapseTimer) clearTimeout(autoCollapseTimer);
        };
    });

    /* ------------------------------ Derived values ---------------------------- */

    const minExpanded = $derived(baseHeight * MIN_EXPAND_RATIO);
    const rawExpanded = $derived(hasDesc ? Math.max(minExpanded, baseHeight + contentHeight) : minExpanded);

    $effect(() => {
        if (open) {
            frozenExpanded = rawExpanded;
        }
    });

    const expanded = $derived(open ? rawExpanded : frozenExpanded);
    const svgHeight = $derived(hasDesc ? Math.max(expanded, minExpanded) : baseHeight);
    const expandedContent = $derived(Math.max(0, expanded - baseHeight));
    const resolvedPillWidth = $derived(Math.min(Math.max(pillWidth || baseHeight, baseHeight), canvasWidth));
    const pillHeight = $derived(baseHeight + blur * 3);

    const pillX = $derived(
        position === 'right'
            ? canvasWidth - resolvedPillWidth
            : position === 'center'
              ? (canvasWidth - resolvedPillWidth) / 2
              : 0
    );

    /* ------------------------------- Inline styles ---------------------------- */

    const skinVars = $derived.by(() => {
        const v = view?.styles;
        if (!v) return '';

        const entries: Array<[string, string | undefined]> = [
            ['--sileo-title-color', v.titleColor],
            ['--sileo-description-color', v.descriptionColor],
            ['--sileo-badge-color', v.badgeColor],
            ['--sileo-badge-bg', v.badgeBackground],
            ['--sileo-button-color', v.buttonColor],
            ['--sileo-button-bg', v.buttonBackground],
            ['--sileo-button-bg-hover', v.buttonHoverBackground]
        ];

        return entries
            .filter(([, value]) => value != null && value !== '')
            .map(([name, value]) => `${name}:${value}`)
            .join(';');
    });

    const rootStyle = $derived(
        `--_base-h:${baseHeight}px;` +
            `--_h:${open ? expanded : baseHeight}px;` +
            `--_pw:${resolvedPillWidth}px;` +
            `--_px:${pillX}px;` +
            `--_sy:${open ? 1 : baseHeight / pillHeight};` +
            `--_ph:${pillHeight}px;` +
            `--_by:${open ? 1 : 0};` +
            `--_ht:translateY(${open ? (expand === 'bottom' ? 3 : -3) : 0}px) scale(${open ? 0.9 : 1});` +
            `--_co:${open ? 1 : 0}` +
            (skinVars ? `;${skinVars}` : '')
    );

    /* -------------------------------- Handlers -------------------------------- */

    function handleEnter(e: MouseEvent) {
        onmouseenter?.(e);
        if (hasDesc) isExpanded = true;
    }

    function handleLeave(e: MouseEvent) {
        onmouseleave?.(e);
        if (buttonEl?.contains(document.activeElement)) return;
        isExpanded = false;
    }

    function handleFocusIn() {
        if (!hasDesc || isLoading || (!allowExpand && !onActivate)) return;
        onActivate?.();
        isExpanded = true;
    }

    function handleFocusOut(e: FocusEvent) {
        const nextTarget = e.relatedTarget;
        if (nextTarget instanceof Node && buttonEl?.contains(nextTarget)) return;
        isExpanded = false;
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key !== 'Escape' || !open) return;
        e.preventDefault();
        e.stopPropagation();
        headerEl?.focus();
        isExpanded = false;
    }

    function handleTriggerClick() {
        const startedOpen = pointerStartedOpen;
        pointerStartedOpen = null;
        if (suppressClick) {
            suppressClick = false;
            return;
        }
        if (!hasDesc || isLoading || (!allowExpand && !onActivate)) return;
        onActivate?.();
        isExpanded = startedOpen === null ? !isExpanded : !startedOpen;
    }

    function handleTransitionEnd(e: TransitionEvent) {
        if (e.propertyName !== 'height' && e.propertyName !== 'transform') return;
        if (open) return;
        const p = pending;
        if (!p) return;
        if (swapTimer) {
            clearTimeout(swapTimer);
            swapTimer = null;
        }
        view = p.payload;
        applied = p.key;
        pending = null;
    }

    function handlePointerDown(e: PointerEvent) {
        if (exiting) return;
        const target = e.target as HTMLElement;
        if (target.closest('[data-sileo-button]')) return;

        if (target.closest('[data-sileo-trigger]')) {
            onActivate?.();
            pointerStartedOpen = open;
        }

        if (!onDismiss) return;
        suppressClick = false;
        pointerStart = e.clientY;
        pointerMaxDelta = 0;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    /* -------------------------------- Swipe ----------------------------------- */

    $effect(() => {
        const el = buttonEl;
        if (!el) return;

        const onMove = (e: PointerEvent) => {
            if (pointerStart === null) return;
            const dy = e.clientY - pointerStart;
            pointerMaxDelta = Math.max(pointerMaxDelta, Math.abs(dy));
            if (pointerMaxDelta > 5) suppressClick = true;
            const sign = dy > 0 ? 1 : -1;
            const clamped = Math.min(Math.abs(dy), SWIPE_MAX) * sign;
            el.style.transform = `translateY(${clamped}px)`;
        };

        const onUp = (e: PointerEvent) => {
            if (pointerStart === null) return;
            const dy = e.clientY - pointerStart;
            pointerStart = null;
            el.style.transform = '';
            suppressClick = pointerMaxDelta > 5;
            pointerMaxDelta = 0;
            if (Math.abs(dy) > SWIPE_DISMISS) {
                onDismiss?.();
            }
        };

        const onCancel = () => {
            pointerStart = null;
            pointerMaxDelta = 0;
            pointerStartedOpen = null;
            suppressClick = false;
            el.style.transform = '';
        };

        const onLostCapture = () => {
            if (pointerStart !== null) onCancel();
        };

        const onCapturedClick = (e: MouseEvent) => {
            if (e.target === el && pointerStartedOpen !== null) handleTriggerClick();
        };

        el.addEventListener('pointermove', onMove, { passive: true });
        el.addEventListener('pointerup', onUp, { passive: true });
        el.addEventListener('pointercancel', onCancel, { passive: true });
        el.addEventListener('lostpointercapture', onLostCapture);
        el.addEventListener('click', onCapturedClick);

        return () => {
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerup', onUp);
            el.removeEventListener('pointercancel', onCancel);
            el.removeEventListener('lostpointercapture', onLostCapture);
            el.removeEventListener('click', onCapturedClick);
        };
    });

    /* ---------------------------------- Icons --------------------------------- */

    const stateIcons: Record<SileoState, typeof Check> = {
        success: Check,
        loading: LoaderCircle,
        error: X,
        warning: CircleAlert,
        info: LifeBuoy,
        action: ArrowRight
    };

    function isSnippet(val: unknown): val is Snippet {
        return typeof val === 'function';
    }
</script>

{#if view}
    {#snippet headerLayers()}
        <div data-sileo-header-stack>
            {#key headerLayer.current.key}
                <div
                    bind:this={innerEl}
                    data-sileo-header-inner
                    data-layer="current"
                >
                    {#if headerLayer.current.view.icon !== null}
                        <div
                            data-sileo-badge
                            data-state={headerLayer.current.view.toastState}
                            class={headerLayer.current.view.classes?.badge}
                        >
                            {#if isSnippet(headerLayer.current.view.icon)}
                                {@render headerLayer.current.view.icon()}
                            {:else}
                                {@const IconComponent = stateIcons[headerLayer.current.view.toastState]}
                                <IconComponent />
                            {/if}
                        </div>
                    {/if}
                    <span
                        data-sileo-title
                        data-state={headerLayer.current.view.toastState}
                        class={headerLayer.current.view.classes?.title}
                    >
                        {headerLayer.current.view.title}
                    </span>
                </div>
            {/key}
            {#if headerLayer.prev}
                <div
                    data-sileo-header-inner
                    data-layer="prev"
                    data-exiting="true"
                    aria-hidden="true"
                >
                    {#if headerLayer.prev.view.icon !== null}
                        <div
                            data-sileo-badge
                            data-state={headerLayer.prev.view.toastState}
                            class={headerLayer.prev.view.classes?.badge}
                        >
                            {#if isSnippet(headerLayer.prev.view.icon)}
                                {@render headerLayer.prev.view.icon()}
                            {:else}
                                {@const PrevIconComponent = stateIcons[headerLayer.prev.view.toastState]}
                                <PrevIconComponent />
                            {/if}
                        </div>
                    {/if}
                    <span
                        data-sileo-title
                        data-state={headerLayer.prev.view.toastState}
                        class={headerLayer.prev.view.classes?.title}
                    >
                        {headerLayer.prev.view.title}
                    </span>
                </div>
            {/if}
        </div>
    {/snippet}

    <div
        bind:this={buttonEl}
        role="group"
        data-sileo-toast
        data-ready={ready}
        data-expanded={open}
        data-exiting={exiting}
        data-edge={expand}
        data-position={position}
        data-state={view.toastState}
        class={className}
        style={rootStyle}
        onmouseenter={handleEnter}
        onmouseleave={handleLeave}
        ontransitionend={handleTransitionEnd}
        onpointerdown={handlePointerDown}
    >
        <div
            data-sileo-canvas
            data-edge={expand}
        >
            <svg
                data-sileo-svg
                width={canvasWidth}
                height={svgHeight}
                viewBox={`0 0 ${canvasWidth} ${svgHeight}`}
                aria-hidden="true"
            >
                <defs>
                    <filter
                        id={filterId}
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                        color-interpolation-filters="sRGB"
                    >
                        <feGaussianBlur
                            in="SourceGraphic"
                            stdDeviation={blur}
                            result="blur"
                        />
                        <feColorMatrix
                            in="blur"
                            type="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
                            result="goo"
                        />
                        <feComposite
                            in="SourceGraphic"
                            in2="goo"
                            operator="atop"
                        />
                    </filter>
                </defs>
                <g filter={`url(#${filterId})`}>
                    <rect
                        data-sileo-pill
                        x={pillX}
                        rx={resolvedRoundness}
                        ry={resolvedRoundness}
                        fill={view.fill}
                    />
                    <rect
                        data-sileo-body
                        y={baseHeight}
                        width={canvasWidth}
                        height={expandedContent}
                        rx={resolvedRoundness}
                        ry={resolvedRoundness}
                        fill={view.fill}
                    />
                </g>
            </svg>
        </div>

        {#if hasDesc && !isLoading}
            <button
                bind:this={headerEl}
                type="button"
                tabindex={view.button ? 0 : -1}
                aria-expanded={open}
                aria-controls={contentId}
                data-sileo-header
                data-sileo-trigger
                data-edge={expand}
                onfocusin={handleFocusIn}
                onfocusout={handleFocusOut}
                onkeydown={handleKeyDown}
                onclick={handleTriggerClick}
            >
                {@render headerLayers()}
            </button>
        {:else}
            <div
                bind:this={headerEl}
                data-sileo-header
                data-edge={expand}
            >
                {@render headerLayers()}
            </div>
        {/if}

        {#if hasDesc}
            <div
                id={contentId}
                data-sileo-content
                data-edge={expand}
                data-visible={open}
            >
                <div
                    bind:this={contentEl}
                    data-sileo-description
                    class={view.classes?.description}
                >
                    {#if view.description}
                        {#if isSnippet(view.description)}
                            {@render view.description()}
                        {:else}
                            {view.description}
                        {/if}
                    {/if}
                    {#if view.button}
                        <button
                            type="button"
                            data-sileo-button
                            data-state={view.toastState}
                            class={view.classes?.button}
                            onfocusin={handleFocusIn}
                            onfocusout={handleFocusOut}
                            onkeydown={handleKeyDown}
                            onclick={(e) => {
                                e.stopPropagation();
                                view.button?.onClick(id);
                            }}
                        >
                            {view.button.title}
                        </button>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
{/if}
