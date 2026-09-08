import { expect, test } from '@playwright/test';

async function openPlayground(page: import('@playwright/test').Page) {
    await page.goto('/playground');
    await expect(page.locator('[data-playground-ready]')).toHaveAttribute('data-playground-ready', 'true');
    await page.getByRole('button', { name: 'Examples', exact: true }).click();
    await expect(page.locator('[data-playground-preview] [data-sileo-toast]')).toHaveAttribute('data-ready', 'true');
}

test('keeps state text visible while action and success headers morph', async ({ page }) => {
    await openPlayground(page);
    const scenarios = page.getByRole('complementary', { name: 'Notification scenarios' });
    await scenarios.getByRole('combobox', { name: 'Example', exact: true }).click();
    await page.getByRole('option', { name: 'Action and retry', exact: true }).click();

    const preview = page.locator('[data-playground-preview]');
    await expect(preview.getByText('Payment needs attention')).toBeVisible();
    const retry = preview.getByRole('button', { name: 'Retry' });
    await expect(retry).toBeVisible();
    await retry.dispatchEvent('click');

    for (let sample = 0; sample < 50; sample += 1) {
        // Query and sample in one browser task so a keyed header cannot detach between calls.
        const frame = await preview.evaluate((node) => {
            const layers = [...node.querySelectorAll('[data-sileo-header-inner]')];
            return {
                opacity: layers.reduce(
                    (total, layer) => total + Number.parseFloat(getComputedStyle(layer).opacity || '0'),
                    0
                ),
                text: layers.map((layer) => layer.textContent?.trim() ?? '').join(' ')
            };
        });
        expect(frame.opacity).toBeGreaterThan(0.25);
        expect(frame.text.trim().length).toBeGreaterThan(0);
        await page.waitForTimeout(32);
    }

    await expect(preview.getByText('Payment captured')).toBeVisible({ timeout: 2_500 });
    await expect(preview.locator('[data-sileo-header-inner][data-layer="current"]')).toHaveCount(1);

    await page.getByRole('link', { name: 'Docs', exact: true }).click();
    await expect(page.locator('[data-sileo-viewport] [data-sileo-toast]')).toHaveCount(0);
});

test('settles rapid shape interruptions on the latest scenario without invalid geometry', async ({ page }) => {
    await openPlayground(page);
    const scenarios = page.getByRole('complementary', { name: 'Notification scenarios' });

    for (const name of ['Async promise', 'Scoped defaults', 'Custom styles']) {
        await scenarios.getByRole('combobox', { name: 'Example', exact: true }).click();
        await page.getByRole('option', { name, exact: true }).click();
    }

    const preview = page.locator('[data-playground-preview]');
    await expect(preview.getByText('Custom surface')).toBeVisible({ timeout: 1_500 });
    await expect(preview.locator('[data-sileo-toast]')).toHaveAttribute('data-state', 'action');

    const geometry = await preview.locator('[data-sileo-pill]').evaluate((pill) => {
        const bounds = pill.getBoundingClientRect();
        return { x: bounds.x, width: bounds.width, height: bounds.height };
    });
    expect(Number.isFinite(geometry.x)).toBe(true);
    expect(geometry.width).toBeGreaterThan(0);
    expect(geometry.height).toBeGreaterThan(0);
});

test('keeps the homepage inside one viewport and the docs resource rail pinned', async ({ page }) => {
    await page.goto('/');
    const viewportFit = await page.evaluate(() => ({
        height: innerHeight,
        scrollHeight: document.documentElement.scrollHeight
    }));
    expect(viewportFit.scrollHeight).toBeLessThanOrEqual(viewportFit.height + 1);

    await page.goto('/docs');
    const rail = page.locator('.left-rail-sticky');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const after = await rail.boundingBox();
    expect(after).not.toBeNull();
    expect(after?.y).toBeGreaterThanOrEqual(88);
    expect(after?.y).toBeLessThanOrEqual(120);
    expect((after?.y ?? 0) + (after?.height ?? 0)).toBeLessThanOrEqual(await page.evaluate(() => innerHeight));
});

test('updates example code and preview placement from the position control', async ({ page }) => {
    await openPlayground(page);
    await page.getByRole('combobox', { name: 'Position', exact: true }).click();
    await page.getByRole('option', { name: 'Bottom left', exact: true }).click();
    await page.getByRole('button', { name: 'Code', exact: true }).click();
    await expect(page.locator('[data-scenario-source]')).toContainText("const position = 'bottom-left'");
    await expect(page.locator('[data-playground-preview]')).toBeHidden();
    await page.getByRole('button', { name: 'Run example', exact: true }).click();
    await expect(page.locator('[data-playground-preview]')).toBeVisible();
    await expect(page.locator('[data-playground-preview]')).toHaveClass(/at-bottom/);
    await expect(page.locator('[data-playground-preview]')).toHaveClass(/at-left/);
});

test('an explicit update interrupts exit without an old completion removing it', async ({ page }) => {
    await page.goto('/docs');
    await page.evaluate(async () => {
        const modulePath = '/src/lib/store.svelte.ts';
        const { sileo } = await import(/* @vite-ignore */ modulePath);
        sileo.clear();
        const id = sileo.success({ title: 'Before exit', duration: null });
        await new Promise((resolve) => setTimeout(resolve, 650));
        sileo.dismiss(id);
        await new Promise((resolve) => setTimeout(resolve, 70));
        sileo.update(id, { title: 'Updated during exit', duration: null });
    });
    const toast = page.locator('[data-sileo-viewport] [data-sileo-toast]');
    await expect(toast).toContainText('Updated during exit');
    await expect(toast).toHaveCSS('opacity', '1');
    await page.waitForTimeout(650);
    await expect(toast).toBeVisible();
});

test('closing during a pending content update completes the lifecycle', async ({ page }) => {
    await page.goto('/docs');
    const id = await page.evaluate(async () => {
        const modulePath = '/src/lib/store.svelte.ts';
        const { sileo } = await import(/* @vite-ignore */ modulePath);
        return sileo.success({ title: 'Expanded toast', description: 'Details', duration: 10000 });
    });
    const toast = page.locator('[data-sileo-viewport] [data-sileo-toast]');
    await expect(toast).toHaveAttribute('data-expanded', 'true');
    await page.evaluate(async (id) => {
        const modulePath = '/src/lib/store.svelte.ts';
        const { sileo } = await import(/* @vite-ignore */ modulePath);
        sileo.update(id, { title: 'Pending title', description: 'Updated details' });
        await new Promise((resolve) => setTimeout(resolve, 70));
        sileo.close(id);
    }, id);
    await expect(toast).toHaveCount(0);
});

test('stops an existing loader when reduced motion is enabled', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openPlayground(page);
    await page.getByRole('combobox', { name: 'Example', exact: true }).click();
    await page.getByRole('option', { name: 'Async promise', exact: true }).click();
    const loader = page.locator('[data-playground-preview] [data-layer="current"] [data-sileo-icon="spin"]');
    await expect(loader).toBeVisible();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(100);
    const before = await loader.evaluate((node) => getComputedStyle(node).transform);
    await page.waitForTimeout(150);
    expect(await loader.evaluate((node) => getComputedStyle(node).transform)).toBe(before);
});
