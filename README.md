# sileo-svelte

An opinionated, physics-based toast component for **Svelte 5**.

> **This is an unofficial Svelte 5 port of [Sileo](https://github.com/hiaaryan/sileo) by [Aaryan](https://github.com/hiaaryan).**
> All credit for the original design, animations, and concept goes to the original author.
> Please check out the original React library and give it a ⭐ — [github.com/hiaaryan/sileo](https://github.com/hiaaryan/sileo)

---

## Installation

```bash
npm install sileo-svelte
```

## Quick Start

### 1. Add the Toaster to your root layout

Place the `<Toaster />` component once in your app — typically in `+layout.svelte`. Import the required CSS alongside it.

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

### 2. Show toasts from anywhere

```svelte
<script>
    import { sileo } from 'sileo-svelte';
</script>

<button onclick={() => sileo.success({ title: 'Saved', description: 'Your changes have been saved.' })}> Save </button>
```

That's it — two imports and you're ready to go.

---

## `<Toaster />` Props

The `<Toaster />` component manages all toast viewports. You only need one instance.

| Prop       | Type                                    | Default       | Description                                                                                                                                                                          |
| ---------- | --------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `position` | `SileoPosition`                         | `'top-right'` | Default position for all toasts. Individual toasts can override this.                                                                                                                |
| `offset`   | `number \| string \| SileoOffsetConfig` | —             | Offset from the viewport edge. A single value applies to all sides. Pass an object (`{ top, right, bottom, left }`) for per-side control. Values can be numbers (px) or CSS strings. |
| `options`  | `Partial<SileoOptions>`                 | —             | Global default options merged into every toast. Per-toast options take priority.                                                                                                     |
| `children` | `Snippet`                               | —             | Optional children rendered alongside the toaster (e.g. your app content).                                                                                                            |

### `SileoPosition`

```
'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
```

---

## `sileo` API

All methods are available from the `sileo` object. Every method that creates a toast returns the toast's `id` (a `string`), which you can use to dismiss or close it later.

### Creating Toasts

```ts
import { sileo } from 'sileo-svelte';

sileo.success({ title: 'Saved' });
sileo.error({ title: 'Error', description: 'Something went wrong.' });
sileo.warning({ title: 'Warning', description: 'This action cannot be undone.' });
sileo.info({ title: 'Info', description: 'A new version is available.' });
sileo.action({ title: 'Action', description: 'Proceed?', button: { title: 'Confirm', onClick: (id) => {} } });
sileo.show({ title: 'Custom' }); // uses the default 'success' state
```

### `SileoOptions`

Every toast method accepts a `SileoOptions` object:

| Option        | Type                                                | Default         | Description                                                                                                                                                              |
| ------------- | --------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`       | `string`                                            | State name      | The toast title displayed in the pill header.                                                                                                                            |
| `description` | `string \| Snippet`                                 | —               | Body text shown when the toast expands. Supports plain strings or Svelte 5 Snippets for rich content.                                                                    |
| `position`    | `SileoPosition`                                     | Toaster default | Override the position for this specific toast.                                                                                                                           |
| `duration`    | `number \| null`                                    | `6000`          | Time in milliseconds before auto-dismiss. Set to `null` for a persistent toast that stays until manually dismissed.                                                      |
| `icon`        | `Snippet \| null`                                   | State default   | Custom icon rendered in the badge. Pass `null` to hide the icon, or a Svelte Snippet for a custom one.                                                                   |
| `fill`        | `string`                                            | `'#1c1c1e'`     | Background color of the toast pill and body.                                                                                                                             |
| `roundness`   | `number`                                            | `18`            | Border radius of the toast pill. `0` for sharp corners.                                                                                                                  |
| `autopilot`   | `boolean \| { expand?: number; collapse?: number }` | `true`          | Controls automatic expand/collapse behavior. `false` disables it entirely — the toast only expands on hover. Pass an object to set custom delay timings in milliseconds. |
| `styles`      | `SileoStyles`                                       | —               | CSS class overrides for individual toast parts (see below).                                                                                                              |
| `button`      | `SileoButton`                                       | —               | Action button displayed in the toast body (see below).                                                                                                                   |

### `SileoStyles`

Pass CSS class names to style individual parts of the toast:

```ts
interface SileoStyles {
    title?: string; // class for the title text
    description?: string; // class for the description area
    badge?: string; // class for the icon badge
    button?: string; // class for the action button
}
```

### `SileoButton`

```ts
interface SileoButton {
    title: string; // button label
    onClick: (id: string) => void; // click handler — receives the toast's id
}
```

---

### Dismissing Toasts

There are two ways to remove a toast:

#### `sileo.close(id)`

**Graceful close** — collapses the expanded body first, then plays the exit animation.

```ts
sileo.info({
    title: 'Update Available',
    description: 'Version 2.0 is ready.',
    button: {
        title: 'Install',
        onClick: (id) => {
            sileo.close(id); // collapse → exit
        }
    }
});
```

#### `sileo.dismiss(id)`

**Instant dismiss** — skips the collapse and immediately plays the exit animation. Useful when you don't care about the closing transition.

```ts
sileo.dismiss(id);
```

#### `sileo.clear(position?)`

Removes all toasts at once. Optionally pass a position to only clear toasts in that viewport.

```ts
sileo.clear(); // clear everything
sileo.clear('bottom-right'); // clear only bottom-right toasts
```

---

### Updating Toasts (Morph Transition)

#### `sileo.update(id, opts)`

**In-place update** — morphs an existing toast into new content with a smooth collapse → crossfade → re-expand transition. This is the same animation used internally by promise toasts when they resolve.

```ts
sileo.action({
    title: 'Action',
    description: 'Would you like to proceed?',
    button: {
        title: 'Confirm',
        onClick: (id) => {
            sileo.update(id, { title: 'Confirmed', description: 'Action was confirmed!', state: 'success' });
        }
    }
});
```

The `opts` object accepts all `SileoOptions` fields plus an optional `state` to change the toast type (e.g. from `'action'` to `'success'`).

You can also combine `update` with `promise` by passing the toast `id` into the promise options to morph the same toast through loading → success/error:

```ts
sileo.action({
    title: 'Update Available',
    description: 'Version 2.0 is ready to install.',
    button: {
        title: 'Install Now',
        onClick: (id) => {
            sileo.promise(() => installUpdate(), {
                id,
                loading: { title: 'Installing' },
                success: () => ({ title: 'Installed', description: 'Successfully updated to v2.0!' }),
                error: () => ({ title: 'Failed', description: 'Installation failed.' })
            });
        }
    }
});
```

---

### Promise Toasts

Tie a toast to an async operation. It shows a loading state, then transitions to success or error when the promise resolves or rejects.

```ts
sileo.promise(() => fetch('/api/upload', { method: 'POST' }), {
    loading: { title: 'Uploading' },
    success: () => ({
        title: 'Done',
        description: 'File uploaded successfully!'
    }),
    error: (err) => ({
        title: 'Failed',
        description: err instanceof Error ? err.message : 'Upload failed.'
    })
});
```

The `success` and `error` fields can be either a static `SileoOptions` object or a function that receives the resolved data / rejected error and returns `SileoOptions`.

You can also add an `action` field to show an action toast instead of success:

```ts
sileo.promise(() => saveDocument(), {
    loading: { title: 'Saving' },
    success: { title: 'Saved', description: 'Document saved.' },
    error: { title: 'Error', description: 'Could not save.' },
    action: (data) => ({
        title: 'Saved',
        description: 'Open the document?',
        button: { title: 'Open', onClick: (id) => openDocument(data) }
    }),
    position: 'bottom-center'
});
```

#### `SileoPromiseOptions<T>`

| Option     | Type                                               | Required | Description                                                        |
| ---------- | -------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| `id`       | `string`                                           | —        | Existing toast ID to morph. If omitted, a new toast is created.    |
| `loading`  | `{ title?: string; icon?: Snippet \| null }`       | ✅       | Shown while the promise is pending.                                |
| `success`  | `SileoOptions \| ((data: T) => SileoOptions)`      | ✅       | Shown when the promise resolves.                                   |
| `error`    | `SileoOptions \| ((err: unknown) => SileoOptions)` | ✅       | Shown when the promise rejects.                                    |
| `action`   | `SileoOptions \| ((data: T) => SileoOptions)`      | —        | If provided, shown instead of `success` when the promise resolves. |
| `position` | `SileoPosition`                                    | —        | Position override for the promise toast.                           |

---

## Examples

### Custom Duration

```ts
// Quick toast — 2 seconds
sileo.success({ title: 'Quick', description: 'Gone in 2 seconds.', duration: 2000 });

// Sticky toast — 15 seconds
sileo.info({ title: 'Sticky', description: 'Hangs around for a while.', duration: 15000 });

// Persistent — stays until swiped or dismissed
sileo.warning({ title: 'Persistent', description: 'Swipe me away.', duration: null });
```

### Custom Appearance

```ts
// Dark fill
sileo.success({ title: 'Dark', description: 'Custom background.', fill: '#1a1a2e' });

// Square corners
sileo.info({ title: 'Square', description: 'Reduced roundness.', roundness: 4 });

// No autopilot — only expands on hover
sileo.warning({ title: 'Manual', description: 'Hover to read.', autopilot: false });
```

### Stacking

Toasts stack automatically. Each call creates a new toast:

```ts
sileo.success({ title: 'First' });
sileo.success({ title: 'Second' });
sileo.success({ title: 'Third' });
```

To **update** an existing toast instead of stacking, pass an explicit `id`:

```ts
import { sileo } from 'sileo-svelte';

// Create with explicit id
sileo.show({ id: 'upload', title: 'Uploading', description: '0%', duration: null });

// Update the same toast (replaces content, no new toast created)
sileo.show({ id: 'upload', title: 'Uploading', description: '50%', duration: null });
sileo.show({ id: 'upload', title: 'Done', description: '100%', duration: 4000 });
```

### Using Svelte Snippets

The `description` and `icon` props accept Svelte 5 Snippets for rich content:

```svelte
<script>
    import { sileo } from 'sileo-svelte';
</script>

{#snippet customDescription()}
    <div>
        <strong>Bold text</strong> and <em>italic text</em> in a toast.
    </div>
{/snippet}

<button onclick={() => sileo.info({ title: 'Rich Content', description: customDescription })}> Show Rich Toast </button>
```

### Global Default Options

Set defaults for all toasts via the `options` prop on `<Toaster />`:

```svelte
<Toaster
    position="bottom-right"
    options={{
        duration: 4000,
        fill: '#0a0a0a',
        roundness: 12
    }}
/>
```

Individual toast options always take priority over these defaults.

### Viewport Offset

```svelte
<!-- Single value for all sides -->
<Toaster offset={24} />

<!-- CSS string -->
<Toaster offset="2rem" />

<!-- Per-side control -->
<Toaster offset={{ top: 60, right: 16 }} />
```

---

## Exports

The package exports the following from `sileo-svelte`:

| Export                | Kind      | Description                                                                                                      |
| --------------------- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| `Toaster`             | Component | The viewport manager — place once in your layout.                                                                |
| `sileo`               | Object    | The toast API (`show`, `success`, `error`, `warning`, `info`, `action`, `promise`, `update`, `dismiss`, `close`, `clear`). |
| `SileoOptions`        | Type      | Options for creating a toast.                                                                                    |
| `SileoPosition`       | Type      | Position union type.                                                                                             |
| `SileoState`          | Type      | Toast state union (`'success' \| 'loading' \| 'error' \| 'warning' \| 'info' \| 'action'`).                      |
| `SileoStyles`         | Type      | CSS class overrides.                                                                                             |
| `SileoButton`         | Type      | Action button config.                                                                                            |
| `SileoPromiseOptions` | Type      | Options for promise-based toasts.                                                                                |

CSS must be imported separately:

```ts
import 'sileo-svelte/styles.css';
```

---

## CSS Customization

Sileo uses CSS custom properties that you can override globally:

```css
:root {
    --sileo-duration: 600ms; /* animation duration */
    --sileo-height: 40px; /* pill height */
    --sileo-width: 350px; /* toast width */

    /* state colors (oklch) */
    --sileo-state-success: oklch(0.723 0.219 142.136);
    --sileo-state-loading: oklch(0.75 0 0);
    --sileo-state-error: oklch(0.637 0.237 25.331);
    --sileo-state-warning: oklch(0.795 0.184 86.047);
    --sileo-state-info: oklch(0.685 0.169 237.323);
    --sileo-state-action: oklch(0.623 0.214 259.815);
}
```

---

## Credits

- **Original library**: [sileo](https://github.com/hiaaryan/sileo) by [Aaryan](https://github.com/hiaaryan)
- **Original demo**: [sileo.aaryan.design](https://sileo.aaryan.design/)

This Svelte port preserves the original design language — gooey SVG pill, physics-based spring animations, header cross-fade, expand/collapse, and swipe-to-dismiss — adapted for Svelte 5 runes and reactivity.

## License

MIT
