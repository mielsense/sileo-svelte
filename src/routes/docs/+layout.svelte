<script lang="ts">
    import { tick } from 'svelte';
    import { resolve } from '$app/paths';
    import { page } from '$app/state';
    import { navigation, type TocItem } from '$lib/docs/source.js';

    let { children } = $props();
    let leftRail: HTMLElement;
    let activeHeading = $state('');
    const toc = $derived((page.data.toc ?? []) as TocItem[]);
    const currentPath = $derived(page.url.pathname.replace(/\/$/, '') || '/docs');

    function docHref(path: string) {
        return path === '/docs'
            ? resolve('/docs')
            : resolve('/docs/[...slug]', { slug: path.replace(/^\/docs\//, '') });
    }

    $effect(() => {
        const path = currentPath;
        const items = toc;
        let cancelled = false;
        let cleanup = () => {};

        void tick().then(() => {
            if (cancelled || path !== currentPath) return;

            const activePage = leftRail?.querySelector<HTMLElement>('[aria-current="page"]');
            if (activePage && leftRail.scrollWidth > leftRail.clientWidth) {
                activePage.scrollIntoView({ block: 'nearest', inline: 'center' });
            }

            const headings = items
                .map((item) => document.getElementById(item.id))
                .filter((heading): heading is HTMLElement => heading !== null);
            if (headings.length === 0) {
                activeHeading = '';
                return;
            }

            const updateActiveHeading = () => {
                const readingLine = 120;
                activeHeading =
                    headings.findLast((heading) => heading.getBoundingClientRect().top <= readingLine)?.id ??
                    headings[0].id;
            };

            updateActiveHeading();
            window.addEventListener('scroll', updateActiveHeading, { passive: true });
            cleanup = () => window.removeEventListener('scroll', updateActiveHeading);
        });

        return () => {
            cancelled = true;
            cleanup();
        };
    });
</script>

<div class="docs-frame">
    <aside
        bind:this={leftRail}
        class="docs-left-rail"
        aria-label="Documentation navigation"
    >
        <div class="left-rail-sticky">
            <nav>
                <!-- eslint-disable svelte/no-navigation-without-resolve -->
                {#each navigation as section (section.title)}
                    <div class="nav-section">
                        <p>{section.title}</p>
                        {#each section.pages as item (item.slug)}
                            <a
                                href={docHref(item.path)}
                                aria-current={currentPath === item.path ? 'page' : undefined}
                            >
                                {item.metadata.label}
                            </a>
                        {/each}
                    </div>
                {/each}
                <!-- eslint-enable svelte/no-navigation-without-resolve -->
            </nav>

            <div class="rail-resources">
                <p>Resources</p>
                <a href={resolve('/playground')}>Playground</a>
                <a href={resolve('/llms.txt')}>llms.txt</a>
                <a href={resolve('/llms-full.txt')}>llms-full.txt</a>
            </div>
        </div>
    </aside>

    <div class="docs-content">{@render children()}</div>

    <aside
        class="docs-right-rail"
        aria-label="On this page"
    >
        <div class="toc-sticky">
            <p>On this page</p>
            <nav>
                {#each toc as item (item.id)}
                    <a
                        class:toc-child={item.level === 3}
                        aria-current={activeHeading === item.id ? 'location' : undefined}
                        onclick={() => (activeHeading = item.id)}
                        href={`#${item.id}`}>{item.title}</a
                    >
                {/each}
            </nav>
            <a
                class="rail-edit-link"
                href="https://github.com/mielsense/sileo-svelte/tree/main/content/docs"
            >
                Edit this page <span aria-hidden="true">↗</span>
            </a>
        </div>
    </aside>
</div>
