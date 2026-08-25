<script lang="ts">
    import { tick } from 'svelte';
    import { resolve } from '$app/paths';
    import { getDoc, headingId } from '$lib/docs/source.js';
    import type { DocPageData } from '$lib/docs/types.js';

    let { data }: { data: DocPageData } = $props();
    let article: HTMLElement;
    let copyStatus = $state('');
    let doc = $derived(getDoc(data.slug));
    let Content = $derived(doc?.component);
    let markdownHref = $derived(
        data.slug === 'index' ? resolve('/docs.md') : resolve('/docs/[...slug].md', { slug: data.slug })
    );

    function docHref(path: string) {
        return path === '/docs'
            ? resolve('/docs')
            : resolve('/docs/[...slug]', { slug: path.replace(/^\/docs\//, '') });
    }

    async function copyText(value: string): Promise<boolean> {
        try {
            await navigator.clipboard.writeText(value);
            return true;
        } catch {
            return false;
        }
    }

    async function copyPage() {
        copyStatus = (await copyText(data.raw)) ? 'Markdown copied' : 'Could not copy Markdown';
    }

    function enhanceArticle() {
        if (!article) return () => {};
        const cleanups: Array<() => void> = [];

        for (const heading of article.querySelectorAll<HTMLElement>('h2, h3')) {
            heading.id = headingId(heading.textContent ?? '');
        }

        for (const block of article.querySelectorAll<HTMLPreElement>('pre')) {
            if (block.parentElement?.classList.contains('code-frame')) continue;

            const frame = document.createElement('div');
            frame.className = 'code-frame';
            block.parentNode?.insertBefore(frame, block);
            frame.appendChild(block);

            const code = block.querySelector('code');
            const languageClass = [...(code?.classList ?? [])].find((name) => name.startsWith('language-'));
            const language = block.dataset.language ?? languageClass?.replace('language-', '') ?? 'text';
            const toolbar = document.createElement('div');
            toolbar.className = 'code-toolbar';
            const label = document.createElement('span');
            label.textContent = language;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'code-copy-button';
            button.textContent = 'Copy';
            button.setAttribute('aria-label', `Copy ${language} code`);
            toolbar.append(label, button);
            frame.insertBefore(toolbar, block);

            const handleCopy = async () => {
                const copied = await copyText(code?.textContent ?? '');
                button.textContent = copied ? 'Copied' : 'Copy failed';
                window.setTimeout(() => (button.textContent = 'Copy'), 1600);
            };
            button.addEventListener('click', handleCopy);
            cleanups.push(() => button.removeEventListener('click', handleCopy));
        }

        return () => cleanups.forEach((cleanup) => cleanup());
    }

    $effect(() => {
        const slug = data.slug;
        let cleanup = () => {};
        void tick().then(() => {
            if (slug !== data.slug) return;
            cleanup = enhanceArticle();
        });
        return () => cleanup();
    });
</script>

<svelte:head>
    <title>{data.metadata.title} · Sileo Svelte</title>
    <meta
        name="description"
        content={data.metadata.description}
    />
    <link
        rel="alternate"
        type="text/markdown"
        href={markdownHref}
    />
</svelte:head>

<main
    id="main-content"
    class="doc-main"
>
    <header class="doc-header">
        <div class="doc-kicker"><span>Documentation</span><span aria-hidden="true">/</span><span>v0.1.1</span></div>
        <h1>{data.metadata.title}</h1>
        <p>{data.metadata.description}</p>
        <div class="doc-actions">
            <button
                class="primary-action"
                type="button"
                onclick={copyPage}
            >
                <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                >
                    <rect
                        x="5.25"
                        y="5.25"
                        width="7"
                        height="7"
                        rx="1.5"
                    />
                    <path
                        d="M3.75 10.75h-.5a1.5 1.5 0 0 1-1.5-1.5v-6a1.5 1.5 0 0 1 1.5-1.5h6a1.5 1.5 0 0 1 1.5 1.5v.5"
                    />
                </svg>
                Copy Markdown
            </button>
            <!-- eslint-disable svelte/no-navigation-without-resolve -->
            <a
                class="secondary-action"
                href={markdownHref}>View as Markdown</a
            >
            <!-- eslint-enable svelte/no-navigation-without-resolve -->
        </div>
        <p
            class="copy-status"
            aria-live="polite"
        >
            {copyStatus}
        </p>
    </header>

    <article
        class="markdown-body"
        bind:this={article}
    >
        {#if Content}<Content />{/if}
    </article>

    <nav
        class="doc-pagination"
        aria-label="Documentation pagination"
    >
        <!-- eslint-disable svelte/no-navigation-without-resolve -->
        {#if data.previous}
            <a
                class="previous"
                href={docHref(data.previous.path)}><span>Previous</span><strong>{data.previous.label}</strong></a
            >
        {:else}
            <span></span>
        {/if}
        {#if data.next}
            <a
                class="next"
                href={docHref(data.next.path)}><span>Next</span><strong>{data.next.label}</strong></a
            >
        {/if}
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </nav>
</main>
