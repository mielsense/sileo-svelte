<script
    module
    lang="ts"
>
    import type { Select as ShardsSelect } from '@shardsui/svelte/select';
    import type { ComponentProps, Snippet } from 'svelte';

    type BaseProps = Omit<ComponentProps<typeof ShardsSelect.Value>, 'children' | 'placeholder'>;
    export type SelectValueProps<Value = unknown, Multiple extends boolean | undefined = false> = BaseProps & {
        children?: Snippet<[Multiple extends true ? Value[] : Value | null]>;
        placeholder?: string;
    };
</script>

<script
    lang="ts"
    generics="Value = unknown, Multiple extends boolean | undefined = false"
>
    import { Select as S } from '@shardsui/svelte/select';
    import { cn } from '$docs/utils.js';

    let {
        children: child,
        class: className,
        placeholder,
        ref = $bindable(null),
        ...props
    }: SelectValueProps<Value, Multiple> = $props();
</script>

{#if child}
    <S.Value
        bind:ref
        class={cn('flex-1 truncate data-placeholder:text-muted-foreground', className)}
        data-slot="select-value"
        {...placeholder === undefined ? {} : { placeholder }}
        {...props}
    >
        {#snippet children(value: unknown)}
            {@render child(value as Multiple extends true ? Value[] : Value | null)}
        {/snippet}
    </S.Value>
{:else}
    <S.Value
        bind:ref
        class={cn('flex-1 truncate data-placeholder:text-muted-foreground', className)}
        data-slot="select-value"
        {...placeholder === undefined ? {} : { placeholder }}
        {...props}
    />
{/if}
