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

  const testCases = [features[0], features[2]];
  testCases.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page }) => {
      const { data, path } = feature;

      await test.step('Go to page', async () => {
        await page.goto(path);
        await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
        await signInPage.signInButton.click();
      });

      await test.step(`Sign in as ${data.progressionLevel} user`, async () => {
        await signInPage.signIn(page, data.partnerLevel);
        await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
      });

      await test.step(
        `Verify progress widget for ${data.progressionLevel} user`,
        async () => {
          await progressWidgetPage.progressWidget.waitFor({ state: 'visible', timeout: 30000 });
          await progressWidgetPage.verifySolutionAndTechnologyTables();
          await progressWidgetPage.verifyProgressionLevel(data.progressionLevel);
        },
      );
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

  test(`${features[3].name},${features[3].tags}`, async ({ page }) => {
    const { data } = features[3];
    await test.step('Go to page', async () => {
      await page.goto(`${features[3].path}`);
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
    });
    await test.step('Sign in as Gold user', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });
    await test.step('Verify progress widget for Gold user', async () => {
      await progressWidgetPage.dashboardBtn.waitFor({ state: 'visible', timeout: 30000 });
      await expect(progressWidgetPage.dashboardBtn).toHaveAttribute('href', new RegExp(data.dashboardURL));
      await progressWidgetPage.progressWidget.waitFor({ state: 'visible', timeout: 30000 });
      await progressWidgetPage.verifySolutionAndTechnologyTables();
      await progressWidgetPage.verifyProgressionLevel(data.progressionLevel);
      await expect(progressWidgetPage.solutionSpecializations).toHaveText('0 of 1 required');
      await expect(progressWidgetPage.solutionCredentials).toHaveText('0 of 30 required');
      await expect(progressWidgetPage.solutionCustomerDeployments).toHaveText('0 of 10 required');
      await expect(progressWidgetPage.technologyExchangeMarketplace).toHaveText('0 of 1 required');
      await expect(progressWidgetPage.technologyCredentials).toHaveText('0 of 2 required');
      await expect(progressWidgetPage.technologyCustomerDeployments).toHaveText('0 of 2 required');
    });
  });

  test(`${features[4].name},${features[4].tags}`, async ({ page }) => {
    const { data } = features[4];
    await test.step('Go to page', async () => {
      await page.goto(`${features[4].path}`);
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
    });
    await test.step('Sign in as Gold user', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });
    await test.step('Verify progress widget for Gold user', async () => {
      await progressWidgetPage.dashboardBtn.waitFor({ state: 'visible', timeout: 30000 });
      await expect(progressWidgetPage.dashboardBtn).toHaveAttribute('href', new RegExp(data.dashboardURL));
      await progressWidgetPage.progressWidget.waitFor({ state: 'visible', timeout: 30000 });
      await progressWidgetPage.verifySolutionAndTechnologyTables();
      await progressWidgetPage.verifyProgressionLevel(data.progressionLevel);
      await expect(progressWidgetPage.solutionSpecializations).toHaveText('0 of 5 required');
      await expect(progressWidgetPage.solutionCredentials).toHaveText('0 of 100 required');
      await expect(progressWidgetPage.solutionCustomerDeployments).toHaveText('0 of 20 required');
      await expect(progressWidgetPage.technologyExchangeMarketplace).toHaveText('0 of 1 required');
      await expect(progressWidgetPage.technologyCredentials).toHaveText('0 of 4 required');
      await expect(progressWidgetPage.technologyCustomerDeployments).toHaveText('0 of 3 required');
      await expect(progressWidgetPage.technologyAppAssured).toHaveText('0 of 1 required');
    });
  });
});
