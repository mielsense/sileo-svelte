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

## Replace a named toast

Pass `id` when several calls refer to the same notification. Reusing it replaces the previous toast instead of adding another.

```ts
sileo.loading({ id: 'upload', title: 'Uploading report.pdf' });
sileo.success({ id: 'upload', title: 'Report uploaded' });
```

Replacement starts a fresh lifetime and uses the new call's options. Use `update` when you want to keep options you do not change.

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

Updates preserve omitted fields. Set `button: null` to remove an existing action after the task finishes.

```ts
sileo.update(id, {
    state: 'success',
    title: 'Payment complete',
    button: null
});
```

## Dismiss, close, and clear

```ts
sileo.dismiss(id);
sileo.close(id);
sileo.clear();
sileo.clear('bottom-right');
```

`dismiss` starts the exit animation. `close` collapses the toast before exiting. `clear` removes notifications immediately, either everywhere or at one position.

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

Action and loading toasts stay open by default. Other states last 6000ms. Hover on a fine pointer or keyboard focus inside a toast pauses expiry. Leaving the toast restarts its full duration.

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
