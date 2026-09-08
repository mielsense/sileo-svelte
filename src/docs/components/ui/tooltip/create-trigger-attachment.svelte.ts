import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import type { TooltipHandle } from './handle.svelte.js';
import type { TooltipAttachmentProviderMember } from './provider-context.svelte.js';
import { createTooltipSafePolygon, type TooltipSafePolygonSide } from './safe-polygon.js';

const DEFAULT_OPEN_DELAY = 600;

type TriggerBindings<Payload> = {
    closeDelay: number;
    closeOnClick: boolean;
    payload: Payload | undefined;
};

type TriggerMap<Payload> = {
    add(id: string, element: HTMLElement, bindings: () => TriggerBindings<Payload>): () => void;
    containsNode(target: EventTarget | null | undefined): boolean;
};

type TooltipState<Payload> = {
    activeTriggerId: string | null;
    applyTriggerBindings(bindings: TriggerBindings<Payload>): void;
    closeOnClick: boolean;
    disableHoverablePopup: boolean;
    disabled: boolean;
    isInstantPhase: boolean;
    open: boolean;
    popupElement: HTMLElement | null;
    positionerElement: HTMLElement | null;
    setCursorPosition(x: number, y: number): void;
    setOpen(open: boolean, reason?: string, event?: Event, trigger?: HTMLElement | null): boolean;
    trackCursorAxis: 'none' | 'x' | 'y' | 'both';
    triggerElement: HTMLElement | null;
    triggerElements: TriggerMap<Payload>;
};

export type TooltipTriggerAttachmentOptions<Payload = unknown> = {
    /** ID used to register the target with the Shards tooltip handle. */
    id: string;
    /** ID of the tooltip popup that describes the target. Set this in markup too for SSR. */
    ariaDescribedBy?: string;
    closeDelay?: number;
    closeOnClick?: boolean;
    delay?: number;
    disabled?: boolean;
    payload?: Payload;
};

type ManagedAttribute =
    'aria-describedby' | 'data-popup-open' | 'data-tooltip-trigger' | 'data-trigger-disabled' | 'id';

function restoreAttribute(node: HTMLElement, name: ManagedAttribute, previous: string | null): void {
    if (previous === null) node.removeAttribute(name);
    else node.setAttribute(name, previous);
}

/**
 * Applies Shards tooltip trigger behavior to an existing element without adding wrapper DOM.
 * The target stays owned by its Toolbar, Toggle, Select, or other behavioral primitive.
 *
 * This mirrors Shards Trigger registration, payload, focus, hover, cursor tracking, disabled,
 * click-dismissal, provider delay grouping, safe pointer transit, and state-attribute behavior
 * through its public handle. The local safe-polygon guard mirrors Shards behavior without importing
 * a private Shards module.
 */
export function createTriggerAttachment<Payload = unknown>(
    handle: TooltipHandle<Payload>,
    options: () => TooltipTriggerAttachmentOptions<Payload>
): Attachment<HTMLElement> {
    return (node) => {
        const state = (handle as unknown as { state: TooltipState<Payload> }).state;
        const provider = handle.attachmentProvider;
        const previous = {
            'aria-describedby': node.getAttribute('aria-describedby'),
            'data-popup-open': node.getAttribute('data-popup-open'),
            'data-tooltip-trigger': node.getAttribute('data-tooltip-trigger'),
            'data-trigger-disabled': node.getAttribute('data-trigger-disabled'),
            id: node.getAttribute('id')
        } satisfies Record<ManagedAttribute, string | null>;
        node.setAttribute('data-tooltip-trigger', '');

        let openTimer: ReturnType<typeof setTimeout> | undefined;
        let closeTimer: ReturnType<typeof setTimeout> | undefined;
        let safeTransitCleanup: (() => void) | undefined;
        let pointerType = 'mouse';
        let pointerFocus = false;
        const providerMember: TooltipAttachmentProviderMember = {
            close() {
                if (isActive()) state.setOpen(false, 'none', undefined, node);
            },
            setInstant(value) {
                state.isInstantPhase = value;
            }
        };

        const clearOpenTimer = (): void => {
            if (openTimer !== undefined) clearTimeout(openTimer);
            openTimer = undefined;
        };
        const clearCloseTimer = (): void => {
            if (closeTimer !== undefined) clearTimeout(closeTimer);
            closeTimer = undefined;
        };
        const clearSafeTransit = (): void => {
            safeTransitCleanup?.();
            safeTransitCleanup = undefined;
        };
        const current = (): Required<
            Pick<TooltipTriggerAttachmentOptions<Payload>, 'closeDelay' | 'closeOnClick' | 'delay'>
        > &
            TooltipTriggerAttachmentOptions<Payload> => ({
            closeDelay: 0,
            closeOnClick: true,
            delay: DEFAULT_OPEN_DELAY,
            ...options()
        });
        const isDisabled = (): boolean => current().disabled === true || state.disabled;
        const isActive = (): boolean => state.activeTriggerId === current().id;

        const applyBindings = (): void => {
            const value = current();
            state.applyTriggerBindings({
                closeDelay: value.closeDelay,
                closeOnClick: value.closeOnClick,
                payload: value.payload
            });
        };
        const open = (reason: 'trigger-focus' | 'trigger-hover', event: Event): void => {
            if (isDisabled()) return;
            clearCloseTimer();
            clearSafeTransit();
            applyBindings();
            state.setOpen(true, reason, event, node);
        };
        const close = (reason: 'trigger-focus' | 'trigger-hover' | 'trigger-press', event?: Event): void => {
            if (!isActive()) return;
            state.setOpen(false, reason, event, node);
        };
        const scheduleClose = (reason: 'trigger-focus' | 'trigger-hover', event?: Event): void => {
            clearCloseTimer();
            const delay = provider?.getCloseDelay(options().closeDelay) ?? current().closeDelay;
            if (delay === 0) close(reason, event);
            else closeTimer = setTimeout(() => close(reason, event), delay);
        };

        const getPopupSide = (popup: HTMLElement): TooltipSafePolygonSide => {
            const positioner = state.positionerElement ?? popup.closest<HTMLElement>('[data-side]');
            const side = positioner?.dataset.side;
            if (side === 'bottom' || side === 'left' || side === 'right' || side === 'top') return side;

            const referenceRect = node.getBoundingClientRect();
            const popupRect = popup.getBoundingClientRect();
            const horizontalDistance = Math.abs(
                popupRect.left + popupRect.width / 2 - (referenceRect.left + referenceRect.width / 2)
            );
            const verticalDistance = Math.abs(
                popupRect.top + popupRect.height / 2 - (referenceRect.top + referenceRect.height / 2)
            );
            if (horizontalDistance > verticalDistance) {
                return popupRect.left >= referenceRect.right ? 'right' : 'left';
            }
            return popupRect.top >= referenceRect.bottom ? 'bottom' : 'top';
        };

        const onFocus = (event: FocusEvent): void => {
            clearOpenTimer();
            if (pointerFocus) return;
            open('trigger-focus', event);
        };
        const onBlur = (event: FocusEvent): void => {
            clearOpenTimer();
            clearCloseTimer();
            closeTimer = setTimeout(() => {
                const active = node.ownerDocument.activeElement;
                if (node.contains(active) || state.popupElement?.contains(active)) return;
                if (node.matches(':hover')) return;
                close('trigger-focus', event);
            });
        };
        const onPointerDown = (event: PointerEvent): void => {
            pointerType = event.pointerType;
            pointerFocus = true;
            queueMicrotask(() => {
                pointerFocus = false;
            });
            clearOpenTimer();
        };
        const onPointerEnter = (event: PointerEvent): void => {
            pointerType = event.pointerType;
            if (pointerType === 'touch' || isDisabled()) return;
            clearOpenTimer();
            clearCloseTimer();
            clearSafeTransit();
            const delay = state.open ? 0 : (provider?.getOpenDelay(options().delay) ?? current().delay);
            if (delay === 0) open('trigger-hover', event);
            else openTimer = setTimeout(() => open('trigger-hover', event), delay);
        };
        const onPointerMove = (event: PointerEvent): void => {
            if (pointerType === 'touch' || state.open || state.trackCursorAxis === 'none') return;
            state.setCursorPosition(event.clientX, event.clientY);
        };
        const onPointerLeave = (event: PointerEvent): void => {
            clearOpenTimer();
            if (!isActive() || pointerType === 'touch') return;
            clearCloseTimer();
            clearSafeTransit();

            const popup = state.popupElement;
            if (popup && event.relatedTarget instanceof Node && popup.contains(event.relatedTarget)) {
                return;
            }
            if (state.disableHoverablePopup || state.trackCursorAxis === 'both' || !popup) {
                scheduleClose('trigger-hover', event);
                return;
            }

            const polygon = createTooltipSafePolygon({
                floating: popup,
                leaveX: event.clientX,
                leaveY: event.clientY,
                onClose: () => {
                    clearSafeTransit();
                    scheduleClose('trigger-hover', event);
                },
                onLanding: clearSafeTransit,
                reference: node,
                side: getPopupSide(popup)
            });
            const removePointerMove = on(node.ownerDocument, 'pointermove', polygon.pointermove, {
                capture: true
            });
            safeTransitCleanup = () => {
                removePointerMove();
                polygon.destroy();
            };
        };
        const onClick = (event: MouseEvent): void => {
            clearOpenTimer();
            const value = current();
            if (value.closeOnClick && state.open && isActive()) {
                close('trigger-press', event);
            }
        };

        const disposeEffects = $effect.root(() => {
            $effect(() => {
                const value = current();
                node.id = value.id;
                if (value.ariaDescribedBy) node.setAttribute('aria-describedby', value.ariaDescribedBy);
                else node.removeAttribute('aria-describedby');
                node.toggleAttribute('data-trigger-disabled', isDisabled());
                node.toggleAttribute('data-popup-open', state.open && state.activeTriggerId === value.id);
            });

            $effect(() => {
                const activeOpen = state.open && state.activeTriggerId === current().id;
                if (activeOpen) provider?.claim(providerMember);
                else {
                    clearSafeTransit();
                    provider?.release(providerMember);
                }
            });

            $effect(() => {
                const value = current();
                return state.triggerElements.add(value.id, node, () => ({
                    closeDelay: value.closeDelay,
                    closeOnClick: value.closeOnClick,
                    payload: value.payload
                }));
            });
        });

        const cleanups = [
            on(node, 'focus', onFocus),
            on(node, 'blur', onBlur),
            on(node, 'pointerdown', onPointerDown),
            on(node, 'pointerenter', onPointerEnter),
            on(node, 'pointermove', onPointerMove),
            on(node, 'pointerleave', onPointerLeave),
            on(node, 'click', onClick)
        ];

        return () => {
            clearOpenTimer();
            clearCloseTimer();
            clearSafeTransit();
            cleanups.forEach((cleanup) => {
                cleanup();
            });
            disposeEffects();
            provider?.remove(providerMember);
            restoreAttribute(node, 'id', previous.id);
            restoreAttribute(node, 'aria-describedby', previous['aria-describedby']);
            restoreAttribute(node, 'data-popup-open', previous['data-popup-open']);
            restoreAttribute(node, 'data-tooltip-trigger', previous['data-tooltip-trigger']);
            restoreAttribute(node, 'data-trigger-disabled', previous['data-trigger-disabled']);
        };
    };
}
