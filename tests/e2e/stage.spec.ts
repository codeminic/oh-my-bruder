import { expect, test } from '@playwright/test';
import { goToStep, opacityOf } from './helpers';

const CHAPTERS = [
  'ch-lego-technic',
  'ch-first-computer',
  'ch-apprenticeship',
  'ch-test-automation',
  'ch-solve-and-studies',
  'ch-platforms',
  'ch-devops-and-leading',
  'ch-highlights',
  'ch-buehler-today',
];

test.describe('scroll stage', () => {
  test('switches on with a timeline linking every chapter', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('html')).toHaveClass(/is-stage/);
    const timeline = page.locator('nav.stage-timeline');
    await expect(timeline).toBeVisible();
    for (const id of CHAPTERS) await expect(timeline.locator(`a[href="#${id}"]`)).toHaveCount(1);
  });

  test('every chapter is fully readable when the stage rests on it, and only that one', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop');
    await page.goto('/en/');
    for (const id of CHAPTERS) {
      await goToStep(page, `#${id}`);
      expect(await opacityOf(page.locator(`#${id} h2`))).toBe(1);
      expect(await opacityOf(page.locator(`#${id} .chapter-story`))).toBe(1);
      const others = CHAPTERS.filter((c) => c !== id);
      for (const other of others) expect(await opacityOf(page.locator(`#${other}`))).toBeLessThan(0.05);
    }
  });

  test('a deep link opens the stage on that chapter', async ({ page }) => {
    await page.goto('/en/#ch-platforms');
    await expect.poll(() => opacityOf(page.locator('#ch-platforms'))).toBe(1);
  });

  test('clicking a timeline dot travels to that chapter', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('nav.stage-timeline a[href="#ch-apprenticeship"]').click();
    await expect.poll(() => opacityOf(page.locator('#ch-apprenticeship')), { timeout: 5000 }).toBe(1);
    await expect(page.locator('html')).toHaveAttribute('data-current-era', 'electronics');
  });

  test('a small scroll settles on a chapter instead of stopping halfway', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop');
    await page.goto('/en/');
    await goToStep(page, '#ch-lego-technic');
    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, 250);
    await expect
      .poll(async () => {
        const ops = await Promise.all(CHAPTERS.map((id) => opacityOf(page.locator(`#${id}`))));
        return ops.filter((o) => o === 1).length;
      }, { timeout: 5000 })
      .toBe(1);
    await expect.poll(() => opacityOf(page.locator('#ch-first-computer'))).toBe(1);
  });

  test('the contact email is reachable at the end', async ({ page }) => {
    await page.goto('/en/');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const mail = page.locator('#contact a[href^="mailto:"]');
    await expect(mail).toBeInViewport();
    await expect.poll(() => opacityOf(mail)).toBe(1);
    await mail.click({ trial: true });
  });

  test('keyboard focus moves the stage to the focused step', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop');
    await page.goto('/en/');
    await page.locator('[data-toy=breadboard] button[data-slot="a"]').focus();
    await expect.poll(() => opacityOf(page.locator('#toy-breadboard')), { timeout: 5000 }).toBe(1);
  });
});

test.describe('without the stage', () => {
  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('keeps the plain long page', async ({ page }) => {
      await page.goto('/en/');
      await expect(page.locator('html')).not.toHaveClass(/is-stage/);
      await expect(page.locator('nav.stage-timeline')).toBeHidden();
    });
  });

  test.describe('no JS', () => {
    test.use({ javaScriptEnabled: false });
    test('hides the timeline', async ({ page }) => {
      await page.goto('/en/');
      await expect(page.locator('nav.stage-timeline')).toBeHidden();
    });
  });
});
