<script
    module
    lang="ts"
>
    import type { Select as ShardsSelect } from '@shardsui/svelte/select';
    import type { ComponentProps } from 'svelte';
    export type SelectPartKind = 'group' | 'group-label' | 'label' | 'separator';
    export type SelectPartProps = ComponentProps<typeof ShardsSelect.Group> & {
        kind: SelectPartKind;
    };
</script>

<script lang="ts">
    import { Select as S } from '@shardsui/svelte/select';
    import { cn } from '$docs/utils.js';
    let { class: className, kind, ref = $bindable(null), ...props }: SelectPartProps = $props();
    const classes = $derived(
        cn(
            kind === 'group-label' && 'px-2 py-1.5 font-medium text-muted-foreground text-xs',
            kind === 'label' &&
                'not-in-data-[slot=field]:mb-2 inline-flex cursor-default items-center gap-2 font-medium text-base/4.5 text-foreground sm:text-sm/4',
            kind === 'separator' && 'mx-2 my-1 h-px bg-border',
            className
        )
    );
</script>

{#if kind === 'group'}
    <S.Group
        bind:ref
        data-slot="select-group"
        {...props}
    />
{:else if kind === 'group-label'}
    <S.GroupLabel
        bind:ref
        class={classes}
        data-slot="select-group-label"
        {...props}
    />
{:else if kind === 'label'}
    <S.Label
        bind:ref
        class={classes}
        data-slot="select-label"
        {...props}
    />
{:else}
    <S.Separator
        bind:ref
        class={classes}
        data-slot="select-separator"
        {...props}
    />
{/if}
