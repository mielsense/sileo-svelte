import { expect, test } from '@playwright/test';

async function mountGlass(page: import('@playwright/test').Page) {
    await page.goto('/docs');
    await page.evaluate(async () => {
        const sveltePath = '/node_modules/.vite/deps/svelte.js';
        const componentPath = '/src/lib/Sileo.svelte';
        const { mount } = await import(/* @vite-ignore */ sveltePath);
        const { default: Sileo } = await import(/* @vite-ignore */ componentPath);
        const backdrop = document.createElement('div');
        backdrop.style.cssText =
            'position:fixed;inset:0;z-index:2147483647;background:repeating-linear-gradient(90deg,#fff 0 4px,#000 4px 8px)';
        const target = document.createElement('div');
        target.style.cssText = 'position:absolute;left:100px;top:100px';
        backdrop.append(target);
        document.body.append(backdrop);
        mount(Sileo, {
            target,
            props: {
                id: 'glass-test',
                title: 'Saved',
                description: 'Your changes are ready.',
                autoExpandDelayMs: 0,
                autoCollapseDelayMs: 10000,
                fill: 'rgba(24, 24, 27, 0.35)',
                classes: { toast: 'glass-toast', background: 'glass-background' },
                styles: { backdropFilter: 'blur(12px)', titleColor: '#fff', descriptionColor: '#fff' }
            }
        });
    });
    await expect(page.locator('.glass-toast')).toHaveAttribute('data-expanded', 'true');
    await page.waitForTimeout(800);
}

test('glass preserves its shape and content through expand and collapse', async ({ page }) => {
    await mountGlass(page);
    const toast = page.locator('.glass-toast');
    await expect(toast.locator('.glass-background')).toHaveCSS('backdrop-filter', 'blur(12px)');
    await expect(toast.getByText('Your changes are ready.')).toBeVisible();
    const mask = await toast.locator('[data-sileo-background]').evaluate((node) => getComputedStyle(node).maskImage);
    expect(mask).toContain('-mask');
    await toast.locator('[data-sileo-trigger]').focus();
    await page.keyboard.press('Escape');
    await expect(toast).toHaveAttribute('data-expanded', 'false');
    await expect(toast.getByText('Your changes are ready.')).toBeHidden();
    await page.keyboard.press('Enter');
    await expect(toast).toHaveAttribute('data-expanded', 'true');
});

test('glass blurs backdrop pixels only inside the animated silhouette', async ({ page, browserName }) => {
    // Headless WebKit does not rasterize even a plain backdrop-filter in this runner.
    test.skip(browserName !== 'chromium', 'Pixel assertion requires Chromium backdrop rasterization.');
    await mountGlass(page);
    const capture = await page.screenshot();
    const samples = await page.evaluate(async (base64) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        function spread(x: number, y: number) {
            const data = context.getImageData(x, y, 80, 1).data;
            const values = Array.from({ length: 80 }, (_, index) => data[index * 4]);
            return Math.max(...values) - Math.min(...values);
        }
        return { inside: spread(200, 178), outside: spread(200, 115) };
    }, capture.toString('base64'));
    expect(samples.inside).toBeLessThan(12);
    expect(samples.outside).toBeGreaterThan(240);
});
