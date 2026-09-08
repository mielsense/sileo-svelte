---
title: Installation
description: Add the package, import its styles, and mount one toaster for the application.
label: Installation
---

## Install the package

Use the package manager already used by your project. Sileo Svelte requires Svelte 5.56 or newer. The Motion runtime is installed with the package.

```bash
npm install sileo-svelte
```

## Mount the toaster

Import the stylesheet once. In SvelteKit, the root layout is a good place for both imports.

```svelte
<script lang="ts">
    import { Toaster } from 'sileo-svelte';
    import 'sileo-svelte/styles.css';

    let { children } = $props();
</script>

{@render children()}
<Toaster position="top-right" />
```

`Toaster` also renders an optional `children` snippet. You can wrap the app instead if that fits your layout.

```svelte
<Toaster position="bottom-center">
    {@render children()}
</Toaster>
```

Mount one toaster. Multiple instances share the store and render duplicate notifications.

## Set application defaults

The `options` prop applies defaults to every toast. Individual calls can override them.

```svelte
<Toaster
    position="top-right"
    offset={{ top: 20, right: 20 }}
    options={{
        duration: 5000,
        roundness: 10,
        autopilot: true
    }}
/>
```

`offset` accepts one number, one CSS length, or an object with `top`, `right`, `bottom`, and `left` values.

## Server rendering

Mount the component in a normal Svelte layout. Call `sileo` in browser interactions such as button handlers, form results, or client-side tasks. Server-side notification calls do not enqueue toasts or transfer messages to the browser.

## Confirm the setup

Add a temporary button and click it in the browser.

```svelte
<script>
    import { sileo } from 'sileo-svelte';
</script>

<button onclick={() => sileo.info({ title: 'Toaster connected' })}> Test notification </button>
```

If nothing appears, check that the stylesheet import reaches the browser and that the toaster is mounted once.
