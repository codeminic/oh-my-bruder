import { expect, test } from '@playwright/test';

test('locale roots set html lang', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.goto('/de/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});

test.describe('root redirect: Swiss German browser', () => {
  test.use({ locale: 'de-CH' });
  test('goes to /de/', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/de/');
  });
});

test.describe('root redirect: French browser', () => {
  test.use({ locale: 'fr-FR' });
  test('falls back to /en/', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/en/');
  });
});

test.describe('root without JS', () => {
  test.use({ javaScriptEnabled: false });
  test('offers a noscript link to /en/', async ({ page }) => {
    const res = await page.goto('/');
    const html = await res!.text();
    expect(html).toMatch(/<noscript>[\s\S]*href="\/en\/"[\s\S]*<\/noscript>/);
  });
});
