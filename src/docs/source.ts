import type { Component } from 'svelte';
import metaSource from '../../content/docs/meta.json?raw';

interface MarkdownModule {
    default: Component;
}

export interface TocItem {
    id: string;
    title: string;
    level: 2 | 3;
}

export interface DocMetadata {
    title: string;
    description: string;
    label: string;
}

export interface DocPage {
    slug: string;
    path: string;
    raw: string;
    body: string;
    metadata: DocMetadata;
    toc: TocItem[];
    component: Component;
}

export interface DocNavigationSection {
    title: string;
    pages: DocPage[];
}

const meta = JSON.parse(metaSource) as { sections: Array<{ title: string; pages: string[] }> };

const compiledModules = import.meta.glob<MarkdownModule>('../../content/docs/*.md', {
    eager: true
});

const rawModules = import.meta.glob<string>('../../content/docs/*.md', {
    eager: true,
    import: 'default',
    query: '?raw'
});

function slugFromPath(path: string): string {
    return path.split('/').at(-1)?.replace(/\.md$/, '') ?? '';
}

export function headingId(value: string): string {
    return value
        .toLowerCase()
        .replace(/`([^`]+)`/g, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function readFrontmatter(raw: string): { metadata: DocMetadata; body: string } {
    const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
    const values: Record<string, string> = {};

    if (match) {
        for (const line of match[1].split('\n')) {
            const separator = line.indexOf(':');
            if (separator === -1) continue;
            const key = line.slice(0, separator).trim();
            const value = line
                .slice(separator + 1)
                .trim()
                .replace(/^['"]|['"]$/g, '');
            values[key] = value;
        }
    }

    return {
        metadata: {
            title: values.title ?? 'Untitled',
            description: values.description ?? '',
            label: values.label ?? values.title ?? 'Untitled'
        },
        body: match ? raw.slice(match[0].length) : raw
    };
}

function buildToc(body: string): TocItem[] {
    const items: TocItem[] = [];
    let inFence = false;

    for (const line of body.split('\n')) {
        if (line.startsWith('```')) {
            inFence = !inFence;
            continue;
        }
        if (inFence) continue;

        const match = line.match(/^(##|###)\s+(.+)$/);
        if (!match) continue;
        const title = match[2].replace(/`/g, '').trim();
        items.push({ id: headingId(title), title, level: match[1].length as 2 | 3 });
    }

    return items;
}

const pages = Object.entries(compiledModules)
    .map(([path, module]) => {
        const slug = slugFromPath(path);
        const rawEntry = Object.entries(rawModules).find(([rawPath]) => slugFromPath(rawPath) === slug);
        const raw = rawEntry?.[1] ?? '';
        const { metadata, body } = readFrontmatter(raw);
        return {
            slug,
            path: slug === 'index' ? '/docs' : `/docs/${slug}`,
            raw,
            body,
            metadata,
            toc: buildToc(body),
            component: module.default
        } satisfies DocPage;
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));

export const navigation: DocNavigationSection[] = meta.sections.map((section) => ({
    title: section.title,
    pages: section.pages.map((slug) => pages.find((page) => page.slug === slug)).filter((page) => page !== undefined)
}));

export const orderedPages = navigation.flatMap((section) => section.pages);

export function getDoc(slug = 'index'): DocPage | undefined {
    return pages.find((page) => page.slug === (slug || 'index'));
}

export function getNeighbours(slug: string): { previous?: DocPage; next?: DocPage } {
    const index = orderedPages.findIndex((page) => page.slug === slug);
    return {
        previous: index > 0 ? orderedPages[index - 1] : undefined,
        next: index >= 0 && index < orderedPages.length - 1 ? orderedPages[index + 1] : undefined
    };
}

export function serializeDoc(page: DocPage) {
    const neighbours = getNeighbours(page.slug);
    return {
        slug: page.slug,
        path: page.path,
        raw: page.raw,
        metadata: page.metadata,
        toc: page.toc,
        previous: neighbours.previous
            ? { path: neighbours.previous.path, label: neighbours.previous.metadata.label }
            : undefined,
        next: neighbours.next ? { path: neighbours.next.path, label: neighbours.next.metadata.label } : undefined
    };
}
