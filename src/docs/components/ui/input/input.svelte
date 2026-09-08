<script
    module
    lang="ts"
>
    import type { HTMLInputAttributes } from 'svelte/elements';

    export type InputSize = 'sm' | 'default' | 'lg' | number;

    export type InputProps = Omit<HTMLInputAttributes, 'class' | 'size'> & {
        class?: string;
        nativeInput?: boolean;
        onValueChange?: (value: string) => void;
        ref?: HTMLInputElement | null;
        size?: InputSize;
        unstyled?: boolean;
    };
</script>

<script lang="ts">
    import { Input as InputPrimitive } from '@shardsui/svelte/input';
    import { type Component, untrack } from 'svelte';
    import type { Attachment } from 'svelte/attachments';
    import { cn } from '$docs/utils.js';
    import { reconcileAriaRelationship } from '../field/reconcile-aria-relationship.js';
    import { getFieldRelationshipContext } from '../field/relationship-context.svelte.js';

    const controlClass =
        'relative inline-flex w-full rounded-lg border border-input bg-background not-dark:bg-clip-padding text-base shadow-xs/5 ring-ring/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-has-disabled:not-has-focus-visible:not-has-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] has-focus-visible:has-aria-invalid:border-destructive/64 has-focus-visible:has-aria-invalid:ring-destructive/16 has-aria-invalid:border-destructive/36 has-focus-visible:border-ring has-autofill:bg-foreground/4 has-disabled:opacity-64 has-[:disabled,:focus-visible,[aria-invalid]]:shadow-none has-focus-visible:ring-[3px] sm:text-sm dark:bg-input/32 dark:has-autofill:bg-foreground/8 dark:has-aria-invalid:ring-destructive/24 dark:not-has-disabled:not-has-focus-visible:not-has-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/6%)]';

    const inputClass =
        'h-8.5 w-full min-w-0 rounded-[inherit] px-[calc(--spacing(3)-1px)] text-foreground leading-8.5 outline-none [transition:background-color_5000000s_ease-in-out_0s] placeholder:text-muted-foreground/72 sm:h-7.5 sm:leading-7.5 autofill:[-webkit-text-fill-color:var(--foreground)]';

    const InputControl = InputPrimitive as unknown as Component<InputProps, object, 'ref' | 'value'>;

    const uid = $props.id();
    const relationships = getFieldRelationshipContext();

    let {
        'aria-describedby': ariaDescribedBy,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledBy,
        class: className,
        defaultValue,
        id = relationships?.resolveDefaultControlId(uid) ?? uid,
        nativeInput = false,
        ref = $bindable(null),
        size = 'default',
        type,
        unstyled = false,
        value = $bindable(),
        ...props
    }: InputProps = $props();
    untrack(() => {
        if (value === undefined && defaultValue !== undefined && type !== 'file') {
            value = defaultValue;
        }
        if (id) relationships?.registerInitialControlId(id);
    });
    $effect(() => {
        const nextId = id;
        return untrack(() => (nextId ? relationships?.registerControlId(nextId) : undefined));
    });

    const classes = $derived(cn(!unstyled && controlClass, className) || undefined);
    const describedBy = $derived(
        ariaDescribedBy === null ? null : mergeAriaIds(ariaDescribedBy, relationships?.describedBy)
    );
    const labelledBy = $derived(
        ariaLabelledBy !== undefined ? ariaLabelledBy : ariaLabel === undefined ? relationships?.labelledBy : undefined
    );
    const nativeRelationshipProps = $derived.by(() => {
        const attributes: Pick<HTMLInputAttributes, 'aria-describedby' | 'aria-labelledby'> = {};
        if (describedBy !== undefined) attributes['aria-describedby'] = describedBy;
        if (labelledBy !== undefined) attributes['aria-labelledby'] = labelledBy;
        return attributes;
    });
    const shardsRelationshipProps = $derived.by(() => {
        const attributes: Pick<HTMLInputAttributes, 'aria-describedby' | 'aria-labelledby'> & {
            'ARIA-DESCRIBEDBY'?: null;
        } = {};
        if (describedBy === null) attributes['ARIA-DESCRIBEDBY'] = null;
        else if (describedBy !== undefined) attributes['aria-describedby'] = describedBy;
        if (labelledBy !== undefined) attributes['aria-labelledby'] = labelledBy;
        return attributes;
    });
    const nativeSize = $derived(typeof size === 'number' ? size : undefined);
    const nativeSizeProps = $derived(nativeSize === undefined ? {} : { size: nativeSize });
    const innerClasses = $derived(
        cn(
            inputClass,
            size === 'sm' && 'h-7.5 px-[calc(--spacing(2.5)-1px)] leading-7.5 sm:h-6.5 sm:leading-6.5',
            size === 'lg' && 'h-9.5 leading-9.5 sm:h-8.5 sm:leading-8.5',
            type === 'search' &&
                '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none',
            type === 'file' &&
                'text-muted-foreground file:me-3 file:bg-transparent file:font-medium file:text-foreground file:text-sm'
        )
    );

    function mergeAriaIds(...values: (string | null | undefined)[]): string | undefined {
        const ids = [...new Set(values.flatMap((value) => value?.split(/\s+/).filter(Boolean) ?? []))];
        return ids.join(' ') || undefined;
    }

    const reflectInitialDefaultValue: Attachment<HTMLInputElement> = (node) => {
        untrack(() => {
            if (defaultValue !== undefined && type !== 'file') {
                node.defaultValue = String(value ?? defaultValue);
            }
        });
    };
</script>

<span
    data-size={size}
    data-slot="input-control"
    class={classes}
>
    {#if nativeInput}
        {#if type === 'file'}
            <input
                {@attach reflectInitialDefaultValue}
                bind:this={ref}
                aria-label={ariaLabel}
                {id}
                {type}
                size={nativeSize}
                data-slot="input"
                class={innerClasses}
                {...nativeRelationshipProps}
                {...props}
            />
        {:else}
            <input
                {@attach reflectInitialDefaultValue}
                bind:this={ref}
                bind:value
                aria-label={ariaLabel}
                {id}
                {type}
                size={nativeSize}
                data-slot="input"
                class={innerClasses}
                {...nativeRelationshipProps}
                {...props}
            />
        {/if}
    {:else}
        <InputControl
            {@attach reconcileAriaRelationship('aria-describedby', describedBy)}
            {@attach reflectInitialDefaultValue}
            bind:ref
            bind:value
            aria-label={ariaLabel}
            {id}
            {type}
            {...nativeSizeProps}
            data-slot="input"
            class={innerClasses}
            {...shardsRelationshipProps}
            {...props}
        />
    {/if}
</span>
