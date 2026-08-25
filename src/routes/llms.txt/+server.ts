import { orderedPages } from '$docs/source.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = ({ url }) => {
    const lines = [
        '# Sileo Svelte',
        '',
        '> Physics-based toast notifications for Svelte 5.',
        '',
        'Sileo Svelte provides typed notification helpers, promise flows, actions, rich snippets, and six viewport positions.',
        '',
        '## Documentation',
        '',
        ...orderedPages.map(
            (page) => `- [${page.metadata.title}](${url.origin}${page.path}.md): ${page.metadata.description}`
        ),
        '',
        '## Full reference',
        '',
        `- [Complete documentation](${url.origin}/llms-full.txt)`,
        `- [Source repository](https://github.com/mielsense/sileo-svelte)`
    ];

    return new Response(lines.join('\n'), {
        headers: { 'content-type': 'text/plain; charset=utf-8' }
    });
};
