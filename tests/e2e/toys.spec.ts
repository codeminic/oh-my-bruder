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

test.describe('breadboard', () => {
  test('a wrong slot explains itself, the right one lights the LED', async ({ page }) => {
    await page.goto('/en/');
    const toy = page.locator('[data-toy=breadboard]');
    await toy.scrollIntoViewIfNeeded();
    await expect(toy.locator('button[data-slot]')).toHaveCount(3);
    await toy.locator('button[data-slot="a"]').click();
    await expect(toy.locator('[role=status]')).toContainText(/not quite|nope|try/i);
    await expect(toy.locator('[data-wire]')).toHaveAttribute('data-at', 'tray');
    await toy.locator('button[data-slot="b"]').click();
    await expect(toy.locator('[data-led]')).toHaveAttribute('data-on', 'true');
    await expect(page.locator('#era-electronics')).toHaveClass(/is-lit/);
    await expect(toy.locator('.toy-done')).toBeVisible();
  });

  test('works with the keyboard', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop');
    await page.goto('/en/');
    const slot = page.locator('[data-toy=breadboard] button[data-slot="b"]');
    await slot.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-toy=breadboard] [data-led]')).toHaveAttribute('data-on', 'true');
  });
});

test.describe('code toy', () => {
  test('typing changes the output, safely', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop');
    await page.goto('/en/');
    const toy = page.locator('[data-toy=code]');
    const input = toy.getByRole('textbox');
    await expect(input).toHaveAttribute('maxlength', '24');
    const output = toy.locator('[data-output]');
    await input.fill('robots');
    await expect(output).toHaveText(/ robots$/);
    await input.fill('<b>x</b>');
    await expect(output.locator('b')).toHaveCount(0);
    await expect(output).toContainText('<b>x</b>');
    await input.fill('');
    await expect(output).not.toHaveText(/ $/);
    await expect(toy.locator('.code-snippet')).toContainText('build(');
  });

  test('phones get tappable choices instead of typing', async ({ page }, info) => {
    test.skip(info.project.name === 'desktop');
    await page.goto('/en/');
    const toy = page.locator('[data-toy=code]');
    await toy.scrollIntoViewIfNeeded();
    await expect(toy.getByRole('textbox')).toBeHidden();
    const choices = toy.locator('button[data-choice]');
    await expect(choices).toHaveCount(3);
    const second = (await choices.nth(1).textContent())!.trim();
    await choices.nth(1).click();
    await expect(toy.locator('[data-output]')).toHaveText(new RegExp(` ${second}$`));
  });
});

test('only the gear driver captures touch, so the page still scrolls over the toy', async ({ page }) => {
  await page.goto('/en/');
  const svg = page.locator('[data-toy=gears] svg');
  expect(await svg.evaluate((el) => getComputedStyle(el).touchAction)).not.toBe('none');
  const driver = page.locator('[data-toy=gears] [data-gear="0"]');
  expect(await driver.evaluate((el) => getComputedStyle(el).touchAction)).toBe('none');
});

test('keyboard focus stays in the breadboard after completing it', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/en/');
  await page.locator('[data-toy=breadboard] button[data-slot="b"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-toy=breadboard] .toy-done')).toBeFocused();
});
