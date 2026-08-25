import { orderedPages } from '$docs/source.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = () => {
    const content = orderedPages
        .map((page) => `<!-- Source: ${page.path}.md -->\n\n${page.raw.trim()}`)
        .join('\n\n---\n\n');

    return new Response(`# Sileo Svelte complete documentation\n\n${content}\n`, {
        headers: { 'content-type': 'text/plain; charset=utf-8' }
    });
};
