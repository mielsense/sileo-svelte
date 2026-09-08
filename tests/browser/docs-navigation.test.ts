import { expect, test } from '@playwright/test';

for (const path of ['/docs', '/docs/installation']) {
    test(`opens raw Markdown from the hydrated ${path} page`, async ({ page }) => {
        await page.goto(path);
        // Code controls mount after hydration, when the client router intercepts links.
        await expect(page.locator('.code-frame').first()).toBeVisible();
        const responsePromise = page.waitForResponse(
            (response) => response.url().endsWith(`${path}.md`) && response.request().isNavigationRequest()
        );
        await page.getByRole('link', { name: 'View as Markdown' }).click();
        const response = await responsePromise;
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('text/markdown');
        await expect(page).toHaveURL(`${path}.md`);
        await expect(page.locator('body')).toContainText('sileo-svelte');
        await expect(page.getByRole('heading', { name: 'Page not found' })).toHaveCount(0);
    });
}

test('centers error content and keeps recovery actions the same height', async ({ page }) => {
    await page.goto('/docs/does-not-exist');
    const content = page.locator('.error-content');
    await expect(content).toBeVisible();
    const bounds = await content.boundingBox();
    expect(Math.abs(bounds!.x + bounds!.width / 2 - page.viewportSize()!.width / 2)).toBeLessThanOrEqual(1);
    const docs = await page.getByRole('link', { name: 'Open documentation' }).boundingBox();
    const playground = await page.getByRole('link', { name: 'Open playground' }).boundingBox();
    expect(docs!.height).toBe(playground!.height);
    await page.setViewportSize({ width: 320, height: 740 });
    await expect(content).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});
