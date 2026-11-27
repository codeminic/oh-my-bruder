import { expect, test, type Page } from '@playwright/test';
import { goToStep } from './helpers';

async function textOpacities(page: Page) {
  return page.locator('[data-chapter] h2, [data-chapter] .chapter-story').evaluateAll((els) =>
    els.map((e) => {
      let op = 1;
      for (let n: Element | null = e; n; n = n.parentElement) op *= Number(getComputedStyle(n).opacity);
      return op;
    }),
  );
}

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('marks the page and shows all text without scrolling', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop');
    await page.goto('/en/');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    expect((await textOpacities(page)).every((o) => o === 1)).toBe(true);
  });
});

test('phones get the simple mode', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop');
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'simple');
});

test('entering an era fires cv:era-enter', async ({ page }) => {
  await page.goto('/en/');
  await page.evaluate(() => {
    (window as any).__eras = [];
    document.addEventListener('cv:era-enter', (e) => (window as any).__eras.push((e as CustomEvent).detail.era));
  });
  await goToStep(page, '#ch-apprenticeship');
  await expect.poll(() => page.evaluate(() => (window as any).__eras as string[])).toContain('electronics');
});

test('each era has its own world', async ({ page }) => {
  await page.goto('/en/');
  for (const era of ['lego', 'electronics', 'software']) {
    await expect(page.locator(`#era-${era} .era-world .world-${era}`)).toHaveCount(1);
  }
});

test('ships less than 200 KB of JavaScript', async ({ page }) => {
  let bytes = 0;
  page.on('response', async (res) => {
    if (res.url().endsWith('.js')) bytes += (await res.body()).length;
  });
  await page.goto('/en/');
  await page.waitForLoadState('networkidle');
  expect(bytes).toBeGreaterThan(0);
  expect(bytes).toBeLessThan(200 * 1024);
});
