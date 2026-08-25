import { getDoc } from '$docs/source.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = () => {
    const page = getDoc('index');
    return new Response(page?.raw ?? '', {
        headers: { 'content-type': 'text/markdown; charset=utf-8' }
    });
};
