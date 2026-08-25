---
title: API reference
description: Methods exposed by sileo and the option types accepted by every toast.
label: API reference
---

## State methods

```ts
sileo.show(input, description?)
sileo.success(input, description?)
sileo.error(input, description?)
sileo.warning(input, description?)
sileo.info(input, description?)
sileo.action(input, description?)
sileo.loading(input, description?)
```

Each method accepts a title string or a `SileoOptions` object and returns the new toast id.

## Lifecycle methods

```ts
sileo.update(id, options)
sileo.dismiss(id)
sileo.close(id)
sileo.clear(position?)
```

`update` accepts every `SileoOptions` field plus an optional `state`. `clear` can target one of the six positions.

## Promise

```ts
sileo.promise<T>(
    promise: Promise<T> | (() => Promise<T>),
    options: SileoPromiseOptions<T>
): Promise<T>
```

```ts
interface SileoPromiseOptions<T> {
    id?: string;
    loading: Pick<SileoOptions, 'title' | 'icon'>;
    success: SileoOptions | ((data: T) => SileoOptions);
    error: SileoOptions | ((error: unknown) => SileoOptions);
    action?: SileoOptions | ((data: T) => SileoOptions);
    position?: SileoPosition;
}
```

## Scoped defaults

```ts
const scoped = sileo.with(defaults);
```

The returned object has the same state, promise, update, dismiss, close, and clear methods. Call-level options override scoped defaults.

## SileoOptions

| Field         | Type                | Purpose                                          |
| ------------- | ------------------- | ------------------------------------------------ |
| `title`       | `string`            | Primary notification text.                       |
| `description` | `string \| Snippet` | Supporting text or structured Svelte content.    |
| `position`    | `SileoPosition`     | Viewport placement for this toast.               |
| `duration`    | `number \| null`    | Lifetime in milliseconds. `null` keeps it open.  |
| `icon`        | `Snippet \| null`   | Custom icon content or no icon.                  |
| `button`      | `SileoButton`       | One labeled action with the toast id callback.   |
| `fill`        | `string`            | Toast background color.                          |
| `roundness`   | `number`            | Corner roundness used by the toast shape.        |
| `autopilot`   | `boolean \| object` | Automatic expand and collapse timing.            |
| `classes`     | `SileoClasses`      | Class names for supported internal parts.        |
| `styles`      | `SileoStyles`       | Typed color values for supported internal parts. |

## Exported types

```ts
import type {
    SileoApi,
    SileoButton,
    SileoClasses,
    SileoInput,
    SileoOptions,
    SileoPosition,
    SileoPromiseOptions,
    SileoScopedApi,
    SileoState,
    SileoStyles
} from 'sileo-svelte';
```
