import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import InstallCommand from '../src/routes/_components/InstallCommand.svelte';

beforeEach(() => localStorage.clear());
afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
});

test('copies the selected package manager command and remembers the choice', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const first = render(InstallCommand);

    for (const [manager, command] of [
        ['npm', 'npm install sileo-svelte'],
        ['pnpm', 'pnpm add sileo-svelte'],
        ['bun', 'bun add sileo-svelte'],
        ['yarn', 'yarn add sileo-svelte']
    ]) {
        await fireEvent.click(first.getByRole('button', { name: manager }));
        expect(first.getByRole('button', { name: manager }).getAttribute('aria-pressed')).toBe('true');
        expect(first.container.querySelector('pre code')?.textContent).toBe(command);
        await fireEvent.click(first.getByRole('button', { name: `Copy ${manager} code` }));
        expect(writeText).toHaveBeenLastCalledWith(command);
    }

    cleanup();
    const next = render(InstallCommand);
    await tick();
    expect(next.getByRole('button', { name: 'yarn' }).getAttribute('aria-pressed')).toBe('true');
    expect(next.container.querySelector('pre code')?.textContent).toBe('yarn add sileo-svelte');
});

test('preserves the requested version when changing package managers', async () => {
    const { container, getByRole } = render(InstallCommand, { packageName: 'sileo-svelte@^0.2.0' });
    await fireEvent.click(getByRole('button', { name: 'pnpm' }));
    expect(container.querySelector('pre code')?.textContent).toBe('pnpm add sileo-svelte@^0.2.0');
});
