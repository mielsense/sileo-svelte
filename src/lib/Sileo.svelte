<script lang="ts">
    import { untrack, type Snippet } from 'svelte';
    import type { SileoButton, SileoClasses, SileoState, SileoStyles } from './types.js';
    import { measuredExpandedHeight, resolveToastGeometry } from './geometry.js';
    import { ToastMeasurements } from './measurements.svelte.js';
    import { createToastMotion } from './toast-motion.svelte.js';
    import StateIcon from './StateIcon.svelte';

    /* --------------------------------- Config --------------------------------- */

    const HEIGHT = 40;
    const DEFAULT_ROUNDNESS = 18;
    const BLUR_RATIO = 0.5;
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
    const measurements = new ToastMeasurements();

    /* ---------------------------------- Refs ---------------------------------- */

    let buttonEl: HTMLDivElement | undefined = $state();
    let headerEl: HTMLElement | undefined = $state();

    let autoExpandTimer: number | null = null;
    let autoCollapseTimer: number | null = null;
    let lastRefreshKey: string | undefined = undefined;
    let pending = $state<{ key?: string; payload: View } | null>(null);
    let pointerStart: number | null = null;
    let pointerMaxDelta = 0;
    let pointerStartedOpen: boolean | null = null;
    let suppressClick = false;
    let frozenExpanded = $state(HEIGHT * 2.25);

    let headerLayer: HeaderLayer = $state(undefined as unknown as HeaderLayer);
    let pillEl: SVGRectElement | undefined = $state();
    let bodyEl: SVGRectElement | undefined = $state();
    let contentRootEl: HTMLDivElement | undefined = $state();

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

            if (currentOpen) {
                pending = { key: currentRefreshKey, payload: currentNext };
                isExpanded = false;
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

    const rawExpanded = $derived(measuredExpandedHeight(measurements.baseHeight, measurements.contentHeight, hasDesc));

    $effect(() => {
        if (open) {
            frozenExpanded = rawExpanded;
        }
    });

    const expanded = $derived(open ? rawExpanded : frozenExpanded);
    const geometry = $derived(
        resolveToastGeometry({
            alignment: position,
            baseHeight: measurements.baseHeight,
            blur,
            canvasWidth: measurements.canvasWidth,
            expandedHeight: expanded,
            hasDescription: hasDesc,
            open,
            pillWidth: measurements.pillWidth
        })
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
        `--_base-h:${measurements.baseHeight}px;` +
            `--_h:${geometry.rootHeight}px;` +
            `--_pill-x:${geometry.pillX}px;` +
            `--_pill-width:${geometry.pillWidth}px;` +
            (skinVars ? `;${skinVars}` : '')
    );

    function commitPending(expectedKey?: string) {
        const nextPending = pending;
        if (!nextPending || nextPending.key !== expectedKey || open) return;

        view = nextPending.payload;
        applied = nextPending.key;
        pending = null;
    }

    const motion = createToastMotion({
        elements: () => ({
            root: buttonEl,
            pill: pillEl,
            body: bodyEl,
            header: headerEl,
            content: contentRootEl
        }),
        geometry: () => geometry,
        open: () => open,
        exiting: () => exiting,
        edge: () => expand,
        baseHeight: () => measurements.baseHeight,
        pendingKey: () => pending?.key,
        hasPending: () => pending !== null,
        commitPending,
        headerKeys: () => ({ current: headerLayer.current.key, previous: headerLayer.prev?.key }),
        clearPreviousHeader: (previous, current) => {
            if (headerLayer.prev?.key === previous && headerLayer.current.key === current) {
                headerLayer = { ...headerLayer, prev: null };
            }
        }
    });

    /* -------------------------------- Handlers -------------------------------- */

    function canHover() {
        return window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? true;
    }

    function handleEnter(e: MouseEvent) {
        if (!canHover()) return;
        onmouseenter?.(e);
        if (hasDesc) isExpanded = true;
    }

    function handleLeave(e: MouseEvent) {
        if (!canHover()) return;
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

    function swipeGesture(el: HTMLDivElement) {
        const onMove = (e: PointerEvent) => {
            if (pointerStart === null) return;
            const dy = e.clientY - pointerStart;
            pointerMaxDelta = Math.max(pointerMaxDelta, Math.abs(dy));
            if (pointerMaxDelta > 5) suppressClick = true;
            const sign = dy > 0 ? 1 : -1;
            const clamped = Math.min(Math.abs(dy), SWIPE_MAX) * sign;
            motion.moveForSwipe(el, clamped);
        };

        const onUp = (e: PointerEvent) => {
            if (pointerStart === null) return;
            const dy = e.clientY - pointerStart;
            pointerStart = null;
            suppressClick = pointerMaxDelta > 5;
            pointerMaxDelta = 0;
            if (Math.abs(dy) > SWIPE_DISMISS) {
                onDismiss?.();
            } else {
                motion.resetSwipe(el);
            }
        };

        const onCancel = () => {
            pointerStart = null;
            pointerMaxDelta = 0;
            pointerStartedOpen = null;
            suppressClick = false;
            motion.resetSwipe(el);
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
            motion.stopSwipe();
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerup', onUp);
            el.removeEventListener('pointercancel', onCancel);
            el.removeEventListener('lostpointercapture', onLostCapture);
            el.removeEventListener('click', onCapturedClick);
        };
    }

    /* ---------------------------------- Icons --------------------------------- */

    function isSnippet(val: unknown): val is Snippet {
        return typeof val === 'function';
    }
</script>

{#if view}
    {#snippet headerLayers()}
        <div data-sileo-header-stack>
            {#key headerLayer.current.key}
                <div
                    {@attach measurements.measureTitle}
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
                                <StateIcon state={headerLayer.current.view.toastState} />
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
                                <StateIcon state={headerLayer.prev.view.toastState} />
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
        {@attach motion.attachToast}
        {@attach swipeGesture}
        {@attach measurements.measureToast}
        bind:this={buttonEl}
        role="group"
        data-sileo-toast
        data-ready={motion.ready}
        data-expanded={open}
        data-exiting={exiting}
        data-edge={expand}
        data-position={position}
        data-state={view.toastState}
        class={className}
        style={rootStyle}
        onmouseenter={handleEnter}
        onmouseleave={handleLeave}
        onpointerdown={handlePointerDown}
    >
        <div
            data-sileo-canvas
            data-edge={expand}
        >
            <svg
                data-sileo-svg
                width={measurements.canvasWidth}
                height={geometry.canvasHeight}
                viewBox={`0 0 ${measurements.canvasWidth} ${geometry.canvasHeight}`}
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
                        bind:this={pillEl}
                        data-sileo-pill
                        x={geometry.pillX}
                        width={geometry.pillWidth}
                        height={geometry.pillHeight}
                        rx={resolvedRoundness}
                        ry={resolvedRoundness}
                        fill={view.fill}
                    />
                    <rect
                        bind:this={bodyEl}
                        data-sileo-body
                        y={measurements.baseHeight}
                        width={measurements.canvasWidth}
                        height={geometry.bodyHeight}
                        rx={resolvedRoundness}
                        ry={resolvedRoundness}
                        fill={view.fill}
                    />
                </g>
            </svg>
        </div>

        {#if hasDesc && !isLoading}
            <button
                {@attach measurements.measureHeader}
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
                {@attach measurements.measureHeader}
                bind:this={headerEl}
                data-sileo-header
                data-edge={expand}
            >
                {@render headerLayers()}
            </div>
        {/if}

        {#if hasDesc}
            <div
                bind:this={contentRootEl}
                id={contentId}
                data-sileo-content
                data-edge={expand}
                data-visible={open}
            >
                <div
                    {@attach measurements.measureContent}
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
