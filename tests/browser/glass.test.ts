import { expect, test } from '@playwright/test';

async function mountGlass(page: import('@playwright/test').Page, duration = 600) {
    await page.goto('/docs');
    await page.evaluate(async (duration) => {
        const sveltePath = '/node_modules/.vite/deps/svelte.js';
        const componentPath = '/src/lib/Sileo.svelte';
        const { mount } = await import(/* @vite-ignore */ sveltePath);
        const { default: Sileo } = await import(/* @vite-ignore */ componentPath);
        const backdrop = document.createElement('div');
        backdrop.style.cssText =
            'position:fixed;inset:0;z-index:2147483647;background:repeating-linear-gradient(90deg,#fff 0 4px,#000 4px 8px)';
        const target = document.createElement('div');
        target.style.cssText = `position:absolute;left:100px;top:100px;--sileo-duration:${duration}ms`;
        backdrop.append(target);
        document.body.append(backdrop);
        mount(Sileo, {
            target,
            props: {
                id: 'glass-test',
                title: 'Saved',
                description: 'Your changes are ready.',
                autoExpandDelayMs: 0,
                autoCollapseDelayMs: 0,
                fill: 'rgba(24, 24, 27, 0.35)',
                classes: { toast: 'glass-toast', background: 'glass-background' },
                styles: { backdropFilter: 'blur(12px)', titleColor: '#fff', descriptionColor: '#fff' }
            }
        });
    }, duration);
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
    const capture = await page.screenshot({ scale: 'css' });
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

test('glass paints behind its description during expansion, before the body fade finishes', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await mountGlass(page, 4000);
    const toast = page.locator('.glass-toast');
    const body = toast.locator('[data-sileo-body]');
    const trigger = toast.locator('[data-sileo-trigger]');
    await toast.evaluate((node) => {
        node.parentElement!.parentElement!.style.background = '#fff';
    });
    // Complete the initial expansion, then exercise the real collapse/reopen animation.
    await expect(body).toHaveCSS('opacity', '1', { timeout: 10000 });
    await trigger.dispatchEvent('click');
    await expect(body).toHaveCSS('opacity', '0', { timeout: 10000 });
    await trigger.dispatchEvent('click');
    await page.waitForFunction(() => {
        const node = document.querySelector('.glass-toast [data-sileo-body]')!;
        const opacity = Number(getComputedStyle(node).opacity);
        return opacity > 0.8 && opacity < 0.97;
    });
    const capture = await page.screenshot({ scale: 'css' });
    const opacity = await body.evaluate((node) => Number(getComputedStyle(node).opacity));
    expect(opacity).toBeGreaterThan(0.8);
    expect(opacity).toBeLessThan(1);
    const red = await page.evaluate(async (base64) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        return context.getImageData(300, 160, 1, 1).data[0];
    }, capture.toString('base64'));
    // A missing mask leaves the white backdrop (255) exposed until the fade completes.
    expect(red).toBeLessThan(210);
});
