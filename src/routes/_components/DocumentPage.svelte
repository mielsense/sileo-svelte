<script lang="ts">
    import { Button } from '$docs/components/ui/button/index.js';
    import { mount, tick, unmount } from 'svelte';
    import Copy01Icon from '@hugeicons/core-free-icons/Copy01Icon';
    import ArrowUpRight01Icon from '@hugeicons/core-free-icons/ArrowUpRight01Icon';
    import HugeiconsIcon from '$docs/hugeicons-icon.svelte';
    import CodeCopyButton from './CodeCopyButton.svelte';
    import { enhanceInstallCommand } from './enhance-install-command.js';
    import { resolve } from '$app/paths';
    import { getDoc, headingId } from '$docs/source.js';
    import type { DocPageData } from '$docs/types.js';
    import { PACKAGE_VERSION } from '../../version.js';

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

            const cleanupInstallCommand = enhanceInstallCommand(block);
            if (cleanupInstallCommand) {
                cleanups.push(cleanupInstallCommand);
                continue;
            }

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
            const actions = document.createElement('div');
            toolbar.append(label, actions);
            frame.insertBefore(toolbar, block);
            const copyButton = mount(CodeCopyButton, {
                target: actions,
                props: { value: code?.textContent ?? '', language }
            });
            cleanups.push(() => void unmount(copyButton));
        }

        return () => cleanups.forEach((cleanup) => cleanup());
    }

    $effect(() => {
        const slug = data.slug;
        let cancelled = false;
        let cleanup = () => {};
        void tick().then(() => {
            if (cancelled || slug !== data.slug) return;
            cleanup = enhanceArticle();
        });
        return () => {
            cancelled = true;
            cleanup();
        };
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
        <div class="doc-kicker">
            <span>Documentation</span><span aria-hidden="true">/</span><span>v{PACKAGE_VERSION}</span>
        </div>
        <h1>{data.metadata.title}</h1>
        <p>{data.metadata.description}</p>
        <div class="doc-actions">
            <Button
                variant="outline"
                type="button"
                onclick={copyPage}
            >
                <HugeiconsIcon
                    icon={Copy01Icon}
                    size={16}
                    aria-hidden="true"
                />
                Copy Markdown
            </Button>
            <!-- eslint-disable svelte/no-navigation-without-resolve -->
            <Button
                variant="outline"
                href={markdownHref}
                data-sveltekit-reload
                >View as Markdown<HugeiconsIcon
                    icon={ArrowUpRight01Icon}
                    size={16}
                    aria-hidden="true"
                /></Button
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
