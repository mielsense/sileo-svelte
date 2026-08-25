---
title: Sileo Svelte
description: Physics-based toast notifications for Svelte 5, with typed helpers, promise states, actions, and rich snippets.
label: Overview
---

Sileo Svelte displays compact notifications. When content needs more room, a toast expands in place. Loading, success, and error messages can update the same toast instead of replacing it.

This package is an unofficial Svelte port of [the original Sileo library](https://github.com/hiaaryan/sileo).

## Start here

Install the package and its stylesheet.

```bash
bun add sileo-svelte
```

Mount one toaster near the root of your app.

```svelte
<script lang="ts">
    import { Toaster } from 'sileo-svelte';
    import 'sileo-svelte/styles.css';
</script>

<Toaster position="top-right" />
```

Call `sileo` from any client-side component.

```svelte
<script lang="ts">
    import { sileo } from 'sileo-svelte';

    function save() {
        sileo.success({
            title: 'Release saved',
            description: 'Draft v2.4 is ready for review.'
        });
    }
</script>

<button onclick={save}>Save release</button>
```

## What ships

- Six semantic states plus a neutral `show` helper.
- Updates that keep the same toast id.
- Promise flows with typed success data.
- Action buttons and persistent notifications.
- Svelte snippets for descriptions and icons.
- Per-toast classes, colors, and timing.

## Requirements

Sileo Svelte requires Svelte 5. The package has no utility CSS dependency. Import its stylesheet once, then use normal Svelte components and TypeScript.

## Try the real component

The [playground](/playground) runs every documented scenario against the package itself. Change the viewport position, run a flow, and copy the exact source beside it.

## Next step

Read [Installation](/docs/installation) for the full root layout setup and default options.
