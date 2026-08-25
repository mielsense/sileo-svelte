import { expect, test } from '@playwright/test';

async function openPlayground(page: import('@playwright/test').Page) {
    await page.goto('/playground');
    await expect(page.locator('[data-playground-preview] [data-sileo-toast]')).toHaveAttribute('data-ready', 'true');
}

test('keeps state text visible while action and success headers morph', async ({ page }) => {
    await openPlayground(page);
    const scenarios = page.getByRole('complementary', { name: 'Notification scenarios' });
    const actionScenario = scenarios.getByRole('button', { name: /Action and retry/ });
    await actionScenario.click();
    await expect(actionScenario).toHaveAttribute('aria-pressed', 'true');

    const preview = page.locator('[data-playground-preview]');
    await expect(preview.getByText('Payment needs attention')).toBeVisible();
    const retry = preview.getByRole('button', { name: 'Retry' });
    await expect(retry).toBeVisible();
    await retry.dispatchEvent('click');

    for (let sample = 0; sample < 50; sample += 1) {
        const frame = await preview.locator('[data-sileo-header-inner]').evaluateAll((layers) => ({
            opacity: layers.reduce(
                (total, layer) => total + Number.parseFloat(getComputedStyle(layer).opacity || '0'),
                0
            ),
            text: layers.map((layer) => layer.textContent?.trim() ?? '').join(' ')
        }));
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

    await scenarios.getByRole('button', { name: /Async promise/ }).click();
    await scenarios.getByRole('button', { name: /Scoped defaults/ }).click();
    const customScenario = scenarios.getByRole('button', { name: /Custom styles/ });
    await customScenario.click();
    await expect(customScenario).toHaveAttribute('aria-pressed', 'true');

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
    expect(after?.y).toBeGreaterThanOrEqual(87);
    expect(after?.y).toBeLessThanOrEqual(89);
    expect((after?.y ?? 0) + (after?.height ?? 0)).toBeLessThanOrEqual(await page.evaluate(() => innerHeight));
});
