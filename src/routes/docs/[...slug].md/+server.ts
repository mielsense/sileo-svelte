import { error } from '@sveltejs/kit';
import { getDoc } from '$lib/docs/source.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = ({ params }) => {
    const page = getDoc(params.slug);
    if (!page) error(404, 'Documentation page not found');
    return new Response(page.raw, {
        headers: { 'content-type': 'text/markdown; charset=utf-8' }
    });
};
