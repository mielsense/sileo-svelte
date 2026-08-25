import type { TocItem } from './source.js';

export interface DocPageData {
    slug: string;
    path: string;
    raw: string;
    metadata: {
        title: string;
        description: string;
        label: string;
    };
    toc: TocItem[];
    previous?: { path: string; label: string };
    next?: { path: string; label: string };
}
