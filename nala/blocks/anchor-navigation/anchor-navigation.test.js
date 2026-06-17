import { test } from '@playwright/test';
import AnchorNavigationPage from './anchor-navigation.page.js';
import anchorNavigationSpec from './anchor-navigation.spec.js';

const { features } = anchorNavigationSpec;

let anchorNavigationPage;

test.describe('Anchor Navigation', () => {
  test.beforeEach(async ({ page }) => {
    anchorNavigationPage = new AnchorNavigationPage(page);
  });

  test(`${features[0].name},${features[0].tags}`, async ({ page, context }) => {
    const { data } = features[0];

    await test.step('Go to anchor test page', async () => {
      await page.goto(features[0].path);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Click View all resources and validate anchor navigation', async () => {
      await anchorNavigationPage.clickViewAllResources();
      await anchorNavigationPage.verifyProductResourcesHeadingVisible(data.headingText);
      await anchorNavigationPage.verifyUrlContainsHash(data.anchorHash);
    });

    await test.step('Open anchor URL in a new tab, reload, and validate heading', async () => {
      const anchorPage = await context.newPage();
      const anchorNavigationTabPage = new AnchorNavigationPage(anchorPage);

      await anchorPage.goto(`${features[0].path}${data.anchorHash}`);
      await anchorPage.waitForLoadState('domcontentloaded');
      await anchorNavigationTabPage.verifyProductResourcesHeadingVisible(data.headingText);

      await anchorPage.reload();
      await anchorPage.waitForLoadState('domcontentloaded');
      await anchorNavigationTabPage.verifyProductResourcesHeadingVisible(data.headingText);

      await anchorPage.close();
    });
  });
});
