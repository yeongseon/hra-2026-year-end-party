const { test, expect } = require('@playwright/test');

async function openInvitation(page) {
  await page.goto('./');
  await page.locator('#open-invitation').click();
  await expect(page.locator('#invitation')).toBeVisible();
}

async function mockClipboard(page, shouldFail = false) {
  await page.addInitScript((fail) => {
    window.copiedURLs = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (text) => {
        if (fail) throw new Error('Clipboard denied');
        window.copiedURLs.push(text);
      },
    } });
  }, shouldFail);
}

test('event title, invitation text, unconfirmed information and no JavaScript errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openInvitation(page);
  await expect(page).toHaveTitle('HRA 2026 Year-End Party');
  const dialog = page.locator('#invitation');
  await expect(dialog).toContainText('Dear HRA Members,');
  await expect(dialog).toContainText("You're Invited to a Magical Night.");
  await expect(dialog).toContainText('We Hope to See You There.');
  for (const key of ['date', 'location', 'dressCode']) {
    await expect(dialog.locator(`[data-event="${key}"]`)).toHaveText('추후 안내');
  }
  await expect(dialog).not.toContainText('School of Magic');
  await page.locator('#close-invitation').click();
  await expect(dialog).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('keyboard opening, focus containment, Escape and focus restoration', async ({ page }) => {
  await page.goto('./');
  const trigger = page.locator('#open-invitation');
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.locator('#invitation');
  await expect(dialog).toBeVisible();
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  for (let index = 0; index < 5; index += 1) {
    await page.keyboard.press('Shift+Tab');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.locator('#close-invitation').click();
  await expect(trigger).toBeFocused();
});

test('URL copying uses the current page and announces success', async ({ page }) => {
  await mockClipboard(page);
  await openInvitation(page);
  await page.locator('#copy-url').click();
  await expect.poll(() => page.evaluate(() => window.copiedURLs)).toEqual([page.url()]);
  await expect(page.locator('#status')).toContainText(/복사/);
});

test('native sharing receives the event title and URL', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (data) => {
      window.sharedInvitation = data;
    } });
  });
  await openInvitation(page);
  await page.locator('#share-invitation').click();
  await expect.poll(() => page.evaluate(() => window.sharedInvitation)).toMatchObject({
    title: 'HRA 2026 Year-End Party', url: page.url(),
  });
});

test('share falls back to copying when native sharing is unavailable', async ({ page }) => {
  await mockClipboard(page);
  await page.addInitScript(() => Object.defineProperty(navigator, 'share', { configurable: true, value: undefined }));
  await openInvitation(page);
  await page.locator('#share-invitation').click();
  await expect.poll(() => page.evaluate(() => window.copiedURLs)).toEqual([page.url()]);
});


test('a failed native share recovers by copying the URL', async ({ page }) => {
  await mockClipboard(page);
  await page.addInitScript(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async () => {
    throw new Error('Share service unavailable');
  } }));
  await openInvitation(page);
  await page.locator('#share-invitation').click();
  await expect.poll(() => page.evaluate(() => window.copiedURLs)).toEqual([page.url()]);
});

test('canceling native share leaves the invitation usable without copying', async ({ page }) => {
  await mockClipboard(page);
  await page.addInitScript(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async () => {
    throw new DOMException('Canceled by user', 'AbortError');
  } }));
  await openInvitation(page);
  await page.locator('#share-invitation').click();
  await expect(page.locator('#invitation')).toBeVisible();
  expect(await page.evaluate(() => window.copiedURLs)).toEqual([]);
  await page.locator('#close-invitation').click();
  await expect(page.locator('#invitation')).not.toBeVisible();
});

test('failed clipboard access provides a recoverable message', async ({ page }) => {
  await mockClipboard(page, true);
  await openInvitation(page);
  await page.locator('#copy-url').click();
  await expect(page.locator('#status')).toContainText(/주소|URL|복사/);
  await expect(page.locator('#status')).not.toContainText(/복사되었습니다|복사했/);
  await expect(page.locator('#manual-copy')).toBeVisible();
  await expect(page.locator('#invitation-url')).toHaveValue(page.url());
  await expect(page.locator('#invitation-url')).toBeFocused();
  await expect(page.locator('#invitation')).toBeVisible();
});

for (const width of [360, 390, 768, 1440]) {
  test(`${width}px layout fits the viewport and permits reading and closing`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await page.goto('./');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`home-${width}.png`), fullPage: true });
    await page.locator('#open-invitation').click();
    const dialog = page.locator('#invitation');
    await expect(dialog).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const bounds = await dialog.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
    await page.screenshot({ path: testInfo.outputPath(`invitation-top-${width}.png`), fullPage: true });
    await page.locator('#copy-url').scrollIntoViewIfNeeded();
    await expect(page.locator('#copy-url')).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath(`invitation-${width}.png`), fullPage: true });
    await page.locator('#close-invitation').click();
    await expect(dialog).not.toBeVisible();
  });
}

test('reduced motion keeps open and close interactions usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openInvitation(page);
  const longAnimations = await page.evaluate(() => document.getAnimations().filter((animation) => {
    const timing = animation.effect.getComputedTiming();
    return timing.duration > 100 && animation.playState === 'running';
  }).length);
  expect(longAnimations).toBe(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#invitation')).not.toBeVisible();
});
