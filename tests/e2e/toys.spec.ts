import { expect, test } from '@playwright/test';
import { goToStep } from './helpers';

test.describe('excavator', () => {
  test('lifts and dumps with the keyboard', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop');
    await page.goto('/en/');
    const bucket = page.locator('[data-toy=excavator] [data-bucket]');
    await expect(bucket).toHaveAttribute('role', 'slider');
    await expect(bucket).toHaveAttribute('aria-label', /.+/);
    await bucket.focus();
    await page.keyboard.press('ArrowUp');
    await expect(bucket).toHaveAttribute('aria-valuenow', '10');
    await page.keyboard.press('End');
    await expect(page.locator('[data-toy=excavator]')).toHaveAttribute('data-complete', 'true');
    await expect(page.locator('[data-toy=excavator] .toy-done')).toBeVisible();
  });

  test('dragging the bucket up lifts it and dumps the bricks, however far the page is scrolled', async ({ page }) => {
    await page.goto('/en/');
    await goToStep(page, '#toy-excavator');
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(500);
    const bucket = page.locator('[data-toy=excavator] [data-bucket]');
    const box = (await bucket.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    const svg = (await page.locator('[data-toy=excavator] svg').boundingBox())!;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(x, y - ((y - svg.y) * i) / 10);
    await page.mouse.up();
    expect(Number(await bucket.getAttribute('aria-valuenow'))).toBeGreaterThan(90);
    await expect(page.locator('[data-toy=excavator]')).toHaveAttribute('data-complete', 'true');
  });
});

test.describe('excavator driving', () => {
  test('drives with the arrow keys', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop');
    await page.goto('/en/');
    const chassis = page.locator('[data-toy=excavator] [data-chassis]');
    await expect(chassis).toHaveAttribute('role', 'slider');
    await expect(chassis).toHaveAttribute('aria-valuenow', '0');
    await chassis.focus();
    await page.keyboard.press('ArrowRight');
    await expect(chassis).toHaveAttribute('aria-valuenow', '10');
  });

  test('dragging the body drives it along the baseplate', async ({ page }) => {
    await page.goto('/en/');
    await goToStep(page, '#toy-excavator');
    const chassis = page.locator('[data-toy=excavator] [data-chassis]');
    const machine = page.locator('[data-toy=excavator] .exc-machine');
    const before = (await machine.boundingBox())!.x;
    const box = (await chassis.boundingBox())!;
    const x = box.x + box.width * 0.3;
    const y = box.y + box.height * 0.85;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) await page.mouse.move(x + i * 5, y);
    await page.mouse.up();
    expect(Number(await chassis.getAttribute('aria-valuenow'))).toBeGreaterThan(15);
    expect((await machine.boundingBox())!.x).toBeGreaterThan(before + 10);
  });
});

test.describe('breadboard', () => {
  test('a wrong slot explains itself, the right one lights the LED', async ({ page }) => {
    await page.goto('/en/');
    const toy = page.locator('[data-toy=breadboard]');
    await goToStep(page, '#toy-breadboard');
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
    await goToStep(page, '#toy-code');
    await expect(toy.getByRole('textbox')).toBeHidden();
    const choices = toy.locator('button[data-choice]');
    await expect(choices).toHaveCount(3);
    const second = (await choices.nth(1).textContent())!.trim();
    await choices.nth(1).click();
    await expect(toy.locator('[data-output]')).toHaveText(new RegExp(` ${second}$`));
  });
});

test('only the excavator itself captures touch, so the page still scrolls over the rest of the toy', async ({ page }) => {
  await page.goto('/en/');
  const svg = page.locator('[data-toy=excavator] svg');
  expect(await svg.evaluate((el) => getComputedStyle(el).touchAction)).not.toBe('none');
  const touch = (part: string) =>
    page.locator(`[data-toy=excavator] ${part}`).evaluate((e) => getComputedStyle(e).touchAction);
  expect(await touch('[data-bucket]')).toBe('none');
  // Sideways swipes on the body drive it; vertical ones still scroll the page.
  expect(await touch('[data-chassis]')).toBe('pan-y');
});

test('keyboard focus stays in the breadboard after completing it', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/en/');
  await page.locator('[data-toy=breadboard] button[data-slot="b"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-toy=breadboard] .toy-done')).toBeFocused();
});
