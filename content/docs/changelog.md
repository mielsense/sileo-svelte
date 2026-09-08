---
title: Changelog
description: Release history, compatibility notes, breaking changes, fixes, and upgrade guidance.
label: Changelog
---

This project is still in beta. Each release is marked as breaking or non-breaking so upgrades do not depend on version numbers alone.

## 0.2.1 · 2026-09-08

**Release impact: Non-breaking**

### Fixed

- Frosted glass backgrounds now follow the body throughout expansion and collapse, including in WebKit.
- The documentation center column has more room for text and code, matching the landing page and playground width on wide screens.

## 0.2.0 · 2026-09-08

**Release impact: Breaking**

### Breaking changes

- The minimum supported Svelte version is now 5.56. Update Svelte before upgrading.

### Added

- Frosted glass backgrounds with `styles.backdropFilter` and a translucent `fill`.
- `classes.toast` and `classes.background` for styling the outer toast and its background.
- Explicit toast IDs in the typed creation API and `button: null` to remove an action during an update.
- A configurable playground with real stacking, expiry, updates, and matching example code.
- A repository-owned agent skill covering the public 0.2 API, application defaults, promises, snippets, styling, and accessibility. It ships in the npm package and has its own docs page and HTTP discovery endpoints.
- Installation blocks with npm, pnpm, Bun, and Yarn choices that remember the selected package manager.
- Icon tooltips for pointer and keyboard users, with reduced-motion support.

### Changed

- Toast motion now runs through the framework-independent `motion` package. CSS is responsible only for layout and appearance.
- Interrupted shape animations now retarget from their rendered geometry, and all active controls are released when a toast unmounts.
- Header states crossfade with a short blur and positional overlap instead of flashing between text values.
- Swipe gestures use progressive resistance, velocity-aware dismissal, and a spring return.
- Geometry calculations now live in a small typed module instead of being mixed into rendering and gesture code.
- `--sileo-duration` controls visual timing and lifecycle completion instead of competing with fixed removal timers.
- Reworked the docs, homepage, and playground around shared navigation styles and a bordered layout. Preview and code share one toolbar with copy and clear actions.
- Added a fixed site footer for GitHub, theme, and `llms.txt` links; moved page navigation to the header's right edge.
- Added subtle disclosure, tooltip, copy-feedback, and navigation animations that respect reduced motion.
- Tagged releases now run CI, test the npm tarball in a separate consumer, and publish that same artifact with provenance.

### Fixed

- Dismissing a toast during a pending close no longer leaves it in the store.
- A completed promise no longer revives a closing or dismissed toast.
- Promise notifications preserve scoped position defaults.
- Server-side notification calls no longer retain toast data across requests.
- Keyboard focus pauses expiry and automatic collapse while an action is in use.
- New swipe gestures stop an unfinished return animation.
- An explicit update can interrupt exit without an old completion removing the updated toast.
- Closing during a pending content update completes the close.
- Collapsed content stays measurable without forcing layout inside a skipped subtree.
- Updated dependencies with reported security advisories.
- Raw Markdown links now bypass client-side routing, preventing false 404 pages.
- Centered the error page and matched its recovery button sizes.
- Reduced-motion preferences now skip transform-heavy entrances, shape motion, header blur, and loader rotation.
- Playground examples no longer leak notifications into the documentation route.
- Toast geometry stays aligned after runtime width and height changes.
- Promise completions cannot overwrite a newer toast that reused the same id.
- Old close and dismiss timers cannot remove a newer toast that reused the same id.
- A stable live region now announces the first toast as well as later updates.
- Interactive description snippets receive keyboard focus without triggering swipe capture.
- Updates to older toasts announce their result even when a newer toast remains on screen.
- Extra touch pointers no longer interrupt an active swipe.

### Upgrade

Update Svelte to 5.56 or newer with your project's package manager, then install the library:

```bash
npm install sileo-svelte@^0.2.0
```

`SileoPromiseOptions` now permits an `action` result without a redundant `success` mapping. Existing calls remain valid.

## 0.1.1 · 2026-05-20

**Release impact: Non-breaking**

- Corrected default lifetimes for loading, action, and promise-driven toasts.
- Raised the viewport stacking level so notifications remain above application chrome.
- Rendered toast actions with semantic buttons.

## 0.0.5 · 2026-02-18

**Release impact: Breaking**

- Renamed public props and updated examples to match the new API.
- Added CSS custom properties and custom class support.
- Improved the demo's dark theme.

## 0.0.2 · 2026-02-18

**Release impact: Initial beta release**

- Published the first npm beta with state helpers, toast updates, styling hooks, and starter documentation.
