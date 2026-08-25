---
title: Async flows
description: Track promises with one notification that moves through loading, success, and error states.
label: Async flows
---

## Track a promise

Pass an existing promise or a function that returns one.

```ts
const result = await sileo.promise(uploadBuild(), {
    loading: { title: 'Uploading build' },
    success: (build) => ({
        title: 'Build uploaded',
        description: `${build.files} artifacts are ready.`
    }),
    error: (error) => ({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Try again.'
    })
});
```

The returned promise preserves the original result type. You can keep using `result` after the notification finishes.

## Reuse a loading toast

Pass an id when code already created the loading state.

```ts
const id = sileo.loading({
    title: 'Uploading build',
    position: 'bottom-left'
});

await sileo.promise(() => uploadBuild(), {
    id,
    loading: { title: 'Uploading build' },
    success: { title: 'Build uploaded' },
    error: { title: 'Upload failed' }
});
```

This keeps the same toast and position throughout the task.

## Add a follow-up action

The optional `action` mapping replaces the success state. Use it when the completed task has one useful next step instead of a passive confirmation.

```ts
await sileo.promise(() => createReport(), {
    loading: { title: 'Building report' },
    success: { title: 'Report ready' },
    error: { title: 'Report failed' },
    action: (report) => ({
        title: 'Report ready',
        button: {
            title: 'Open report',
            onClick: () => openReport(report.id)
        }
    })
});
```

## Handle retries

Update the same id when an action starts another request.

```ts
function retryPayment(id: string) {
    sileo.update(id, {
        state: 'loading',
        title: 'Retrying payment'
    });

    retry().then(
        () => sileo.update(id, { state: 'success', title: 'Payment captured' }),
        () => sileo.update(id, { state: 'error', title: 'Payment declined again' })
    );
}
```
