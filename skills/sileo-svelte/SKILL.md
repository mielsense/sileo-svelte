---
name: sileo-svelte
description: Install, use, customize, or debug sileo-svelte toast notifications in Svelte 5. Covers Toaster setup, toast IDs and updates, promise flows, actions, snippets, CSS styling, and frosted glass. Use the Svelte port API rather than the original React library.
---

# Sileo for Svelte

Use this skill for `sileo-svelte` at https://github.com/mielsense/sileo-svelte.

## Check the installed contract

Inspect the consumer's installed package version and Svelte peer requirement before changing code. This skill describes the 0.2 API, which requires Svelte 5.56 or newer. Repository docs can describe changes that are not on npm yet. Check the installed declarations before using a newer option; do not assume an upgrade has happened.

Read the page relevant to the task:

- Installation: https://sileo.miel.my/docs/installation.md
- Public API: https://sileo.miel.my/docs/api.md
- Promise flows: https://sileo.miel.my/docs/async-flows.md
- Styles and glass: https://sileo.miel.my/docs/customization.md
- Toaster: https://sileo.miel.my/docs/toaster.md
- Documentation index: https://sileo.miel.my/llms.txt

Use the [playground](https://sileo.miel.my/playground) to check appearance and interactions, and read the [changelog](https://sileo.miel.my/docs/changelog.md) before recommending an upgrade.

Use the package's public exports. Do not import its internal store, `Sileo.svelte`, or motion helpers into a consumer app.

## Mount once

Install `sileo-svelte` using the project's package manager. Import `sileo-svelte/styles.css` once and mount one `Toaster` in the application's root layout. Sileo needs neither Tailwind nor a component registry.

```svelte
<script lang="ts">
    import { Toaster } from 'sileo-svelte';
    import 'sileo-svelte/styles.css';
    let { children } = $props();
</script>

{@render children()}
<Toaster position="top-right" />
```

Use `Toaster.options` for application defaults, `sileo.with(defaults)` for defaults shared by a group of calls, and options on a single call for its overrides. `position` accepts `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, or `bottom-right`. `offset` accepts a number, a CSS length, or an object with `top`, `right`, `bottom`, and `left` values. Leave room for fixed application headers or footers.

The API shares a browser store. Multiple Toasters render duplicate notifications and compete over defaults. `sileo.with(defaults)` creates an API with defaults, not an isolated store or another viewport owner.

Call toast helpers from browser event handlers or client lifecycle code. Server calls do not enqueue notifications for hydration. For a server action result, create the toast in the client code that receives the result.

## Create, update, and remove

`show`, `success`, `error`, `warning`, `info`, `action`, and `loading` accept an options object or a title string with an optional description. Creation returns a string ID.

```ts
import { sileo } from 'sileo-svelte';

const id = sileo.loading({ title: 'Saving' });
sileo.update(id, { state: 'success', title: 'Saved', description: 'Your changes are ready.' });
```

Use `state` in `update`, not the internal component's `toastState`. Updates merge supplied options into the existing toast, ignore `undefined`, and restart its lifecycle. An unknown ID is a no-op. Pass `button: null` to remove an action. A supplied `id` on a creation call replaces the toast with that ID.

`dismiss(id)` starts exit immediately. `close(id)` collapses before exit. `clear()` removes all toasts immediately; `clear(position)` limits removal to one of the six positions. Scoped APIs still use these shared removal methods.

`duration` is in milliseconds. `null`, zero, or a negative value keeps a toast until removal. Loading and action states default to persistent; other states default to six seconds. Finite toasts use `autopilot` for automatic expansion and collapse. `autopilot: false` disables that schedule, not the expiry timer.

## Promise results belong to the application

`sileo.promise(promiseOrFactory, options)` returns `Promise<T>`, not a toast ID. It resolves with the original data and rejects with the original error. Handle rejection wherever the application would normally handle it; an error toast does not catch the application's awaited rejection.

The `loading` mapper accepts only `title` and `icon`. `success`, `action`, and `error` accept options or functions returning options. Set a known top-level `id` if later code must remove the toast. Use `sileo.with({ styles, fill })` for styling that also applies during loading.

```ts
const result = await sileo.promise(saveChanges, {
    id: 'save-settings',
    loading: { title: 'Saving' },
    success: { title: 'Saved' },
    error: { title: 'Could not save', description: 'Try again.' }
});
```

Promise completion cannot revive a toast that the user closed, dismissed, or replaced. Supply an `action` result when success needs a persistent follow-up button.

## Customize without breaking geometry

Start with `fill`, `roundness`, the typed `styles` slots, or `classes`. Apply custom classes in global CSS because Toaster renders outside the component that called the helper. Style slots include `titleColor`, `descriptionColor`, `badgeColor`, `badgeBackground`, `buttonColor`, `buttonBackground`, `buttonHoverBackground`, and `backdropFilter`. Class slots include `toast`, `background`, `title`, `description`, `badge`, and `button`. Set width with `--sileo-width`. Avoid overriding the root's animated height, opacity, or transform.

For frosted glass, use version 0.2.1 or newer for the expansion animation fix. Pair a translucent fill with `styles.backdropFilter`:

```ts
sileo.success({
    title: 'Saved',
    description: 'Your changes are ready.',
    fill: 'rgba(24, 24, 27, 0.55)',
    styles: {
        backdropFilter: 'blur(16px) saturate(1.4)',
        titleColor: '#fff',
        descriptionColor: '#f4f4f5'
    }
});
```

The filter blurs the page inside the animated silhouette. An opaque fill hides it. `classes.toast` styles the outer toast; `classes.background` styles its background. Browser backdrop support and ancestor opacity, filters, or masks affect the result. Check it over real content and retain enough fill for legibility without blur.

## Snippets and accessibility

Pass Svelte snippets directly to `description` or `icon`, not HTML strings or React nodes. Use `icon: null` to remove the badge. Prefer `button: { title, onClick }` for an action; its callback receives the toast ID. Give the action a clear label.

Keep descriptions short and use them for supporting content, not essential form fields. Built-in announcements include the title and string description. Rich snippets need a meaningful title because their rendered content is not extracted into the live announcement.

After changes, check pointer and keyboard interaction, focus, Escape, reduced motion, narrow containers, and text contrast. For lifecycle bugs, test the actual sequence, such as dismissing a toast before its promise resolves. For glass, inspect rendered pixels over a patterned backdrop; a computed `backdrop-filter` value alone does not prove blur works.
