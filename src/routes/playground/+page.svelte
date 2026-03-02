<script lang="ts">
    import { resolve } from '$app/paths';
    import { goto } from '$app/navigation';
    $effect(() => {
        goto(resolve('/play'), { replaceState: true });
    });
</script>
