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

Use `fill` for the toast background and `roundness` to change the corners.

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

## Frosted glass

Use a translucent `fill` with `styles.backdropFilter`. Sileo blurs the page behind the toast and clips the result to its animated shape. The title, icon, and description stay sharp.

```ts
sileo.success({
    title: 'Saved',
    description: 'Your changes are ready.',
    fill: 'rgba(24, 24, 27, 0.55)',
    styles: {
        backdropFilter: 'blur(16px) saturate(1.4)',
        titleColor: '#ffffff',
        descriptionColor: '#f4f4f5'
    }
});
```

An opaque fill hides the blur. A flat background also gives the filter little to blur. Test your toast over the images, text, and colors in your app, then check that the text remains readable.

The browser must support CSS `backdrop-filter` and SVG masks. Without backdrop filtering, the translucent fill still appears. Ancestors with `filter`, masks, or opacity below `1` can limit which content the browser blurs. Mount `Toaster` near the application root, outside those containers.

## Styling the whole toast

`classes.toast` targets the outer toast. `classes.background` targets the SVG background, or the masked HTML background when `backdropFilter` is set. Import your styles after `sileo-svelte/styles.css`.

```ts
sileo.info({
    title: 'New comment',
    classes: { toast: 'comment-toast' }
});
```

```css
/* Use global CSS. Toaster renders outside the component that calls sileo. */
.comment-toast {
    --sileo-width: 400px;
    --sileo-title-color: #e0e7ff;
    --sileo-description-color: #f5f3ff;
}
```

Sileo animates the toast's height, opacity, and transform. Keep those properties available to the animation. Set width with `--sileo-width` so measurements and the background stay aligned.

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

Use `button` for a single action. Description snippets can also contain links, buttons, and inputs. The toast header enters the tab order when a description is a snippet. Focus opens the content and pauses expiry. Escape returns focus to the header and collapses the toast.
