import { error } from '@sveltejs/kit';
import { getDoc, serializeDoc } from '$docs/source.js';
import type { PageLoad } from './$types.js';

export const load: PageLoad = ({ params }) => {
    const page = getDoc(params.slug);
    if (!page) error(404, 'Documentation page not found');
    return serializeDoc(page);
};
