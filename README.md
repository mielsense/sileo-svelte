# sileo-svelte

Physics-based, gooey toast notifications for Svelte 5.56 and newer.

[Scenario lab](#scenario-lab) · [npm](https://www.npmjs.com/package/sileo-svelte) · [GitHub](https://github.com/mielsense/sileo-svelte)

An unofficial Svelte 5 port of [Sileo](https://github.com/hiaaryan/sileo) by
[Aaryan](https://github.com/hiaaryan).

## Install

```bash
npm install sileo-svelte
```

## 60-second start

Mount one toaster near the root of your app and import its stylesheet once.

```svelte
<!-- src/routes/+layout.svelte -->
<script>
    import { Toaster } from 'sileo-svelte';
    import 'sileo-svelte/styles.css';

    let { children } = $props();
</script>

{@render children()}
<Toaster position="top-right" />
```

Trigger a toast from any component or module.

```svelte
<script>
    import { sileo } from 'sileo-svelte';
</script>

<button onclick={() => sileo.success('Saved', 'Your changes are secure.')}>Save</button>
```

Creation methods return the toast ID, which can be reused for updates and
promise flows.

## Common recipes

### Create and update

```ts
const id = sileo.loading('Uploading');

sileo.update(id, { title: 'Uploading', description: '50%' });
sileo.update(id, {
    state: 'success',
    title: 'Uploaded',
    description: '100%',
    duration: 4000
});
```

Partial updates preserve the current toast fields. Explicit update fields take
precedence over the existing toast, scoped defaults, and toaster defaults.
Changing state without specifying `duration` applies the new state's default
duration.

### Track a promise

```ts
await sileo.promise(() => saveDocument(), {
    loading: { title: 'Saving' },
    success: (document) => ({
        title: 'Saved',
        description: document.name
    }),
    error: (error) => ({
        title: 'Could not save',
        description: error instanceof Error ? error.message : 'Unknown error'
    })
});
```

The helper returns the original promise. Synchronous throws and rejected
promises both use the error mapping. Errors thrown by success or action mappers
also pass through the error mapping. If the error mapper itself throws, that
failure is logged and the toast keeps its current state. Async results never
replace a newer toast that reused the same ID.

### Add an action

```ts
sileo.action({
    title: 'Deploy release',
    description: 'Production is ready for the next version.',
    button: {
        title: 'Deploy',
        onClick: (id) => sileo.close(id)
    }
});
```

Action and loading toasts are persistent by default. Set a numeric `duration`
when they should dismiss automatically.

### Reuse scoped defaults

```ts
const billingToasts = sileo.with({
    position: 'bottom-right',
    duration: 4000,
    fill: '#121212',
    styles: { titleColor: 'white' }
});

billingToasts.success('Invoice paid');
billingToasts.error('Payment failed', 'Try another payment method.');
```

Calling `with` returns another complete API. `classes` and `styles` merge by
key; other options merge shallowly.

### Hide or replace the icon

```ts
sileo.info({
    title: 'Quiet update',
    description: 'No status badge is rendered.',
    icon: null
});
```

`description` and `icon` also accept Svelte snippets for rich content.

### Orchestrate one toast

Use an existing ID to morph one notification through a longer workflow.

```ts
const id = sileo.loading('Preparing release');

sileo.update(id, {
    state: 'info',
    title: 'Running checks',
    description: 'Validating six regions'
});

await sileo.promise(() => releaseToProduction(), {
    id,
    loading: { title: 'Rolling out' },
    success: { title: 'Release complete', description: 'Traffic switched' },
    error: { title: 'Rollback started', duration: null }
});
```

## API

### `<Toaster />`

Only one toaster is normally needed.

| Prop       | Type                              | Default       | Purpose                                                |
| ---------- | --------------------------------- | ------------- | ------------------------------------------------------ |
| `position` | `SileoPosition`                   | `'top-right'` | Default viewport; a toast can override it              |
| `offset`   | `number \| string \| edge object` | `undefined`   | Space from matching viewport edges; numbers use pixels |
| `options`  | `Partial<SileoOptions>`           | `undefined`   | Defaults applied to every toast                        |
| `children` | `Snippet`                         | `undefined`   | Optional content rendered before the viewports         |

An edge object can contain `top`, `right`, `bottom`, and `left`, each as a
number or CSS length.

```svelte
<Toaster
    position="bottom-right"
    offset={{ bottom: 24, right: 'max(16px, env(safe-area-inset-right))' }}
    options={{ duration: 4000, roundness: 12 }}
/>
```

### `sileo`

All creation methods accept either a title string or `SileoOptions` and return
an ID.

```ts
show(input, description?): string
success(input, description?): string
error(input, description?): string
warning(input, description?): string
info(input, description?): string
action(input, description?): string
loading(input, description?): string

update(id, options): void
dismiss(id): void
close(id): void
clear(position?): void
with(defaults): SileoApi
promise(promiseOrFactory, options): Promise<T>
```

`dismiss` starts the exit immediately. `close` collapses before exiting.
`clear` removes every toast, or only those in a supplied position.

### Options

| Field         | Type                      | Default          | Purpose                               |
| ------------- | ------------------------- | ---------------- | ------------------------------------- |
| `title`       | `string`                  | state name       | Header label                          |
| `description` | `string \| Snippet`       | `undefined`      | Expanded body content                 |
| `position`    | `SileoPosition`           | toaster position | Per-toast viewport                    |
| `duration`    | `number \| null`          | `6000`           | Dismiss delay; `null` is persistent   |
| `icon`        | `Snippet \| null`         | state icon       | Custom badge content; `null` hides it |
| `classes`     | `SileoClasses`            | `undefined`      | Classes for named toast parts         |
| `styles`      | `SileoStyles`             | `undefined`      | Per-toast color variables             |
| `fill`        | `string`                  | `'#1c1c1e'`      | Toast surface color                   |
| `roundness`   | `number`                  | `18`             | Corner radius                         |
| `autopilot`   | `boolean \| delay object` | `true`           | Automatic expand and collapse         |
| `button`      | `SileoButton`             | `undefined`      | Expanded action button                |

Positions are `top-left`, `top-center`, `top-right`, `bottom-left`,
`bottom-center`, `bottom-right`.

### Public exports

```ts
import {
    Toaster,
    sileo,
    type SileoApi,
    type SileoScopedApi,
    type SileoInput,
    type SileoOptions,
    type SileoPosition,
    type SileoState,
    type SileoClasses,
    type SileoStyles,
    type SileoButton,
    type SileoPromiseOptions
} from 'sileo-svelte';

import 'sileo-svelte/styles.css';
```

`SileoState` is `success`, `loading`, `error`, `warning`, `info`, or `action`.
`SileoClasses` targets `title`, `description`, `badge`, and `button`.
`SileoStyles` provides `titleColor`, `descriptionColor`, `badgeColor`,
`badgeBackground`, `buttonColor`, `buttonBackground`, and
`buttonHoverBackground`.

`SileoPromiseOptions<T>` requires `loading`, `error`, and either `success` or
`action`. It also accepts `id` and `position`. When both `success` and `action`
are supplied, the action mapping is the final state. Success, action, and error
values can be options or mapping functions.

## Styling

The component package is Tailwind-free and uses Motion for its runtime animation. Override its global custom properties:

```css
:root {
    --sileo-duration: 600ms;
    --sileo-height: 40px;
    --sileo-width: 350px;
    --sileo-z-index: 2147483647;

    --sileo-state-success: oklch(0.723 0.219 142.136);
    --sileo-state-loading: oklch(0.75 0 0);
    --sileo-state-error: oklch(0.637 0.237 25.331);
    --sileo-state-warning: oklch(0.795 0.184 86.047);
    --sileo-state-info: oklch(0.685 0.169 237.323);
    --sileo-state-action: oklch(0.623 0.214 259.815);
}
```

Toast width is capped to the viewport with 12-pixel side margins. Its SVG,
header, and body use the resolved custom width and height, so overrides remain
aligned at narrow widths.

For one toast, use `styles` when utility-class extraction is uncertain:

```ts
sileo.success({
    title: 'Branded',
    styles: {
        titleColor: 'var(--foreground)',
        badgeBackground: 'var(--primary)',
        badgeColor: 'var(--primary-foreground)'
    }
});
```

If Tailwind classes appear only inside JavaScript strings, safelist them with
the mechanism recommended for your Tailwind version.

## Accessibility and motion

- Viewports use a polite live region.
- Headers with an action button are keyboard-focusable. Enter or Space expands
  and collapses that toast, including older stacked toasts. Status-only headers
  are not tab stops.
- Click or tap expands and collapses descriptions. Escape closes an expanded
  actionable body and returns focus to its header.
- Action buttons have visible focus treatment.
- Hover pauses dismissal only on fine-pointer devices. Touch users can tap to
  expand and swipe vertically to dismiss.
- `prefers-reduced-motion: reduce` removes transform-heavy entrances and loader
  motion while preserving immediate layout and opacity changes.

## Scenario lab

The repository includes a deterministic browser lab for core success, async
promise, action and retry, scoped defaults, custom styling with an action, and
rich snippet flows. It also exposes the source for each scenario. Run it
locally:

```bash
bun install
bun run dev
```

The deployed documentation URL is intentionally not listed until the project
has a confirmed hosting target.

## Credits

- Original library: [hiaaryan/sileo](https://github.com/hiaaryan/sileo)
- Original demo: [sileo.aaryan.design](https://sileo.aaryan.design/)

## License

MIT
