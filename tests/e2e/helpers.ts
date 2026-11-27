import { expect, type Locator, type Page } from '@playwright/test';

/** Effective opacity of an element: its own times every ancestor's. */
export function opacityOf(locator: Locator): Promise<number> {
  return locator.evaluate((el) => {
    let op = 1;
    for (let n: Element | null = el; n; n = n.parentElement) op *= Number(getComputedStyle(n).opacity);
    return op;
  });
}

/**
 * Moves the story to a step (chapter, toy or contact) the way a reader following a link would, and waits until it
 * has settled and is fully readable. Works on the stage and on the plain long page.
 */
export async function goToStep(page: Page, selector: string) {
  await page.evaluate((hash) => (location.hash = hash), selector);
  const target = page.locator(selector);
  await expect.poll(() => opacityOf(target), { timeout: 5000 }).toBe(1);
  if (!(await page.evaluate(() => document.documentElement.classList.contains('is-stage')))) {
    await target.scrollIntoViewIfNeeded();
  }
  // Let any snap animation finish.
  await page.waitForTimeout(400);
}
