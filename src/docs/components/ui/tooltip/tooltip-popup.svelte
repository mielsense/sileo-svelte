<script
    module
    lang="ts"
>
    import type { Tooltip as ShardsTooltip } from '@shardsui/svelte/tooltip';
    import type { ComponentProps, Snippet } from 'svelte';

    type PopupProps = ComponentProps<typeof ShardsTooltip.Popup>;
    type PositionerProps = ComponentProps<typeof ShardsTooltip.Positioner>;
    export type TooltipPortalProps = ComponentProps<typeof ShardsTooltip.Portal>;
    export type TooltipPopupProps = Omit<PopupProps, 'children'> & {
        align?: PositionerProps['align'];
        anchor?: PositionerProps['anchor'];
        children?: Snippet;
        portalProps?: TooltipPortalProps;
        side?: PositionerProps['side'];
        sideOffset?: PositionerProps['sideOffset'];
    };
</script>

<script lang="ts">
    import { Tooltip as TooltipPrimitive } from '@shardsui/svelte/tooltip';
    import { cn } from '$docs/utils.js';
    import { getTooltipHandleContext } from './context.js';

    const uid = $props.id();
    let {
        align = 'center',
        anchor,
        children: child,
        class: className,
        id = uid,
        portalProps,
        ref = $bindable(null),
        side = 'top',
        sideOffset = 4,
        ...props
    }: TooltipPopupProps = $props();
    const handle = getTooltipHandleContext();
    let positionTransitionsEnabled = $state(false);
    $effect.pre(() => {
        handle.popupId = id;
        return () => {
            if (handle.popupId === id) handle.popupId = undefined;
        };
    });
    $effect(() => {
        const popup = ref;
        if (!popup) {
            positionTransitionsEnabled = false;
            return;
        }

        let frame = 0;
        const cancelFrame = () => cancelAnimationFrame(frame);
        const syncTransitionState = () => {
            cancelFrame();
            if (popup.hasAttribute('data-ending-style')) return;
            if (!popup.hasAttribute('data-open') || popup.hasAttribute('data-starting-style')) {
                positionTransitionsEnabled = false;
                return;
            }

            const positioner = popup.parentElement;
            if (!positioner) return;
            let previousPosition = '';
            let stableFrames = 0;
            const waitForStablePosition = () => {
                if (
                    !popup.hasAttribute('data-open') ||
                    popup.hasAttribute('data-starting-style') ||
                    popup.hasAttribute('data-ending-style')
                ) {
                    syncTransitionState();
                    return;
                }

                const bounds = positioner.getBoundingClientRect();
                const position = `${bounds.x}:${bounds.y}`;
                stableFrames = position === previousPosition ? stableFrames + 1 : 0;
                previousPosition = position;
                if (stableFrames >= 2) {
                    positionTransitionsEnabled = true;
                    return;
                }
                frame = requestAnimationFrame(waitForStablePosition);
            };
            frame = requestAnimationFrame(waitForStablePosition);
        };
        const observer = new MutationObserver(syncTransitionState);
        observer.observe(popup, {
            attributeFilter: ['data-open', 'data-starting-style', 'data-ending-style'],
            attributes: true
        });
        syncTransitionState();

        return () => {
            cancelFrame();
            observer.disconnect();
        };
    });
    const positionerProps = $derived({
        align,
        ...(anchor === undefined ? {} : { anchor }),
        side,
        sideOffset
    });
</script>

<TooltipPrimitive.Portal {...portalProps}>
    <TooltipPrimitive.Positioner
        class={cn(
            'z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom,transform] data-instant:transition-none',
            !positionTransitionsEnabled && 'invisible transition-none'
        )}
        data-slot="tooltip-positioner"
        {...positionerProps}
    >
        <TooltipPrimitive.Popup
            bind:ref
            class={cn(
                'relative flex h-(--popup-height,auto) min-w-[calc(var(--positioner-width)+3px)] w-(--popup-width,auto) origin-(--transform-origin) text-balance rounded-md border bg-popover not-dark:bg-clip-padding text-popover-foreground text-xs shadow-md/5 transition-[width,height,scale,opacity] before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-md)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] data-ending-style:scale-98 data-starting-style:scale-98 data-ending-style:opacity-0 data-starting-style:opacity-0 data-instant:duration-0 dark:before:shadow-[0_-1px_--theme(--color-white/6%)]',
                className
            )}
            data-slot="tooltip-popup"
            {id}
            role="tooltip"
            {...props}
        >
            <TooltipPrimitive.Viewport
                class="relative size-full overflow-clip px-(--viewport-inline-padding) py-1 [--viewport-inline-padding:--spacing(2)] data-instant:transition-none **:data-current:data-ending-style:opacity-0 **:data-current:data-starting-style:opacity-0 **:data-previous:data-ending-style:opacity-0 **:data-previous:data-starting-style:opacity-0 **:data-current:w-[calc(var(--popup-width)-2*var(--viewport-inline-padding)-2px)] **:data-previous:w-[calc(var(--popup-width)-2*var(--viewport-inline-padding)-2px)] **:data-previous:truncate **:data-current:opacity-100 **:data-previous:opacity-100 **:data-current:transition-opacity **:data-previous:transition-opacity"
                data-slot="tooltip-viewport"
            >
                {@render child?.()}
            </TooltipPrimitive.Viewport>
        </TooltipPrimitive.Popup>
    </TooltipPrimitive.Positioner>
</TooltipPrimitive.Portal>
