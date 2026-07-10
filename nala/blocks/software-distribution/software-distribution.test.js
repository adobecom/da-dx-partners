import { test } from '@playwright/test';
import SoftwareDistributionPage from './software-distribution.page.js';
import softwareDistributionSpec from './software-distribution.spec.js';
import SignInPage from '../signin/signin.page.js';

const { features } = softwareDistributionSpec;

let softwareDistributionPage;
let signInPage;

async function grantLocalNetworkAccess(context, browserName, origin) {
  if (browserName !== 'chromium' || !origin) {
    return;
  }

  try {
    await context.grantPermissions(['local-network-access'], { origin });
  } catch {
    // Playwright < 1.56 does not support this permission name.
  }
}

test.describe('Software Distribution', () => {
  test.describe.configure({ timeout: 120000 });

  test.beforeEach(async ({ page, context, browserName, baseURL }) => {
    softwareDistributionPage = new SoftwareDistributionPage(page);
    signInPage = new SignInPage(page);

    if (baseURL) {
      await grantLocalNetworkAccess(context, browserName, new URL(baseURL).origin);
    }
  });

  test(`${features[0].name},${features[0].tags}`, async ({ page, browserName, baseURL }) => {
    const { data, path } = features[0];

    await test.step('Go to grant download access test page', async () => {
      await page.goto(`${baseURL}${path}`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Sign in as Silver user', async () => {
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
      await signInPage.signIn(page, data.partnerLevel);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('Request access to Software Distribution', async () => {
      await grantLocalNetworkAccess(page.context(), browserName, new URL(page.url()).origin);
      await softwareDistributionPage.clickRequestAccess();
    });

    await test.step('Verify success message is shown', async () => {
      await softwareDistributionPage.verifySuccessMessage(data.successMessage);
    });
  });

  test(`${features[1].name},${features[1].tags}`, async ({ page, browserName, baseURL }) => {
    const { data, path } = features[1];

    await test.step('Go to grant download access test page', async () => {
      await page.goto(`${baseURL}${path}`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Sign in as Platinum user', async () => {
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
      await signInPage.signIn(page, data.partnerLevel);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('Click Example of a bad request', async () => {
      await grantLocalNetworkAccess(page.context(), browserName, new URL(page.url()).origin);
      await softwareDistributionPage.clickBadRequestCta();
    });

    await test.step('Verify fail message is shown', async () => {
      await softwareDistributionPage.verifyFailMessage(data.failMessage);
    });
  });

  test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
    await test.step('Go to grant download access test page as public user', async () => {
      await page.goto(`${baseURL}${features[2].path}`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify Request access to Software Distribution button is not visible', async () => {
      await softwareDistributionPage.verifyRequestAccessButtonNotVisible();
    });
  });
});
