import { cleanup, render } from '@testing-library/svelte';
import { afterEach, expect, test, vi } from 'vitest';
import ErrorPage from '../src/routes/+error.svelte';

vi.mock('$app/state', () => ({ page: { status: 404 } }));

afterEach(cleanup);

test('renders the 404 with routes back to the docs and playground', () => {
    const { getByRole, getByText } = render(ErrorPage);
    expect(getByRole('heading', { name: 'Page not found' })).toBeTruthy();
    expect(getByText('Error 404')).toBeTruthy();
    expect(getByRole('link', { name: 'Open documentation' }).getAttribute('href')).toBe('/docs');
    expect(getByRole('link', { name: 'Open playground' }).getAttribute('href')).toBe('/playground');
});
