import { expect, test } from '@playwright/test';

test.describe('gear train', () => {
  test('completes with the keyboard', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop');
    await page.goto('/en/');
    const driver = page.locator('[data-toy=gears] [data-gear="0"]');
    await expect(driver).toHaveAttribute('role', 'slider');
    await expect(driver).toHaveAttribute('aria-label', /.+/);
    await driver.focus();
    for (let i = 0; i < 24; i++) await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-toy=gears]')).toHaveAttribute('data-complete', 'true');
    await expect(page.locator('[data-toy=gears] .toy-done')).toBeVisible();
  });

  test('dragging the driver turns the next gear', async ({ page }) => {
    await page.goto('/en/');
    const driver = page.locator('[data-toy=gears] [data-gear="0"]');
    await driver.scrollIntoViewIfNeeded();
    const box = (await driver.boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const r = box.width / 2.5;
    const before = await page.locator('[data-toy=gears] [data-gear="1"]').getAttribute('transform');
    await page.mouse.move(cx + r, cy);
    await page.mouse.down();
    for (let a = 0; a <= 180; a += 15) {
      const rad = (a * Math.PI) / 180;
      await page.mouse.move(cx + r * Math.cos(rad), cy + r * Math.sin(rad));
    }
    await page.mouse.up();
    const after = await page.locator('[data-toy=gears] [data-gear="1"]').getAttribute('transform');
    expect(after).not.toBe(before);
  });
});
