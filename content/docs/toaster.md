---
title: Toaster reference
description: Configure the mounted toaster, viewport offsets, and application-wide defaults.
label: Toaster
---

## Props

```ts
interface ToasterProps {
    children?: Snippet;
    position?: SileoPosition;
    offset?:
        | number
        | string
        | {
              top?: number | string;
              right?: number | string;
              bottom?: number | string;
              left?: number | string;
          };
    options?: Partial<SileoOptions>;
}
```

## position

The default is `top-right`. A position passed to an individual toast overrides it.

```svelte
<Toaster position="bottom-center" />
```

## offset

A number becomes pixels. A string can use any CSS length. One value applies to all viewport edges.

```svelte
<Toaster offset={24} />
<Toaster offset="calc(env(safe-area-inset-top) + 16px)" />
```

Pass an object when each edge needs a different value.

```svelte
<Toaster
    offset={{
        top: 'calc(env(safe-area-inset-top) + 16px)',
        right: 16,
        bottom: 24,
        left: 16
    }}
/>
```

Only the edges used by a toast position affect that viewport.

## options

Use `options` for application defaults.

```svelte
<Toaster
    options={{
        duration: 6000,
        fill: '#181818',
        roundness: 10,
        autopilot: { expand: 120, collapse: 2800 }
    }}
/>
```

Precedence runs from application defaults to scoped defaults to options passed to the toast call.

## children

`children` is optional. When supplied, the toaster renders it before the notification viewports.

```svelte
<Toaster>
    {@render children()}
</Toaster>
```

This form is useful when the toaster should wrap the route tree. Mount it once either way.
