import { test, expect } from '@playwright/test';
import EventsPage from './events.page.js';
import eventsSpec from './events.spec.js';
import SignInPage from '../signin/signin.page.js';

let eventsPage;
let signInPage;
const { features } = eventsSpec;
const goldAndPlatinumAccess = features.slice(2, 4);

test.describe('Validate events block', () => {
  test.beforeEach(async ({ page, browserName, baseURL, context }) => {
    eventsPage = new EventsPage(page);
    signInPage = new SignInPage(page);
  });
  // @events-public-page-load-validation
  test(`${features[0].name},${features[0].tags}`, async ({ page }) => {
    const { data } = features[0];
    await test.step('Go to events page', async () => {
      await page.goto(`${features[0].path}`);
      await page.waitForLoadState('networkidle');
    });

    await test.step('Verify public card title', async () => {
      await eventsPage.verifyPublicCardTitle(data.publicCardTitle);
      const results = await eventsPage.getResultsNumber();
      await expect(results).toBeGreaterThanOrEqual(1);
      await eventsPage.productFilter.click();
      await eventsPage.getFirstFilterCheckbox().click();
      const resultsAfterFilter = await eventsPage.getResultsNumber();
      await expect(resultsAfterFilter).toBeLessThan(results);
    });
  });
  // @events-protected-page-load-validation
  test(`${features[1].name},${features[1].tags}`, async ({ page }) => {
    const { data } = features[1];
    await test.step('Go to events page', async () => {
      await page.goto(`${features[1].path}`);
      await page.waitForLoadState('networkidle');
      await signInPage.signInButton.click();
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });
    await test.step('Verify filters', async () => {
      const results = await eventsPage.getResultsNumber();
      await eventsPage.productFilter.click();
      await eventsPage.getFirstFilterCheckbox().click();
      const resultsAfterProductFilter = await eventsPage.getResultsNumber();
      await expect(resultsAfterProductFilter).toBeLessThan(results);

      await eventsPage.filterRegion.click();
      await eventsPage.getFirstFilterCheckbox().click();
      const resultsAfterRegion = await eventsPage.getResultsNumber();
      await expect(resultsAfterRegion).toBeLessThanOrEqual(resultsAfterProductFilter);
    });
  });
  // @events-access-platinum-event and @events-access-gold-event
  goldAndPlatinumAccess.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page }) => {
      const { data } = feature;
      await test.step('Go to events page', async () => {
        await page.goto(`${feature.path}`);
        await page.waitForLoadState('networkidle');
        await signInPage.signInButton.click();
        await signInPage.signIn(page, `${data.partnerLevel}`);
        await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
      });
      await test.step('Verify Access Events', async () => {
        await eventsPage.verifyPublicCardTitle(data.visibleCardTitle);
        await eventsPage.verifyCardNotVisible(data.notVisibleCardTitle);
      });
    });
  });
});