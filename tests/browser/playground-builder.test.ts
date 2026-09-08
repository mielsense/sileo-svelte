import { expect, test } from '@playwright/test';
import { compile } from 'svelte/compiler';

test('builds, updates, stacks and clears real toasts with usable source', async ({ page }) => {
    await page.goto('/playground');
    await expect(page.locator('[data-playground-ready]')).toHaveAttribute('data-playground-ready', 'true');
    await page.getByText('More options', { exact: true }).click();
    await page.getByRole('spinbutton', { name: 'Duration, ms' }).fill('0');
    await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Saved </script> safely');
    await page.getByRole('textbox', { name: 'Action label' }).fill('Done');
    await page.getByRole('button', { name: 'Show toast', exact: true }).click();
    const toasts = page.locator('[data-builder-preview] [data-sileo-toast]');
    await expect(toasts).toHaveCount(1);
    await expect(toasts.first()).toContainText('Saved </script> safely');
    await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Updated title');
    await page.getByRole('button', { name: 'Update last', exact: true }).click();
    await expect(toasts).toHaveCount(1);
    await expect(toasts.first()).toContainText('Updated title');
    await page.getByRole('button', { name: 'Show toast', exact: true }).click();
    await expect(toasts).toHaveCount(2);
    await page.getByRole('button', { name: 'Code', exact: true }).click();
    const source = await page.locator('.source-panel code').innerText();
    expect(() => compile(source, { generate: 'client' })).not.toThrow();
    expect(source).toContain('sileo.success(');
    expect(source).toContain('onClick: (id) => sileo.dismiss(id)');
    await page.getByRole('button', { name: 'Clear all', exact: true }).click();
    await expect(toasts).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Update last', exact: true })).toBeDisabled();
});

test('keeps navigation and builder inside a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto('/playground');
    await expect(page.locator('[data-playground-ready]')).toHaveAttribute('data-playground-ready', 'true');
    await expect(page.getByRole('link', { name: 'Docs', exact: true })).toBeVisible();
    await page.getByRole('combobox', { name: 'State', exact: true }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('combobox', { name: 'State', exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('options disclosure settles after interruption and respects reduced motion', async ({ page }) => {
    await page.goto('/playground');
    await expect(page.locator('[data-playground-ready]')).toHaveAttribute('data-playground-ready', 'true');
    const trigger = page.getByRole('button', { name: 'More options', exact: true });
    const panel = page.locator('.disclosure-panel');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await trigger.click();
    await expect(panel).toHaveCSS('height', '0px');
    await expect(panel).toHaveAttribute('inert', '');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await trigger.click();
    await expect(page.getByRole('spinbutton', { name: 'Duration, ms' })).toBeVisible();
    await trigger.click();
    await expect(panel).toHaveCSS('height', '0px');
});
