<script lang="ts">
    import { type Snippet, untrack } from 'svelte';
    import { FieldRelationshipState, setFieldRelationshipContext } from './relationship-context.svelte.js';

    let {
        children,
        defaultControlId,
        describedBy = $bindable(),
        disabled = false,
        invalid = false,
        labelId = $bindable(),
        name
    }: {
        children?: Snippet;
        defaultControlId: string;
        describedBy?: string | undefined;
        disabled?: boolean;
        invalid?: boolean;
        labelId?: string | undefined;
        name?: string | undefined;
    } = $props();
    const initialControlId = untrack(() => defaultControlId);
    let controlId = $state<string | undefined>(initialControlId);

    setFieldRelationshipContext(
        new FieldRelationshipState(
            initialControlId,
            () => controlId,
            (next) => (controlId = next),
            () => labelId,
            (next) => (labelId = next),
            () => describedBy,
            (next) => (describedBy = next),
            () => name,
            () => disabled,
            () => invalid
        )
    );
</script>

{@render children?.()}
