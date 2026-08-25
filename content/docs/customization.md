---
title: Customization
description: Change placement, timing, color, classes, and rich content without replacing the package CSS.
label: Customization
---

## Position

Set a default on `Toaster`, then override it on individual calls when needed.

```svelte
<Toaster position="top-right" />
```

```ts
sileo.info({
    title: 'Download started',
    position: 'bottom-center'
});
```

Supported positions are `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, and `bottom-right`.

## Color and shape

Use `fill` for the toast background and `roundness` for its corner model.

```ts
sileo.action({
    title: 'Custom surface',
    fill: '#1f1f1f',
    roundness: 8,
    button: {
        title: 'Close',
        onClick: (id) => sileo.close(id)
    }
});
```

Keep enough contrast between the fill, text, badge, and button colors. Test both collapsed and expanded states.

## Motion timing

Set `--sileo-duration` to change the toast's visual motion. The default is `600ms`.

```css
:root {
    --sileo-duration: 500ms;
}
```

Sileo reads this value when a toast mounts and uses it for its Motion spring and state transitions. People who prefer reduced motion get immediate layout and opacity changes with no transform-heavy entrance or loader motion.

## Typed style slots

The `styles` object changes supported visual values on one toast.

```ts
sileo.success({
    title: 'Theme updated',
    styles: {
        titleColor: '#ffffff',
        descriptionColor: '#d4d4d4',
        buttonColor: '#000000',
        buttonBackground: '#ffffff'
    }
});
```

Use `classes` when the application already has a class-based styling system.

```ts
sileo.info({
    title: 'New comment',
    classes: {
        title: 'notification-title',
        description: 'notification-description',
        button: 'notification-action'
    }
});
```

## Rich descriptions and icons

Sileo accepts Svelte snippets for `description` and `icon`.

```svelte
<script lang="ts">
    import { sileo } from 'sileo-svelte';

    function showRelease() {
        sileo.info({
            title: 'Release details',
            description: releaseDetails,
            icon: releaseIcon
        });
    }
</script>

{#snippet releaseDetails()}
    <div>
        <strong>Release v2.4</strong>
        <span>Six regions are healthy.</span>
    </div>
{/snippet}

{#snippet releaseIcon()}
    <span aria-hidden="true">R</span>
{/snippet}

<button onclick={showRelease}>Show release</button>
```

Keep interactive controls in the toast button. Description snippets should explain the state, not contain another focus path.
