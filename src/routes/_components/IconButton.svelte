<script lang="ts">
    import { Button, type ButtonProps } from '$docs/components/ui/button/index.js';
    import * as Tooltip from '$docs/components/ui/tooltip/index.js';

    let { tooltip, children, size = 'icon', ...props }: ButtonProps & { tooltip: string } = $props();
    const id = $props.id();
    const handle = new Tooltip.Handle();
    const trigger = Tooltip.createTriggerAttachment(handle, () => ({ id, ariaDescribedBy: `${id}-hint`, delay: 350 }));
</script>

<Tooltip.Root {handle}>
    <Button
        {id}
        {size}
        {...props}
        {@attach trigger}>{@render children?.()}</Button
    >
    <Tooltip.Popup
        id={`${id}-hint`}
        sideOffset={8}>{tooltip}</Tooltip.Popup
    >
</Tooltip.Root>
