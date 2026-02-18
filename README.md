# sileo-svelte

Physics-based toast notifications for **Svelte 5**.

> Unofficial Svelte 5 port of [Sileo](https://github.com/hiaaryan/sileo) by [Aaryan](https://github.com/hiaaryan).

## Installation

```bash
npm install sileo-svelte
```

## Quick Start

### 1. Mount the toaster once

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

### 2. Trigger toasts from anywhere

```svelte
<script>
    import { sileo } from 'sileo-svelte';
</script>

<button onclick={() => sileo.success('Saved', 'Your changes have been saved.')}>Save</button>
```

## `<Toaster />` Props

Only one `<Toaster />` is needed in your app.

| Prop       | Type                                    | Default       | Description                                                                                     |
| ---------- | --------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------- |
| `position` | `SileoPosition`                         | `'top-right'` | Default viewport for new toasts. Per-toast `position` still overrides this.                     |
| `offset`   | `number \| string \| SileoOffsetConfig` | `undefined`   | Offset from screen edges. Number values are treated as `px`.                                    |
| `options`  | `Partial<SileoOptions>`                 | `undefined`   | Global defaults merged into every toast call. Per-toast fields win. `styles` is merged per-key. |
| `children` | `Snippet`                               | `undefined`   | Optional content rendered before toast viewports.                                               |

`SileoOffsetConfig`:

```ts
type SileoOffsetConfig = Partial<{
    top: number | string;
    right: number | string;
    bottom: number | string;
    left: number | string;
}>;
```

`SileoPosition`:

```ts
'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
```

## `sileo` API

All creation methods return the toast `id: string`.

### Creation methods

```ts
show(input: SileoInput, description?: SileoOptions['description']): string
success(input: SileoInput, description?: SileoOptions['description']): string
error(input: SileoInput, description?: SileoOptions['description']): string
warning(input: SileoInput, description?: SileoOptions['description']): string
info(input: SileoInput, description?: SileoOptions['description']): string
action(input: SileoInput, description?: SileoOptions['description']): string
loading(input: SileoInput, description?: SileoOptions['description']): string
```

`SileoInput`:

```ts
type SileoInput = SileoOptions | string;
```

Examples:

```ts
sileo.success({ title: 'Saved' });
sileo.success('Saved');
sileo.success('Saved', 'Your changes have been saved.');

// loading defaults to duration: null unless explicitly provided
const id = sileo.loading('Uploading...');
sileo.update(id, { state: 'success', title: 'Uploaded' });
```

### Scoped defaults

Use `sileo.with(defaults)` to avoid repeating common options.

```ts
const billingToasts = sileo.with({
    position: 'bottom-right',
    duration: 4000,
    fill: '#121212'
});

billingToasts.success('Invoice paid');
billingToasts.error('Payment failed', 'Please retry with another card.');
```

Defaults are merged recursively for `styles` and shallow-merged for other fields.

### Promise helper

```ts
promise<T>(
  promise: Promise<T> | (() => Promise<T>),
  opts: SileoPromiseOptions<T>
): Promise<T>
```

```ts
sileo.promise(() => fetch('/api/upload', { method: 'POST' }), {
    loading: { title: 'Uploading' },
    success: () => ({ title: 'Done', description: 'File uploaded successfully!' }),
    error: (err) => ({
        title: 'Failed',
        description: err instanceof Error ? err.message : 'Upload failed.'
    })
});
```

`SileoPromiseOptions<T>`:

| Option     | Type                                               | Required | Description                                               |
| ---------- | -------------------------------------------------- | -------- | --------------------------------------------------------- |
| `id`       | `string`                                           | No       | Existing toast id to morph instead of creating a new one. |
| `loading`  | `Pick<SileoOptions, 'title' \| 'icon'>`            | Yes      | Pending state content.                                    |
| `success`  | `SileoOptions \| ((data: T) => SileoOptions)`      | Yes      | Success state content.                                    |
| `error`    | `SileoOptions \| ((err: unknown) => SileoOptions)` | Yes      | Error state content.                                      |
| `action`   | `SileoOptions \| ((data: T) => SileoOptions)`      | No       | If provided, replaces `success` state.                    |
| `position` | `SileoPosition`                                    | No       | Position override for the promise toast.                  |

### Update and dismissal

```ts
update(id: string, opts: SileoOptions & { state?: SileoState }): void
dismiss(id: string): void
close(id: string): void
clear(position?: SileoPosition): void
```

- `update`: morphs content/state in place.
- `dismiss`: immediate exit animation.
- `close`: collapse first, then exit.
- `clear`: remove all toasts (or a specific viewport).

## `SileoOptions`

| Field         | Type                                                | Default            | Description                                             |
| ------------- | --------------------------------------------------- | ------------------ | ------------------------------------------------------- |
| `title`       | `string`                                            | State name         | Header title.                                           |
| `description` | `string \| Snippet`                                 | `undefined`        | Expanded body content.                                  |
| `position`    | `SileoPosition`                                     | Toaster `position` | Per-toast viewport override.                            |
| `duration`    | `number \| null`                                    | `6000`             | Auto-dismiss timeout in ms. `null` keeps it persistent. |
| `icon`        | `Snippet \| null`                                   | State icon         | Custom icon snippet; `null` hides icon.                 |
| `styles`      | `SileoStyles`                                       | `undefined`        | Per-part class overrides.                               |
| `fill`        | `string`                                            | `'#1c1c1e'`        | Toast background color.                                 |
| `roundness`   | `number`                                            | `18`               | Corner radius.                                          |
| `autopilot`   | `boolean \| { expand?: number; collapse?: number }` | `true`             | Automatic expand/collapse behavior.                     |
| `button`      | `SileoButton`                                       | `undefined`        | Action button shown in expanded body.                   |

`SileoStyles`:

```ts
interface SileoStyles {
    title?: string;
    description?: string;
    badge?: string;
    button?: string;
}
```

`SileoButton`:

```ts
interface SileoButton {
    title: string;
    onClick: (id: string) => void;
}
```

`SileoState`:

```ts
'success' | 'loading' | 'error' | 'warning' | 'info' | 'action';
```

## Practical Examples

### Custom appearance

```ts
sileo.success({ title: 'Dark', description: 'Custom background.', fill: '#1a1a2e' });
sileo.info({ title: 'Square', description: 'Reduced roundness.', roundness: 4 });
sileo.warning({ title: 'Manual', description: 'Hover to read.', autopilot: false });
```

### Reusing a toast id

```ts
const id = sileo.loading('Uploading file...');

sileo.update(id, { title: 'Uploading', description: '50%' });
sileo.update(id, { state: 'success', title: 'Done', description: '100%', duration: 4000 });
```

### Svelte snippets for rich content (`description` and `icon`)

`SileoOptions` supports snippets in two places:

- `description`: rich body content in the expanded area
- `icon`: custom header icon badge

```svelte
<script>
    import { sileo } from 'sileo-svelte';
</script>

{#snippet customDescription()}
    <div>
        <strong>Release ready.</strong>
        <p>Click deploy to roll out v2.4.0.</p>
    </div>
{/snippet}

{#snippet rocketIcon()}
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
    >
        <path d="M4.5 16.5c-1.5 1.26-2 3.75-2 3.75s2.49-.5 3.75-2l3-3-1.75-1.75z" />
        <path d="M14 10l-4 4" />
        <path d="M16 4l4 4" />
        <path d="M21.17 2.83a2.83 2.83 0 0 1 0 4L11 17l-4-4L17.17 2.83a2.83 2.83 0 0 1 4 0z" />
    </svg>
{/snippet}

<button
    onclick={() =>
        sileo.action({
            title: 'Deploy',
            description: customDescription,
            icon: rocketIcon,
            button: {
                title: 'Run',
                onClick: (id) => sileo.close(id)
            }
        })}>Show Rich Toast</button
>
```

Notes:

- `description` and `icon` both accept either plain values (`string` / `null`) or snippets.
- Set `icon: null` to hide the icon entirely.
- Snippets are also valid in `sileo.update(...)` payloads, so you can morph to/from rich content.

### Advanced workflows (update + promise orchestration)

```ts
const id = sileo.loading('Deploying v2.4.0...');

await delay(1000);
sileo.update(id, {
    state: 'info',
    title: 'Uploading build',
    description: 'Artifacts uploaded to edge cache.'
});

await delay(1000);
sileo.update(id, {
    state: 'warning',
    title: 'Running health checks',
    description: 'Smoke tests on 6 regions...'
});

// Final stage: morph same toast through promise lifecycle
sileo.promise(
    async () => {
        await delay(900);
        return await releaseToProduction();
    },
    {
        id,
        loading: { title: 'Rolling out' },
        success: () => ({
            state: 'action',
            title: 'Deployment complete',
            description: 'Traffic switched to v2.4.0.',
            button: {
                title: 'View logs',
                onClick: (toastId) => {
                    openDeploymentLogs();
                    sileo.close(toastId);
                }
            }
        }),
        error: (err) => ({
            title: 'Rollback triggered',
            description: err instanceof Error ? err.message : 'Unknown deploy error',
            duration: null
        })
    }
);
```

```ts
// Action-first flow that morphs into promise states
sileo.action({
    title: 'Update available',
    description: 'Version 2.0 is ready to install.',
    button: {
        title: 'Install now',
        onClick: (id) => {
            sileo.promise(() => installUpdate(), {
                id,
                loading: { title: 'Installing' },
                success: () => ({
                    state: 'action',
                    title: 'Installed successfully',
                    description: 'Restart app to apply the update.',
                    button: {
                        title: 'Restart',
                        onClick: (toastId) => sileo.close(toastId)
                    }
                }),
                error: (err) => ({
                    state: 'action',
                    title: 'Install failed',
                    description: err instanceof Error ? err.message : 'Unknown install error',
                    duration: null,
                    button: {
                        title: 'Retry',
                        onClick: (toastId) => {
                            sileo.promise(() => installUpdate(), {
                                id: toastId,
                                loading: { title: 'Retrying install' },
                                success: { title: 'Retry succeeded', description: 'Update installed.' },
                                error: { title: 'Still failing', description: 'Please check logs.', duration: null }
                            });
                        }
                    }
                })
            });
        }
    }
});
```

### Toaster defaults and viewport offset

```svelte
<Toaster
    position="bottom-right"
    options={{
        duration: 4000,
        fill: '#0a0a0a',
        roundness: 12
    }}
    offset={{ top: 60, right: 16 }}
/>
```

## Exports

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
    type SileoStyles,
    type SileoButton,
    type SileoPromiseOptions
} from 'sileo-svelte';
```

Import CSS separately:

```ts
import 'sileo-svelte/styles.css';
```

## CSS Customization

Override these variables globally:

```css
:root {
    --sileo-duration: 600ms;
    --sileo-height: 40px;
    --sileo-width: 350px;

    --sileo-state-success: oklch(0.723 0.219 142.136);
    --sileo-state-loading: oklch(0.75 0 0);
    --sileo-state-error: oklch(0.637 0.237 25.331);
    --sileo-state-warning: oklch(0.795 0.184 86.047);
    --sileo-state-info: oklch(0.685 0.169 237.323);
    --sileo-state-action: oklch(0.623 0.214 259.815);
}
```

## Credits

- Original library: [hiaaryan/sileo](https://github.com/hiaaryan/sileo)
- Original demo: [sileo.aaryan.design](https://sileo.aaryan.design/)

## License

MIT
