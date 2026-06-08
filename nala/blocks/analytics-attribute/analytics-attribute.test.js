import { test, expect } from '@playwright/test';
import AnalyticsAttributesPage from './analytics-attribute.page.js';
import analyticsAttributesSpec from './analytics-attribute.spec.js';
import SignInPage from '../signin/signin.page.js';

let analyticsAttributesPage;
let signInPage;
const { features } = analyticsAttributesSpec;

test.describe('Validate analytics attributes', () => {
  test.beforeEach(async ({ page }) => {
    analyticsAttributesPage = new AnalyticsAttributesPage(page);
    signInPage = new SignInPage(page);
  });
  test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    const { data, path } = features[0];
    await test.step('Go to the page', async () => {
      await page.goto(`${baseURL}${path}`);
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
      await signInPage.signIn(page, data.partnerLevel);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });
    await test.step('Verify analytics attributes card collection', async () => {
      await analyticsAttributesPage.byDaaLh(data.daaLh).waitFor({ state: 'visible', timeout: 30000 });
      await analyticsAttributesPage.search(data.searchKeyWord);
      await analyticsAttributesPage.getFilter(data.filter);
      await analyticsAttributesPage.getCheckBox(data.checkBoxName).click();
      await expect(analyticsAttributesPage.byDaaLh(data.daaLhAfterSearch)).toBeVisible();
    });
  });
  test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
    const { data, path } = features[1];
    await test.step('Go to the page', async () => {
      await page.goto(`${baseURL}${path}`);
      await signInPage.signIn(page, data.partnerLevel);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });
    await test.step('Verify analytics attributes card collection', async () => {
      await analyticsAttributesPage.byDaaLh(data.daaLh).waitFor({ state: 'visible', timeout: 30000 });
      await analyticsAttributesPage.search(data.searchKeyWord);
      await analyticsAttributesPage.getFilter(data.filter);
      await analyticsAttributesPage.getCheckBox(data.checkBoxName).click();
      await expect(analyticsAttributesPage.byDaaLh(data.daaLhAfterSearch)).toBeVisible();
    });
  });
});
