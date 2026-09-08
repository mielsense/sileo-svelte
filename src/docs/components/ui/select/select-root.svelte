<script
    module
    lang="ts"
>
    import type { Select as ShardsSelect } from '@shardsui/svelte/select';
    import type { ComponentProps } from 'svelte';
    import type { SelectionChangeEventDetails, SelectionChangeEventReason } from '$docs/change-event-details.js';

    type Base = ComponentProps<typeof ShardsSelect.Root>;
    export type SelectChangeEventReason = SelectionChangeEventReason;
    export type SelectChangeEventDetails = SelectionChangeEventDetails;
    export type SelectValue<Value, Multiple extends boolean | undefined> = Multiple extends true
        ? Value[]
        : Value | null;

    export type SelectRootProps<Value = unknown, Multiple extends boolean | undefined = false> = Omit<
        Base,
        | 'defaultOpen'
        | 'defaultValue'
        | 'isItemEqualToValue'
        | 'items'
        | 'itemToStringLabel'
        | 'itemToStringValue'
        | 'multiple'
        | 'onOpenChange'
        | 'onValueChange'
        | 'open'
        | 'value'
    > & {
        'aria-label'?: string;
        defaultOpen?: boolean;
        defaultValue?: SelectValue<Value, Multiple>;
        isItemEqualToValue?: ((item: Value, value: Value) => boolean) | undefined;
        items?:
            | readonly NoInfer<Value>[]
            | ReadonlyArray<{ label: unknown; value: NoInfer<Value> }>
            | readonly { items: readonly { label: unknown; value: NoInfer<Value> }[] }[]
            | Record<string, unknown>
            | undefined;
        itemToStringLabel?: ((item: Value) => string) | undefined;
        itemToStringValue?: ((item: Value) => string) | undefined;
        multiple?: Multiple | undefined;
        onOpenChange?: (open: boolean, eventDetails: SelectChangeEventDetails) => void;
        onValueChange?: (value: SelectValue<Value, Multiple>, eventDetails: SelectChangeEventDetails) => void;
        open?: boolean | undefined;
        value?: SelectValue<Value, Multiple> | undefined;
    };
</script>

<script
    lang="ts"
    generics="Value = unknown, Multiple extends boolean | undefined = false"
>
    import { Select as SelectPrimitive } from '@shardsui/svelte/select';
    import type { Component } from 'svelte';
    import { untrack } from 'svelte';
    import {
        areSelectionValuesEqual,
        canonicalizeSelectionValue,
        createSelectionChangeContext,
        setSelectionChangeContext
    } from '$docs/selection-change-context.js';
    import { setSelectWrapperContext, type SelectWrapperContext } from './context.svelte.js';

    let {
        'aria-label': ariaLabel,
        children,
        defaultOpen = false,
        defaultValue,
        isItemEqualToValue,
        items,
        itemToStringLabel,
        itemToStringValue,
        multiple = false as Multiple,
        onOpenChange,
        onValueChange,
        open = $bindable(),
        value = $bindable(),
        value: suppliedValue,
        ...props
    }: SelectRootProps<Value, Multiple> = $props();

    const valueControlled = untrack(() => value !== undefined);
    const openControlled = untrack(() => open !== undefined);
    const initialValue = untrack(() => defaultValue ?? ((multiple ? [] : null) as SelectValue<Value, Multiple>));
    let internalValue = $state.raw<SelectValue<Value, Multiple>>(initialValue);
    let internalOpen = $state(untrack(() => defaultOpen));
    let pendingValue: { canceled: boolean; value: SelectValue<Value, Multiple> } | undefined;
    let pendingOpen: { canceled: boolean; value: boolean } | undefined;
    // Read the parent value separately: local bindable writes proxy uncontrolled objects.
    const currentValue = $derived(
        valueControlled && value !== undefined ? value : suppliedValue !== undefined ? suppliedValue : internalValue
    );
    const currentOpen = $derived(open !== undefined ? open : internalOpen);
    const change = createSelectionChangeContext();
    setSelectionChangeContext(change);

    const context: SelectWrapperContext = $state({
        get ariaLabel() {
            return ariaLabel;
        },
        get open() {
            return currentOpen;
        },
        get value() {
            return currentValue;
        },
        triggerRef: null
    });
    setSelectWrapperContext(context);
    const SelectRoot = SelectPrimitive.Root as unknown as Component<
        SelectRootProps<Value, Multiple>,
        object,
        'open' | 'value'
    >;

    function getValue(): SelectValue<Value, Multiple> {
        return currentValue;
    }

    function canonicalize(next: SelectValue<Value, Multiple>): SelectValue<Value, Multiple> {
        if (multiple) {
            return (next as Value[]).map((item) =>
                canonicalizeSelectionValue(item, items, isItemEqualToValue)
            ) as SelectValue<Value, Multiple>;
        }
        return next === null
            ? next
            : (canonicalizeSelectionValue(next as Value, items, isItemEqualToValue) as SelectValue<Value, Multiple>);
    }

    function setValue(next: SelectValue<Value, Multiple>): void {
        const canonicalValue = canonicalize(next);
        if (pendingValue && areSelectionValuesEqual(pendingValue.value, canonicalValue)) {
            const { canceled } = pendingValue;
            pendingValue = undefined;
            if (canceled) return;
        }
        if (!valueControlled) internalValue = canonicalValue;
        value = canonicalValue;
    }

    function handleValueChange(next: SelectValue<Value, Multiple>): void {
        const canonicalValue = canonicalize(next);
        const details = change.details();
        onValueChange?.(canonicalValue, details);
        pendingValue = { canceled: details.isCanceled, value: canonicalValue };
    }

    function getOpen(): boolean {
        return currentOpen;
    }

    function setOpen(next: boolean): void {
        if (pendingOpen?.value === next) {
            const { canceled } = pendingOpen;
            pendingOpen = undefined;
            if (canceled) return;
        }
        if (!openControlled) internalOpen = next;
        open = next;
    }

    function handleOpenChange(next: boolean): void {
        const details = change.details();
        onOpenChange?.(next, details);
        pendingOpen = { canceled: details.isCanceled, value: next };
    }
</script>

<SelectRoot
    bind:open={getOpen, setOpen}
    bind:value={getValue, setValue}
    {isItemEqualToValue}
    {items}
    {itemToStringLabel}
    {itemToStringValue}
    {multiple}
    onOpenChange={handleOpenChange}
    onValueChange={handleValueChange}
    {...props}>{@render children?.()}</SelectRoot
>
