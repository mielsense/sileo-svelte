---
title: Changelog
description: Release history, compatibility notes, breaking changes, fixes, and upgrade guidance.
label: Changelog
---

This project is still in beta. Each release is marked as breaking or non-breaking so upgrades do not depend on version numbers alone.

## Unreleased

**Release impact: Breaking**

### Breaking changes

- The minimum supported Svelte version is now 5.56. This lets the package use modern element attachments without compatibility branches.

### Changed

- Toast motion now runs through the framework-independent `motion` package. CSS is responsible only for layout and appearance.
- Interrupted animations are stopped before replacements begin, and all active controls are released when a toast unmounts.
- Geometry calculations now live in a small typed module instead of being mixed into rendering and gesture code.
- `--sileo-duration` still controls visual timing and is now read by the Motion runtime when each toast mounts.
- The documentation has a dark-first homepage, searchable Markdown pages, syntax highlighting, copy controls, machine-readable routes, and an isolated playground.

### Fixed

- Reduced-motion preferences now skip transform-heavy entrances, shape motion, header blur, and loader rotation.
- Playground examples no longer leak notifications into the documentation route.
- Toast geometry stays aligned after runtime width and height changes.
- Promise completions cannot overwrite a newer toast that reused the same id.
- Keyboard, pointer, touch, live-region, and narrow-viewport behavior have been hardened.

### Upgrade

Update Svelte before installing this release:

```bash
bun add -D svelte@^5.56.0
bun add sileo-svelte
```

The public `Toaster`, `sileo`, option, and type APIs are unchanged.

## 0.1.1 — 2026-05-20

**Release impact: Non-breaking**

- Corrected default lifetimes for loading, action, and promise-driven toasts.
- Raised the viewport stacking level so notifications remain above application chrome.
- Rendered toast actions with semantic buttons.

## 0.0.5 — 2026-02-18

**Release impact: Breaking**

- Renamed public props and updated examples to match the new API.
- Added CSS custom properties and custom class support.
- Improved the demo's dark theme.

## 0.0.2 — 2026-02-18

**Release impact: Initial beta release**

- Published the first npm beta with state helpers, toast updates, styling hooks, and starter documentation.
