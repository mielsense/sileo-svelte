---
title: Creating toasts
description: Choose a state, update an existing notification, and control its lifetime.
label: Creating toasts
---

## State helpers

Each state helper returns the toast id.

```ts
import { sileo } from 'sileo-svelte';

const id = sileo.success({
    title: 'Release saved',
    description: 'Draft v2.4 is ready for review.'
});
```

Available helpers are `show`, `success`, `error`, `warning`, `info`, `action`, and `loading`.

```ts
sileo.error('Could not save the release');
sileo.warning('The token expires tomorrow');
sileo.info('A new build is available');
```

A string becomes the title. Pass an object when you need a description, position, duration, action, or visual override.

## Update one toast

Keep the id returned by the first call, then update that toast in place.

```ts
const id = sileo.loading({
    title: 'Publishing release',
    duration: null
});

await publishRelease();

sileo.update(id, {
    state: 'success',
    title: 'Release published',
    description: 'Traffic is moving to v2.4.'
});
```

Use this for one task with several states. Creating a new toast for every state makes the interface jump and leaves stale messages behind.

## Dismiss, close, and clear

```ts
sileo.dismiss(id);
sileo.close(id);
sileo.clear();
sileo.clear('bottom-right');
```

`dismiss` and `close` both retire one toast. `clear` retires every toast, or only those at a supplied position.

## Control duration

Pass a duration in milliseconds. Use `null` for a notification that must remain until code closes it or the person acts.

```ts
sileo.action({
    title: 'Payment needs attention',
    duration: null,
    button: {
        title: 'Retry',
        onClick: (id) => retryPayment(id)
    }
});
```

Persistent toasts need a clear action or a reliable programmatic close path.

## Reuse defaults

Create a scoped API when several notifications share settings.

```ts
const billing = sileo.with({
    duration: 4000,
    position: 'bottom-right'
});

billing.info({
    title: 'Invoice ready',
    description: 'Invoice 4921 can be downloaded.'
});
```
