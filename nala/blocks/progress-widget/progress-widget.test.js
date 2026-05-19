import { test, expect } from '@playwright/test';
import ProgressWidgetPage from './progress-widget.page.js';
import progressWidgetSpec from './progress-widget.spec.js';
import SignInPage from '../signin/signin.page.js';

const { features } = progressWidgetSpec;

let progressWidgetPage;
let signInPage;

test.describe('Partnership Progress Widget', () => {
  test.beforeEach(async ({ page }) => {
    progressWidgetPage = new ProgressWidgetPage(page);
    signInPage = new SignInPage(page);
  });

  test(`${features[0].name},${features[0].tags}`, async ({ page }) => {
    const { data } = features[0];
    await test.step('Go to page', async () => {
      await page.goto(`${features[0].path}`);
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
    });
    await test.step('Sign in as Silver user', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });
    await test.step('Verify progress widget for Silver user', async () => {
      await progressWidgetPage.progressWidget.waitFor({ state: 'visible', timeout: 30000 });
      await progressWidgetPage.verifySolutionAndTechnologyTables();
      await progressWidgetPage.verifyProgressionLevel(data.progressionLevel);
    });
  });

  test(`${features[1].name},${features[1].tags}`, async ({ page }) => {
    const { data } = features[1];
    await test.step('Go to page', async () => {
      await page.goto(`${features[0].path}`);
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
    });
    await test.step('Sign in as Gold user', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });
    await test.step('Verify progress widget for Gold user', async () => {
      await progressWidgetPage.progressWidget.waitFor({ state: 'visible', timeout: 30000 });
      await progressWidgetPage.verifySolutionAndTechnologyTables();
      await progressWidgetPage.verifyProgressionLevel(data.progressionLevel);
      await progressWidgetPage.verifySolutionRequirementProgressBars(data.progressBars);
    });
  });

  test(`${features[2].name},${features[2].tags}`, async ({ page }) => {
    const { data } = features[2];
    await test.step('Go to page', async () => {
      await page.goto(`${features[0].path}`);
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
    });
    await test.step('Sign in as Platinum user', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });
    await test.step('Verify progress widget for Platinum user', async () => {
      await progressWidgetPage.progressWidget.waitFor({ state: 'visible', timeout: 30000 });
      await progressWidgetPage.verifySolutionAndTechnologyTables();
      await progressWidgetPage.verifyProgressionLevel(data.progressionLevel);
    });
  });

  test(`${features[3].name},${features[3].tags}`, async ({ page }) => {
    const { data } = features[3];
    await test.step('Go to page', async () => {
      await page.goto(`${features[0].path}`);
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
    });
    await test.step('Sign in as Community user', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });
    await test.step('Verify progress widget not visible for Community user', async () => {
      await expect(progressWidgetPage.progressWidget).not.toBeVisible();
    });
  });
})
