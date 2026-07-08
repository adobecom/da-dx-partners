import { test } from '@playwright/test';
import SoftwareDistributionPage from './software-distribution.page.js';
import softwareDistributionSpec from './software-distribution.spec.js';
import SignInPage from '../signin/signin.page.js';

const { features } = softwareDistributionSpec;

let softwareDistributionPage;
let signInPage;

test.describe('Software Distribution', () => {
  test.beforeEach(async ({ page }) => {
    softwareDistributionPage = new SoftwareDistributionPage(page);
    signInPage = new SignInPage(page);
  });

  test(`${features[0].name},${features[0].tags}`, async ({ page }) => {
    const { data } = features[0];

    await test.step('Go to grant download access test page', async () => {
      await page.goto(features[0].path);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Sign in as Silver user', async () => {
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
      await signInPage.signIn(page, data.partnerLevel);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Request access to Software Distribution', async () => {
      await softwareDistributionPage.clickRequestAccess();
    });

    // await test.step('Verify success message is shown', async () => {
    // await softwareDistributionPage.verifySuccessMessage(data.successMessage);
    // });
  });

  test(`${features[1].name},${features[1].tags}`, async ({ page }) => {
    const { data } = features[1];

    await test.step('Go to grant download access test page', async () => {
      await page.goto(features[1].path);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Sign in as Platinum user', async () => {
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
      await signInPage.signIn(page, data.partnerLevel);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Click Example of a bad request', async () => {
      await softwareDistributionPage.clickBadRequestCta();
    });

    await test.step('Verify fail message is shown', async () => {
      await softwareDistributionPage.verifyFailMessage(data.failMessage);
    });
  });

  test(`${features[2].name},${features[2].tags}`, async ({ page }) => {
    await test.step('Go to grant download access test page as public user', async () => {
      await page.goto(features[2].path);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify Request access to Software Distribution button is not visible', async () => {
      await softwareDistributionPage.verifyRequestAccessButtonNotVisible();
    });
  });
});
