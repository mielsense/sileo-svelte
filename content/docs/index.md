---
title: Sileo Svelte
description: Animated toast notifications for Svelte 5.
label: Overview
---

Sileo Svelte displays compact notifications. When content needs more room, a toast expands in place. Loading, success, and error messages can update the same toast instead of replacing it.

This package is an unofficial Svelte port of [the original Sileo library](https://github.com/hiaaryan/sileo).

## Start here

Install with npm, pnpm, Bun, or Yarn.

```bash
npm install sileo-svelte
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

## Choose a flow

- [Creating toasts](/docs/creating-toasts): show, update, and dismiss notifications.
- [Async flows](/docs/async-flows): follow an upload or save from loading to completion.
- [Customization](/docs/customization): change colors, add frosted glass, or render Svelte snippets.

Working with a coding agent? Install the [Sileo Svelte skill](/docs/agent-skill) for the same API and styling guidance.

## Requirements

Sileo Svelte requires Svelte 5.56 or newer. Motion is included as a runtime dependency; the package has no utility CSS dependency. Import its stylesheet once, then use normal Svelte components and TypeScript.

## Try the real component

Use the [playground](/playground) to change the state, text, position, timing, and appearance. Show several toasts to test stacking, or update the last toast in place. The Code view gives you the matching Svelte component.

The Examples tab covers promises, retry actions, scoped defaults, and snippets.
