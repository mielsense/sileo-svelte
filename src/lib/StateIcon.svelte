<script lang="ts">
    import type { SileoState } from './types.js';
    import Check from './icons/Check.svelte';
    import LoaderCircle from './icons/LoaderCircle.svelte';
    import X from './icons/X.svelte';
    import CircleAlert from './icons/CircleAlert.svelte';
    import LifeBuoy from './icons/LifeBuoy.svelte';
    import ArrowRight from './icons/ArrowRight.svelte';

    let { state }: { state: SileoState } = $props();

    const icons = {
        success: Check,
        loading: LoaderCircle,
        error: X,
        warning: CircleAlert,
        info: LifeBuoy,
        action: ArrowRight
    } as const;
    const Icon = $derived(icons[state]);
</script>

<Icon />
