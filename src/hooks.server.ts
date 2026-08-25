import { getDoc } from '$lib/docs/source.js';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const acceptsMarkdown = event.request.headers.get('accept')?.includes('text/markdown');
    const isDocsPage = event.url.pathname === '/docs' || event.url.pathname.startsWith('/docs/');
    const isRawRoute = event.url.pathname.endsWith('.md');

    if (acceptsMarkdown && isDocsPage && !isRawRoute) {
        const slug = event.url.pathname === '/docs' ? 'index' : event.url.pathname.slice('/docs/'.length);
        const page = getDoc(slug);
        if (page) {
            return new Response(page.raw, {
                headers: {
                    'content-type': 'text/markdown; charset=utf-8',
                    vary: 'accept'
                }
            });
        }
    }

    const response = await resolve(event);
    if (isDocsPage) response.headers.append('vary', 'accept');
    return response;
};
