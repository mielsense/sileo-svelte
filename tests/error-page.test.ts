import { cleanup, render } from '@testing-library/svelte';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('$app/state', () => ({
    page: {
        status: 404,
        url: new URL('https://sileo.test/missing')
    }
}));

import ErrorPage from '../src/routes/+error.svelte';

afterEach(() => cleanup());

test('renders the branded 404 and a resolved return route', () => {
    const { getByRole, getByText } = render(ErrorPage);

    expect(getByRole('heading', { name: 'Page not found' })).toBeTruthy();
    expect(getByText('404')).toBeTruthy();
    expect(getByRole('link', { name: 'Back to playground' }).getAttribute('href')).toContain('#playground');
});
