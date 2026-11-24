import { expect, test, type Page } from '@playwright/test';

async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
}

for (const lang of ['en', 'de'] as const) {
  test.describe(`readable without JS (${lang})`, () => {
    test.use({ javaScriptEnabled: false });

    test('shows every era, chapter and the contact section', async ({ page }) => {
      await page.goto(`/${lang}/`);
      const eras = page.locator('section.era');
      await expect(eras).toHaveCount(3);
      expect(await eras.evaluateAll((els) => els.map((e) => e.getAttribute('data-era')))).toEqual([
        'lego',
        'electronics',
        'software',
      ]);
      const chapters = page.locator('[data-chapter]');
      expect(await chapters.count()).toBeGreaterThanOrEqual(9);
      for (const ch of await chapters.all()) {
        await ch.scrollIntoViewIfNeeded();
        await expect(ch).toBeVisible();
        await expect(ch.locator('h2')).toBeVisible();
      }
      await expect(page.locator('#contact')).toBeVisible();
      await expect(page.locator('#contact a[href^="mailto:"]')).toHaveCount(1);
    });

    test('publishes no phone number or birthday', async ({ page }) => {
      await page.goto(`/${lang}/`);
      await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
      const text = await page.locator('body').innerText();
      expect(text).not.toMatch(/\+41|1993|Im Dorf/);
    });
  });

  test(`footer legal pages work (${lang})`, async ({ page }) => {
    await page.goto(`/${lang}/`);
    for (const [slug, re] of [
      ['impressum', /Impressum/],
      ['privacy', /Privacy|Datenschutz/],
    ] as const) {
      const link = page.locator(`footer a[href="/${lang}/${slug}/"]`);
      await expect(link).toHaveCount(1);
      const res = await page.request.get(`/${lang}/${slug}/`);
      expect(res.status()).toBe(200);
      const body = await res.text();
      expect(body).toMatch(re);
      if (slug === 'impressum') expect(body).toContain('Dominic Baumgartner');
    }
  });
}

test('language switch keeps the reading position', async ({ page }) => {
  await page.goto('/en/');
  await page.locator('#ch-apprenticeship').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.locator('.lang-switch').click();
  await page.waitForURL('**/de/#ch-apprenticeship');
  await expect(page.locator('#ch-apprenticeship')).toBeInViewport();
  expect(await page.evaluate(() => localStorage.getItem('cv-lang'))).toBe('de');
});

test('language switch stays visible at the end of the story', async ({ page }) => {
  await page.goto('/en/');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.locator('.lang-switch')).toBeInViewport();
});

test('falls back to English with lang="en" for untranslated chapters', async ({ page }) => {
  // All chapters are translated today; the attribute must be absent on /de/.
  await page.goto('/de/');
  await expect(page.locator('[data-chapter][lang="en"]')).toHaveCount(0);
});

for (const lang of ['en', 'de'] as const) {
  test(`no horizontal scroll (${lang})`, async ({ page }) => {
    await page.goto(`/${lang}/`);
    await scrollThrough(page);
    const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    expect(sw).toBeLessThanOrEqual(iw);
  });
}

test('makes no requests to other origins', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const foreign: string[] = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.protocol.startsWith('http') && url.origin !== origin) foreign.push(req.url());
  });
  await page.goto('/en/');
  await scrollThrough(page);
  await page.waitForTimeout(500);
  expect(foreign).toEqual([]);
});
