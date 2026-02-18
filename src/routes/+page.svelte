<script lang="ts">
    import { onMount } from 'svelte';
    import { sileo, type SileoOptions, type SileoPosition } from '$lib/index.js';

    // Shared defaults
    const billingToasts = sileo.with({
        position: 'bottom-right',
        duration: 4000,
        fill: '#101518'
    });

    const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
    const positions: SileoPosition[] = [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right'
    ];

    let selectedPosition = $state<SileoPosition>('top-right');
    let darkMode = $state(false);

    onMount(() => {
        darkMode = document.documentElement.classList.contains('dark');
    });

    function toggleDarkMode() {
        darkMode = !darkMode;
        document.documentElement.classList.toggle('dark', darkMode);
    }

    function atSelected(opts: SileoOptions): SileoOptions {
        return { ...opts, position: opts.position ?? selectedPosition };
    }

    // Core examples
    function showSuccess() {
        sileo.success(atSelected({ title: 'Success', description: 'Your changes have been saved successfully.' }));
    }

    function showError() {
        sileo.error(atSelected({ title: 'Error', description: 'Something went wrong. Please try again.' }));
    }

    function showWarning() {
        sileo.warning(atSelected({ title: 'Warning', description: 'This action cannot be undone.' }));
    }

    function showInfo() {
        sileo.info(atSelected({ title: 'Info', description: 'A new version is available for download.' }));
    }

    function showAction() {
        sileo.action(
            atSelected({
                title: 'Action required',
                description: 'Would you like to proceed with this operation?',
                button: {
                    title: 'Confirm',
                    onClick: (id) => {
                        sileo.update(id, {
                            state: 'success',
                            title: 'Confirmed',
                            description: 'Action was confirmed.'
                        });
                    }
                }
            })
        );
    }

    function showIcon() {
        sileo.info(
            atSelected({
                title: 'Custom icon',
                description: customDescription,
                icon: customIcon
            })
        );
    }

    function showPromise() {
        sileo.promise(
            async () => {
                await delay(1200);
                return { name: 'Sileo' };
            },
            {
                position: selectedPosition,
                loading: { title: 'Loading' },
                success: (data) => ({
                    title: 'Success',
                    description: `Loaded "${data.name}" successfully!`
                }),
                error: () => ({
                    title: 'Error',
                    description: 'Failed to load data.'
                })
            }
        );
    }

    function showPromiseError() {
        sileo.promise(
            async () => {
                await delay(1200);
                throw new Error('Network error');
            },
            {
                position: selectedPosition,
                loading: { title: 'Uploading' },
                success: () => ({
                    title: 'Uploaded',
                    description: 'File uploaded successfully!'
                }),
                error: (err) => ({
                    title: 'Upload failed',
                    description: err instanceof Error ? err.message : 'Unknown error occurred.'
                })
            }
        );
    }

    // Ergonomic examples
    function showShorthandTitle() {
        sileo.success('Saved');
    }

    function showShorthandWithDescription() {
        sileo.info('New version available', 'Install the update from Settings to get the latest fixes.');
    }

    function showLoadingHelper() {
        const id = sileo.loading(atSelected({ title: 'Uploading backup...' }));
        setTimeout(() => {
            sileo.update(id, {
                state: 'success',
                title: 'Upload complete',
                description: 'Backup uploaded successfully.'
            });
        }, 1500);
    }

    function showScopedSuccess() {
        billingToasts.success('Invoice paid');
    }

    function showScopedError() {
        billingToasts.error('Payment failed', 'Please retry with another card.');
    }

    function showClassesPropExample() {
        sileo.action(
            atSelected({
                title: 'Classes prop applied',
                description: 'This toast uses classes from options.classes on title, description, and button.',
                fill: '#f8fafc',
                classes: {
                    title: 'styles-demo-title',
                    description: 'styles-demo-description',
                    button: 'styles-demo-button styles-demo-button-hover'
                },
                button: {
                    title: 'Close',
                    onClick: (id) => sileo.close(id)
                }
            })
        );
    }

    function showStylesPropExample() {
        sileo.action(
            atSelected({
                title: 'Styles prop applied',
                description: 'These colors are controlled with options.styles and CSS variables only.',
                fill: '#f8fafc',
                styles: {
                    titleColor: '#0f172a',
                    descriptionColor: '#0f172a',
                    badgeColor: '#1d4ed8',
                    badgeBackground: '#dbeafe',
                    buttonColor: '#ffffff',
                    buttonBackground: '#111827',
                    buttonHoverBackground: '#374151'
                },
                button: {
                    title: 'Close',
                    onClick: (id) => sileo.close(id)
                }
            })
        );
    }

    // Advanced examples
    function showWithButton() {
        sileo.action(
            atSelected({
                title: 'Update available',
                description: 'Version 2.0 is ready to install.',
                button: {
                    title: 'Install now',
                    onClick: (id) => {
                        sileo.promise(() => delay(1500), {
                            id,
                            loading: { title: 'Installing' },
                            success: () => ({
                                title: 'Installed',
                                description: 'Successfully updated to v2.0!'
                            }),
                            error: () => ({
                                title: 'Install failed',
                                description: 'Installation failed.'
                            })
                        });
                    }
                }
            })
        );
    }

    async function showAdvancedDeployFlow() {
        const id = sileo.loading(atSelected({ title: 'Deploying v2.4.0...' }));

        await delay(1000);
        sileo.update(id, {
            state: 'info',
            title: 'Uploading build',
            description: 'Artifacts pushed to edge cache.'
        });

        await delay(1000);
        sileo.update(id, {
            state: 'warning',
            title: 'Running health checks',
            description: 'Smoke tests on 6 regions...'
        });

        sileo.promise(
            async () => {
                await delay(900);
                return { release: 'v2.4.0' };
            },
            {
                id,
                loading: { title: 'Switching traffic' },
                success: (data) => ({
                    state: 'action',
                    title: `${data.release} is live`,
                    description: 'Traffic switched to the new release.',
                    button: {
                        title: 'Close',
                        onClick: (toastId) => sileo.close(toastId)
                    }
                }),
                error: (err) => ({
                    title: 'Rollback triggered',
                    description: err instanceof Error ? err.message : 'Release failed',
                    duration: null
                })
            }
        );
    }

    function showAdvancedRetryFlow() {
        const request = () =>
            new Promise<string>((resolve, reject) => {
                setTimeout(() => {
                    const ok = Math.random() > 0.55;
                    if (ok) resolve('Invoice #4921');
                    else reject(new Error('Gateway timeout while charging card'));
                }, 1000);
            });

        sileo.promise(request, {
            position: selectedPosition,
            loading: { title: 'Charging card' },
            success: (invoice) => ({
                state: 'action',
                title: 'Payment captured',
                description: `${invoice} created successfully.`,
                button: {
                    title: 'New charge',
                    onClick: () => showAdvancedRetryFlow()
                }
            }),
            error: (err) => ({
                state: 'action',
                title: 'Payment failed',
                description: err instanceof Error ? err.message : 'Unknown payment failure',
                duration: null,
                button: {
                    title: 'Retry',
                    onClick: (id) => {
                        sileo.promise(request, {
                            id,
                            loading: { title: 'Retrying charge' },
                            success: (invoice) => ({
                                title: 'Retry succeeded',
                                description: `${invoice} created on retry.`
                            }),
                            error: (retryErr) => ({
                                title: 'Still failing',
                                description: retryErr instanceof Error ? retryErr.message : 'Unknown payment failure',
                                duration: null
                            })
                        });
                    }
                }
            })
        });
    }

    function showAdvancedActionFlow() {
        sileo.action(
            atSelected({
                title: 'Migration ready',
                description: 'Apply production database migration now?',
                button: {
                    title: 'Run migration',
                    onClick: (id) => {
                        sileo.update(id, {
                            state: 'loading',
                            title: 'Preparing migration',
                            description: 'Validating schema and creating backup...'
                        });

                        sileo.promise(
                            async () => {
                                await delay(1600);
                                if (Math.random() > 0.35) return { rows: 1284 };
                                throw new Error('Foreign key validation failed');
                            },
                            {
                                id,
                                loading: { title: 'Applying migration' },
                                success: (result) => ({
                                    state: 'success',
                                    title: 'Migration complete',
                                    description: `${result.rows} rows updated successfully.`,
                                    duration: 3200
                                }),
                                error: (err) => ({
                                    state: 'action',
                                    title: 'Migration blocked',
                                    description: err instanceof Error ? err.message : 'Unknown migration error',
                                    duration: null,
                                    button: {
                                        title: 'Retry',
                                        onClick: (toastId) => {
                                            sileo.promise(
                                                async () => {
                                                    await delay(1300);
                                                    return { rows: 1284 };
                                                },
                                                {
                                                    id: toastId,
                                                    loading: { title: 'Retrying migration' },
                                                    success: (retryResult) => ({
                                                        title: 'Retry complete',
                                                        description: `${retryResult.rows} rows updated.`
                                                    }),
                                                    error: (retryErr) => ({
                                                        title: 'Retry failed',
                                                        description:
                                                            retryErr instanceof Error
                                                                ? retryErr.message
                                                                : 'Unknown migration error',
                                                        duration: null
                                                    })
                                                }
                                            );
                                        }
                                    }
                                })
                            }
                        );
                    }
                }
            })
        );
    }

    function clearAll() {
        sileo.clear();
    }
</script>

<svelte:head>
    <title>Sileo-Svelte Playground</title>
</svelte:head>

{#snippet customDescription()}
    <span>Custom snippet body with rich content support.</span>
{/snippet}

{#snippet customIcon()}
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
        <path d="M12 3l2.6 5.27L20 9.27l-4 3.9.94 5.53L12 16l-4.94 2.7.94-5.53-4-3.9 5.4-1z" />
    </svg>
{/snippet}

<main>
    <div class="page">
        <header class="topbar">
            <div class="brand">Sileo Svelte</div>
            <nav>
                <button
                    type="button"
                    class="theme-toggle"
                    onclick={toggleDarkMode}
                    aria-pressed={darkMode}
                >
                    {darkMode ? 'Light' : 'Dark'}
                </button>
                <a
                    href="https://github.com/mielsense/sileo-svelte"
                    aria-label="GitHub">GitHub</a
                >
            </nav>
        </header>

        <section class="hero">
            <h1>Playground.</h1>
            <p>Pick a position, then click any type to fire it live.</p>
        </section>

        <section class="controls">
            <div class="chips">
                {#each positions as pos (pos)}
                    <button
                        class="chip"
                        class:active={selectedPosition === pos}
                        onclick={() => (selectedPosition = pos)}>{pos}</button
                    >
                {/each}
            </div>

            <hr />

            <div class="action-groups">
                <div class="group">
                    <p>Core</p>
                    <div class="chips chips-actions">
                        <button
                            class="chip"
                            onclick={showSuccess}>Success</button
                        >
                        <button
                            class="chip"
                            onclick={showError}>Error</button
                        >
                        <button
                            class="chip"
                            onclick={showWarning}>Warning</button
                        >
                        <button
                            class="chip"
                            onclick={showInfo}>Info</button
                        >
                        <button
                            class="chip"
                            onclick={showAction}>Action</button
                        >
                        <button
                            class="chip"
                            onclick={showIcon}>Icon</button
                        >
                    </div>
                </div>

                <div class="group">
                    <p>Ergonomic</p>
                    <div class="chips chips-actions">
                        <button
                            class="chip"
                            onclick={showShorthandTitle}>Shorthand</button
                        >
                        <button
                            class="chip"
                            onclick={showShorthandWithDescription}>Shorthand+</button
                        >
                        <button
                            class="chip"
                            onclick={showLoadingHelper}>Loading</button
                        >
                        <button
                            class="chip"
                            onclick={showScopedSuccess}>Scoped</button
                        >
                        <button
                            class="chip"
                            onclick={showScopedError}>Scoped Error</button
                        >
                        <button
                            class="chip"
                            onclick={showClassesPropExample}>Classes Prop</button
                        >
                        <button
                            class="chip"
                            onclick={showStylesPropExample}>Styles Prop</button
                        >
                    </div>
                </div>

                <div class="group">
                    <p>Promise</p>
                    <div class="chips chips-actions">
                        <button
                            class="chip"
                            onclick={showPromise}>Promise</button
                        >
                        <button
                            class="chip"
                            onclick={showPromiseError}>Promise Error</button
                        >
                    </div>
                </div>

                <div class="group">
                    <p>Advanced</p>
                    <div class="chips chips-actions">
                        <button
                            class="chip"
                            onclick={showWithButton}>Action->Promise</button
                        >
                        <button
                            class="chip"
                            onclick={showAdvancedDeployFlow}>Deploy Flow</button
                        >
                        <button
                            class="chip"
                            onclick={showAdvancedRetryFlow}>Retry Flow</button
                        >
                        <button
                            class="chip"
                            onclick={showAdvancedActionFlow}>Migration Flow</button
                        >
                    </div>

                    <div class="group chips">
                        <br />
                        <button
                            class="chip danger"
                            onclick={clearAll}>Clear</button
                        >
                    </div>
                </div>
            </div>
        </section>
    </div>
</main>

<style>
    :global(:root) {
        --page-bg: #f6f6f7;
        --page-fg: #0f1115;
        --surface-border: #e8e8eb;
        --brand-fg: #1f2329;
        --link-fg: #8a9099;
        --link-hover-fg: #5d6673;
        --hero-title-fg: #0b0d10;
        --hero-subtitle-fg: #949aa3;
        --divider: #e9eaed;
        --group-label-fg: #a0a6ae;
        --chip-border: #ececef;
        --chip-bg: #efeff1;
        --chip-fg: #8e939a;
        --chip-hover-bg: #ececef;
        --chip-hover-fg: #5f6570;
        --chip-active-bg: #101114;
        --chip-active-border: #101114;
        --chip-active-fg: #f7f8f9;
        --danger-fg: #9a5f63;
        --danger-hover-fg: #8f363d;
        --danger-hover-bg: #f1e5e7;
        --danger-hover-border: #ecd4d8;
    }

    :global(.dark) {
        --page-bg: #0e1014;
        --page-fg: #eef2f7;
        --surface-border: #222833;
        --brand-fg: #e5ebf3;
        --link-fg: #9aa6b8;
        --link-hover-fg: #d0d7e2;
        --hero-title-fg: #f5f8fc;
        --hero-subtitle-fg: #aab4c3;
        --divider: #252b36;
        --group-label-fg: #8692a4;
        --chip-border: #2b3340;
        --chip-bg: #171d26;
        --chip-fg: #a7b2c2;
        --chip-hover-bg: #1f2732;
        --chip-hover-fg: #d2d9e3;
        --chip-active-bg: #e8eef8;
        --chip-active-border: #e8eef8;
        --chip-active-fg: #0f1319;
        --danger-fg: #df9da5;
        --danger-hover-fg: #ffc6cd;
        --danger-hover-bg: #3a1f24;
        --danger-hover-border: #5a2f36;
    }

    :global(body) {
        margin: 0;
        background: var(--page-bg);
        color: var(--page-fg);
        font-family: 'Plus Jakarta Sans', 'Manrope', 'Avenir Next', 'Segoe UI', sans-serif;
        transition:
            background-color 180ms ease,
            color 180ms ease;
    }

    main {
        min-height: 100vh;
        padding: 1.5rem;
        box-sizing: border-box;
    }

    .page {
        margin: 0 auto;
        max-width: 920px;
        min-height: calc(100vh - 3rem);
        display: flex;
        flex-direction: column;
    }

    .topbar {
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--surface-border);
    }

    .brand {
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--brand-fg);
    }

    nav {
        display: flex;
        gap: 1.2rem;
    }

    nav a {
        color: var(--link-fg);
        text-decoration: none;
        font-size: 0.86rem;
        font-weight: 500;
    }

    nav a:hover {
        color: var(--link-hover-fg);
    }

    .theme-toggle {
        appearance: none;
        border: 1px solid var(--chip-border);
        background: var(--chip-bg);
        color: var(--chip-fg);
        border-radius: 999px;
        padding: 0.34rem 0.7rem;
        font-size: 0.75rem;
        font-weight: 700;
        line-height: 1;
        cursor: pointer;
        transition:
            color 120ms ease,
            background-color 120ms ease,
            border-color 120ms ease;
    }

    .theme-toggle:hover {
        color: var(--chip-hover-fg);
        background: var(--chip-hover-bg);
    }

    .hero {
        margin-top: 20vh;
        text-align: center;
    }

    h1 {
        margin: 0;
        font-size: clamp(2.1rem, 5vw, 3.6rem);
        line-height: 1;
        letter-spacing: -0.04em;
        color: var(--hero-title-fg);
    }

    .hero p {
        margin: 0.85rem 0 0;
        color: var(--hero-subtitle-fg);
        font-size: 1.02rem;
    }

    .controls {
        margin-top: auto;
        margin-bottom: 2rem;
    }

    .chips {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.55rem;
    }

    hr {
        border: 0;
        border-top: 1px solid var(--divider);
        margin: 1.3rem auto;
        max-width: 620px;
    }

    .chips-actions {
        max-width: 760px;
        margin: 0 auto;
    }

    .action-groups {
        display: grid;
        gap: 2rem;
    }

    .group {
        display: grid;
        gap: 0.38rem;
    }

    .group p {
        margin: 0;
        text-align: center;
        font-size: 0.73rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--group-label-fg);
    }

    .chip {
        appearance: none;
        border: 1px solid var(--chip-border);
        background: var(--chip-bg);
        color: var(--chip-fg);
        border-radius: 999px;
        padding: 0.5rem 0.82rem;
        font-size: 0.82rem;
        font-weight: 600;
        line-height: 1;
        cursor: pointer;
        transition:
            color 120ms ease,
            background-color 120ms ease,
            border-color 120ms ease;
    }

    .chip:hover {
        color: var(--chip-hover-fg);
        background: var(--chip-hover-bg);
    }

    .chip.active {
        background: var(--chip-active-bg);
        border-color: var(--chip-active-border);
        color: var(--chip-active-fg);
    }

    .chip.danger {
        color: var(--danger-fg);
    }

    .chip.danger:hover {
        color: var(--danger-hover-fg);
        background: var(--danger-hover-bg);
        border-color: var(--danger-hover-border);
    }

    :global(.styles-demo-title) {
        color: #0f172a;
        background: #fef08a;
        border-radius: 999px;
        padding: 0.15rem 0.4rem;
        text-transform: none;
        font-weight: 700;
    }

    :global(.styles-demo-description) {
        color: #0f172a;
        background: #dbeafe;
        border-radius: 0.75rem;
        border: 1px solid #bfdbfe;
    }

    :global(.styles-demo-button) {
        background: #111827;
        color: #ffffff;
    }

    :global(.styles-demo-button-hover:hover) {
        background: #374151;
    }

    @media (max-width: 700px) {
        main {
            padding: 0.9rem;
        }

        .page {
            min-height: calc(100vh - 1.8rem);
        }

        .topbar {
            height: 50px;
        }

        nav {
            gap: 0.8rem;
        }

        .hero {
            margin-top: 16vh;
        }

        .hero p {
            font-size: 0.92rem;
        }
    }
</style>
