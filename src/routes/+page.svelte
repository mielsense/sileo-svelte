<script lang="ts">
    import { sileo } from '$lib/index.js';

    function showSuccess() {
        sileo.success({
            title: 'Success',
            description: 'Your changes have been saved successfully.'
        });
    }

    function showError() {
        sileo.error({
            title: 'Error',
            description: 'Something went wrong. Please try again.'
        });
    }

    function showWarning() {
        sileo.warning({
            title: 'Warning',
            description: 'This action cannot be undone.'
        });
    }

    function showInfo() {
        sileo.info({
            title: 'Info',
            description: 'A new version is available for download.'
        });
    }

    function showAction() {
        sileo.action({
            title: 'Action',
            description: 'Would you like to proceed with this operation?',
            button: {
                title: 'Confirm',
                onClick: (id) => {
                    sileo.update(id, { title: 'Confirmed', description: 'Action was confirmed!', state: 'success' });
                }
            }
        });
    }

    function showPromise() {
        const fakeRequest = () =>
            new Promise<{ name: string }>((resolve) => setTimeout(() => resolve({ name: 'Sileo' }), 2000));

        sileo.promise(fakeRequest, {
            loading: { title: 'Loading' },
            success: (data) => ({
                title: 'Success',
                description: `Loaded "${data.name}" successfully!`
            }),
            error: () => ({
                title: 'Error',
                description: 'Failed to load data.'
            })
        });
    }

    function showPromiseError() {
        const fakeRequest = () =>
            new Promise<string>((_resolve, reject) => setTimeout(() => reject(new Error('Network error')), 2000));

        sileo.promise(fakeRequest, {
            loading: { title: 'Uploading' },
            success: () => ({
                title: 'Uploaded',
                description: 'File uploaded successfully!'
            }),
            error: (err) => ({
                title: 'Upload Failed',
                description: err instanceof Error ? err.message : 'Unknown error occurred.'
            })
        });
    }

    function showWithButton() {
        sileo.action({
            title: 'Update Available',
            description: 'Version 2.0 is ready to install.',
            button: {
                title: 'Install Now',
                onClick: (id) => {
                    sileo.promise(() => new Promise((r) => setTimeout(r, 1500)), {
                        id,
                        loading: { title: 'Installing' },
                        success: () => ({
                            title: 'Installed',
                            description: 'Successfully updated to v2.0!'
                        }),
                        error: () => ({
                            title: 'Failed',
                            description: 'Installation failed.'
                        })
                    });
                }
            }
        });
    }

    function showCustomFill() {
        sileo.success({
            title: 'Custom Fill',
            description: 'This toast has a dark background.',
            fill: '#1a1a2e'
        });
    }

    function showCustomRoundness() {
        sileo.info({
            title: 'Square-ish',
            description: 'This toast has reduced roundness.',
            roundness: 6
        });
    }

    function showNoAutopilot() {
        sileo.warning({
            title: 'Manual Only',
            description: 'This toast will not auto-expand. Hover to see content.',
            autopilot: false
        });
    }

    function showCustomDescription() {
        sileo.warning({
            title: 'Bottom Center',
            description: customDescription,
            position: 'bottom-center'
        });
    }

    function showShortDuration() {
        sileo.success({
            title: 'Quick',
            description: 'This toast disappears in 2 seconds.',
            duration: 2000
        });
    }

    function showLongDuration() {
        sileo.info({
            title: 'Sticky',
            description:
                'This toast sticks around for 15 seconds. And it has a really really long text to test something out',
            duration: 15000
        });
    }

    function showPersistent() {
        sileo.warning({
            title: 'Persistent',
            description: 'This toast stays until you swipe it away.',
            duration: null
        });
    }

    function showBottomLeft() {
        sileo.success({
            title: 'Bottom Right',
            description: 'This toast appears in the bottom left.',
            position: 'bottom-right'
        });
    }

    function showTopCenter() {
        sileo.info({
            title: 'Top Center',
            description: 'This toast appears at the top center.',
            position: 'top-center'
        });
    }

    function showBottomCenter() {
        sileo.warning({
            title: 'Bottom Center',
            description: 'This toast appears at the bottom center.',
            position: 'bottom-center'
        });
    }

    function clearAll() {
        sileo.clear();
    }
</script>

<svelte:head>
    <title>Sileo — Svelte 5 Toast Demo</title>
</svelte:head>

{#snippet customDescription()}
    this is a custom description
{/snippet}}

<main>
    <div class="container">
        <div class="hero">
            <h1>Sileo</h1>
            <p class="subtitle">Physics-based toast notifications for Svelte 5</p>
        </div>

        <section class="section">
            <h2>Toast Types</h2>
            <div class="grid">
                <button
                    class="btn btn-success"
                    onclick={showSuccess}>Success</button
                >
                <button
                    class="btn btn-error"
                    onclick={showError}>Error</button
                >
                <button
                    class="btn btn-warning"
                    onclick={showWarning}>Warning</button
                >
                <button
                    class="btn btn-info"
                    onclick={showInfo}>Info</button
                >
                <button
                    class="btn btn-action"
                    onclick={showAction}>Action</button
                >
            </div>
        </section>

        <section class="section">
            <h2>Promise</h2>
            <div class="grid">
                <button
                    class="btn btn-promise"
                    onclick={showPromise}>Promise (Success)</button
                >
                <button
                    class="btn btn-promise"
                    onclick={showPromiseError}>Promise (Error)</button
                >
            </div>
        </section>

        <section class="section">
            <h2>With Button</h2>
            <div class="grid">
                <button
                    class="btn btn-info"
                    onclick={showWithButton}>Update Available</button
                >
            </div>
        </section>

        <section class="section">
            <h2>Customization</h2>
            <div class="grid">
                <button
                    class="btn btn-custom"
                    onclick={showCustomFill}>Custom Fill</button
                >
                <button
                    class="btn btn-custom"
                    onclick={showCustomRoundness}>Custom Roundness</button
                >
                <button
                    class="btn btn-custom"
                    onclick={showNoAutopilot}>No Autopilot</button
                >

                <button
                    class="btn btn-custom"
                    onclick={showCustomDescription}>Custom description</button
                >
            </div>
        </section>

        <section class="section">
            <h2>Duration</h2>
            <div class="grid">
                <button
                    class="btn btn-custom"
                    onclick={showShortDuration}>2s Duration</button
                >
                <button
                    class="btn btn-custom"
                    onclick={showLongDuration}>15s Duration</button
                >
                <button
                    class="btn btn-custom"
                    onclick={showPersistent}>Persistent (∞)</button
                >
            </div>
        </section>

        <section class="section">
            <h2>Positions</h2>
            <div class="grid">
                <button
                    class="btn btn-position"
                    onclick={showBottomLeft}>Bottom Right</button
                >
                <button
                    class="btn btn-position"
                    onclick={showTopCenter}>Top Center</button
                >
                <button
                    class="btn btn-position"
                    onclick={showBottomCenter}>Bottom Center</button
                >
            </div>
        </section>

        <section class="section">
            <button
                class="btn btn-clear"
                onclick={clearAll}>Clear All Toasts</button
            >
        </section>
    </div>
</main>

<style>
    :global(body) {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #ffffff;
        color: #1a1a1a;
        min-height: 100vh;
    }

    main {
        display: flex;
        justify-content: center;
        padding: 3rem 1.5rem;
    }

    .container {
        max-width: 600px;
        width: 100%;
    }

    .hero {
        text-align: center;
        margin-bottom: 3rem;
    }

    h1 {
        font-size: 3rem;
        font-weight: 700;
        margin: 0 0 0.5rem;
        background: linear-gradient(135deg, #7c3aed, #2563eb, #059669);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .subtitle {
        color: #666;
        font-size: 1.1rem;
        margin: 0;
    }

    .section {
        margin-bottom: 2rem;
    }

    h2 {
        font-size: 1rem;
        font-weight: 500;
        color: #999;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0 0 0.75rem;
    }

    .grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .btn {
        padding: 0.6rem 1.25rem;
        border: 1px solid #ddd;
        border-radius: 10px;
        background: #f5f5f5;
        color: #1a1a1a;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition:
            background 150ms ease,
            border-color 150ms ease,
            transform 100ms ease;
    }

    .btn:hover {
        background: #eaeaea;
        border-color: #bbb;
    }

    .btn:active {
        transform: scale(0.97);
    }

    .btn-success:hover {
        border-color: oklch(0.723 0.219 142.136);
    }

    .btn-error:hover {
        border-color: oklch(0.637 0.237 25.331);
    }

    .btn-warning:hover {
        border-color: oklch(0.795 0.184 86.047);
    }

    .btn-info:hover {
        border-color: oklch(0.685 0.169 237.323);
    }

    .btn-action:hover {
        border-color: oklch(0.623 0.214 259.815);
    }

    .btn-promise:hover {
        border-color: #a78bfa;
    }

    .btn-custom:hover {
        border-color: #f472b6;
    }

    .btn-position:hover {
        border-color: #fbbf24;
    }

    .btn-clear {
        width: 100%;
        background: #fafafa;
        border-color: #ccc;
        color: #888;
    }

    .btn-clear:hover {
        background: #fef2f2;
        border-color: #ef4444;
        color: #ef4444;
    }
</style>
