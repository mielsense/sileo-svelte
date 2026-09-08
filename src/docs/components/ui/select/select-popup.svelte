<script
    module
    lang="ts"
>
    import type { Select as ShardsSelect } from '@shardsui/svelte/select';
    import type { ComponentProps, Snippet } from 'svelte';

    type P = ComponentProps<typeof ShardsSelect.Positioner>;
    export type SelectPopupProps = Omit<ComponentProps<typeof ShardsSelect.Popup>, 'children'> & {
        align?: P['align'];
        alignItemWithTrigger?: boolean;
        alignOffset?: P['alignOffset'];
        anchor?: P['anchor'];
        children?: Snippet;
        portalProps?: ComponentProps<typeof ShardsSelect.Portal>;
        side?: P['side'];
        sideOffset?: P['sideOffset'];
    };
</script>

<script lang="ts">
    import ChevronDownIcon from '@hugeicons/core-free-icons/ChevronDownIcon';
    import ChevronUpIcon from '@hugeicons/core-free-icons/ChevronUpIcon';
    import { Select as S } from '@shardsui/svelte/select';
    import { tick } from 'svelte';
    import HugeiconsIcon from '$docs/hugeicons-icon.svelte';
    import { cn } from '$docs/utils.js';
    import { getSelectWrapperContext } from './context.svelte.js';

    let {
        align = 'start',
        alignItemWithTrigger = true,
        alignOffset = 0,
        anchor,
        children: child,
        class: className,
        portalProps = {},
        ref = $bindable(null),
        side = 'bottom',
        sideOffset = 4,
        ...props
    }: SelectPopupProps = $props();
    const context = getSelectWrapperContext();
    let positioner = $state<HTMLElement | null>(null);
    const anchorProps = $derived(anchor === undefined ? {} : { anchor });
    let alignDelta = 0;
    let sideDelta = 0;

    function frame() {
        return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }

    function resetAlignment(pos: HTMLElement): void {
        alignDelta = 0;
        sideDelta = 0;
        pos.style.removeProperty('translate');
    }

    function selectedAlignment(trigger: HTMLElement, pos: HTMLElement): { x: number; y: number } | undefined {
        if (pos.hidden || pos.style.opacity === '0' || pos.style.transform === '') return;
        const item = pos.querySelector<HTMLElement>('[role="option"][aria-selected="true"]');
        const triggerLabel = trigger.querySelector<HTMLElement>('[data-slot="select-value"]');
        const itemLabel = item?.querySelector<HTMLElement>('.col-start-2');
        if (!item || !triggerLabel || !itemLabel) return;
        const triggerRect = trigger.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        const triggerLabelRect = triggerLabel.getBoundingClientRect();
        const itemLabelRect = itemLabel.getBoundingClientRect();
        const rtl = getComputedStyle(pos).direction === 'rtl';
        return {
            x: rtl ? triggerLabelRect.right - itemLabelRect.right : triggerLabelRect.left - itemLabelRect.left,
            y: triggerRect.top + triggerRect.height / 2 - (itemRect.top + itemRect.height / 2)
        };
    }

    async function alignSelected(cancelled: () => boolean) {
        const trigger = context.triggerRef;
        const pos = positioner;
        if (!trigger || !pos) return;

        let corrections = 0;
        for (let frameCount = 0; frameCount < 30 && corrections < 3; frameCount += 1) {
            await tick();
            await frame();
            if (cancelled()) return;
            const alignment = selectedAlignment(trigger, pos);
            if (!alignment) continue;
            const { x, y } = alignment;
            if (Math.abs(y) <= 0.5 && Math.abs(x) <= 0.5) return;
            if (Math.abs(y) > 0.5) sideDelta += y;
            if (Math.abs(x) > 0.5) alignDelta += x;
            pos.style.translate = `${alignDelta}px ${sideDelta}px`;
            corrections += 1;
        }
    }
    $effect(() => {
        const open = context.open;
        const trigger = context.triggerRef;
        const pos = positioner;
        void context.value;
        if (!open || !trigger || !pos || !alignItemWithTrigger) {
            if (pos) resetAlignment(pos);
            return;
        }
        resetAlignment(pos);
        let cancelled = false;
        void alignSelected(() => cancelled);
        return () => {
            cancelled = true;
        };
    });
</script>

<S.Portal {...portalProps}
    ><S.Positioner
        {align}
        {alignOffset}
        {...anchorProps}
        bind:ref={positioner}
        class="z-50 select-none"
        data-side={alignItemWithTrigger ? 'none' : undefined}
        data-slot="select-positioner"
        {side}
        {sideOffset}
        ><S.Popup
            bind:ref
            class="origin-(--transform-origin) text-foreground outline-none"
            data-slot="select-popup"
            {...props}
            ><S.ScrollUpArrow
                class="top-0 z-50 flex h-6 w-full cursor-default items-center justify-center before:pointer-events-none before:absolute before:inset-x-px before:top-px before:h-[200%] before:rounded-t-[calc(var(--radius-lg)-1px)] before:bg-linear-to-b before:from-50% before:from-popover"
                data-slot="select-scroll-up-arrow"
                ><HugeiconsIcon
                    aria-hidden="true"
                    class="relative size-4.5 sm:size-4"
                    icon={ChevronUpIcon}
                    strokeWidth={2}
                /></S.ScrollUpArrow
            >
            <div
                class="relative h-full min-w-(--anchor-width) rounded-lg border bg-popover not-dark:bg-clip-padding shadow-lg/5 before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] dark:before:shadow-[0_-1px_--theme(--color-white/6%)]"
            >
                <S.List
                    class={cn('max-h-(--available-height) overflow-y-auto p-1', className)}
                    data-slot="select-list">{@render child?.()}</S.List
                >
            </div>
            <S.ScrollDownArrow
                class="bottom-0 z-50 flex h-6 w-full cursor-default items-center justify-center before:pointer-events-none before:absolute before:inset-x-px before:bottom-px before:h-[200%] before:rounded-b-[calc(var(--radius-lg)-1px)] before:bg-linear-to-t before:from-50% before:from-popover"
                data-slot="select-scroll-down-arrow"
                ><HugeiconsIcon
                    aria-hidden="true"
                    class="relative size-4.5 sm:size-4"
                    icon={ChevronDownIcon}
                    strokeWidth={2}
                /></S.ScrollDownArrow
            ></S.Popup
        ></S.Positioner
    ></S.Portal
>
