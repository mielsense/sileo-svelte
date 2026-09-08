# Releasing sileo-svelte

The npm package and the documentation site are separate outputs. Deploying the site does not publish the package.

## One-time setup

1. Create a GitHub environment named `npm` in `mielsense/sileo-svelte`. Restrict its deployment tags to `v*`. Protect release tags with a repository ruleset so only maintainers can create them.
2. Open the `sileo-svelte` package settings on npm and add a GitHub Actions trusted publisher:
    - Owner: `mielsense`
    - Repository: `sileo-svelte`
    - Workflow filename: `release.yml`
    - Environment: `npm`
3. Keep account two-factor authentication enabled. This workflow uses OIDC, so no `NPM_TOKEN` secret is needed.

The publisher belongs to `release.yml`, where the publish job runs. `ci.yml` is the reusable verification workflow. See [npm's trusted publishing documentation](https://docs.npmjs.com/trusted-publishers).

## Prepare a release

Update `package.json` and the matching entry in `content/docs/changelog.md`. Run `bun install` to update the lockfile if needed. For 0.2.0, replace the release-candidate note with the publication date when the release is ready.

Run the checks from the repository root:

```bash
bun install --frozen-lockfile
bun run lint
bun run check
bun run test
bunx playwright install chromium webkit
bun run test:browser
bun run build
bun run prepack
bun run test:package
bun audit
```

Review and commit the changes. Push the commit before creating the release tag. For this release:

```bash
git tag -a v0.2.0 -m "Release 0.2.0"
git push origin v0.2.0
```

Pushing the tag starts publication. Do not push it until the release is ready.

## What CI does

The release workflow checks that the tag matches a stable version in `package.json`. It runs lint, type checks, unit tests, Chromium and WebKit tests, and the documentation build. It then builds and lints the package, creates an npm tarball, and installs that tarball in a separate Svelte consumer for browser and SSR builds.

The publish job downloads the tested artifact, checks its version and SHA-512 integrity, and publishes it with provenance. It then checks that npm serves the same bytes. Publication uses a GitHub-hosted runner with Node 24 and npm 11.5.1 or newer.

## If a release fails

If validation fails, fix the problem before publishing. If npm authentication fails, check all four trusted publisher fields above and the `npm` environment settings.

If publication succeeded but the final registry check failed, inspect the published version and compare its `dist.integrity` with `pack.json` in the workflow's `npm-package` artifact. Do not overwrite or unpublish a version to retry. npm versions are immutable; the publish step will safely refuse an existing version. Ship a new patch version when published code needs a fix.
