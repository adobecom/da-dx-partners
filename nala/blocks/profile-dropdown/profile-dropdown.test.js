import { test, expect } from '@playwright/test';
import ProfileDropdownPage from './profile-dropdown.page.js';
import ProfileDropdownSpec from './profile-dropdown.spec.js';
import SignInPage from '../signin/signin.page.js';

let profileDropdownPage;
let signInPage;
const { features } = ProfileDropdownSpec;

test.describe('Validate profile dropdown block', () => {
  test.beforeEach(async ({ page, browserName, baseURL, context }) => {
    profileDropdownPage = new ProfileDropdownPage(page);
    signInPage = new SignInPage(page);

    if (browserName === 'chromium' && !baseURL.includes('partners.stage.adobe.com')) {
      await page.route('https://www.adobe.com/chimera-api/**', async (route, request) => {
        const newUrl = request.url().replace(
          'https://www.adobe.com/chimera-api',
          'https://14257-chimera.adobeioruntime.net/api/v1/web/chimera-0.0.1',
        );
        route.continue({ url: newUrl });
      });
    }
  });
  // @dxp-user-profile-dropdown
  test(`${features[0].name},${features[0].tags}`, async ({ page }) => {
    await test.step('Go to profile dropdown page', async () => {
      await page.goto(`${features[0].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
      await signInPage.signIn(page, `${features[0].data.partnerLevel}`);
      await profileDropdownPage.profileDropdownButton.waitFor({ state: 'visible', timeout: 10000 });
    });
    await test.step('Verify profile dropdown', async () => {
      await expect(profileDropdownPage.profileDropdown).toBeVisible();
      await profileDropdownPage.profileDropdown.click();
      await expect(profileDropdownPage.profileIcon).toBeVisible();  
      await expect(profileDropdownPage.profileName).toHaveText(features[0].data.profileName);
      await expect(profileDropdownPage.profileEmail).toHaveText(features[0].data.profileEmail);
      await expect(profileDropdownPage.profileJob).toHaveText(features[0].data.profileJob);
      await expect(profileDropdownPage.accountName).toHaveText(features[0].data.accountName);
      await expect(profileDropdownPage.partnerLevelDropdown).toHaveText(features[0].data.partnerLevelDropdown);
    });
  });
  // @dxp-user-profile-dropdown-and-open-links
  test(`${features[1].name},${features[1].tags}`, async ({ page, context }) => {
    await test.step('Go to profile dropdown page', async () => {
      await page.goto(`${features[1].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
      await signInPage.signIn(page, `${features[1].data.partnerLevel}`);
      await profileDropdownPage.profileDropdownButton.waitFor({ state: 'visible', timeout: 10000 });
    });
    await test.step('Verify update your profile link', async () => {
      await profileDropdownPage.profileDropdown.click();
      await profileDropdownPage.updateProfile.click();
      await page.waitForLoadState('domcontentloaded');
      const expectedUrl = features[1].data.updateProfileLink.replace(/#$/, '');
      await expect(page).toHaveURL(new RegExp(`^${expectedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}#?$`));
    });
    await test.step('Verify manage company account link', async () => {
      await profileDropdownPage.profileDropdown.click();
      await profileDropdownPage.manageCompanyAccount.click();
      await page.waitForLoadState('domcontentloaded');
      const expectedUrl = features[1].data.manageCompanyAccountLink.replace(/#$/, '');
      await expect(page).toHaveURL(new RegExp(`^${expectedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}#?$`));
    });
  });
  // @dxp-non-user-profile-dropdown-validation
  test(`${features[2].name},${features[2].tags}`, async ({ page }) => {
    await test.step('Go to profile dropdown page', async () => {
      await page.goto(`${features[2].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
      await signInPage.signIn(page, `${features[2].data.partnerLevel}`);
      await profileDropdownPage.profileDropdownButton.waitFor({ state: 'visible', timeout: 10000 });
    });
    await test.step('Verify profile dropdown', async () => {
      await profileDropdownPage.profileDropdown.click();
      await expect(profileDropdownPage.profileIcon).toBeVisible();  
      await expect(profileDropdownPage.profileName).toHaveText(features[2].data.profileName);
      await expect(profileDropdownPage.profileEmail).toHaveText(features[2].data.profileEmail);
    });
    await test.step('Verify sign out redirection', async () => {
      await profileDropdownPage.signOut.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page.url()).toContain(features[2].data.signOutLink);
    });
  });
  // @dxp-404-page-profile-dropdown-validation
  test(`${features[3].name},${features[3].tags}`, async ({ page }) => {
    let secondPage;
    let secondProfileDropdownPage;

    await test.step('Go to profile dropdown page', async () => {
      await page.goto(`${features[3].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
      await signInPage.signIn(page, `${features[3].data.partnerLevel}`);
      await profileDropdownPage.profileDropdownButton.waitFor({
        state: 'visible',
        timeout: 10000,
      });
    });
    await test.step('Open 404 page and verify profile dropdown', async () => {
      secondPage = await page.context().newPage();
      await secondPage.goto(`${features[3].pathSecondTab}`);
      await secondPage.waitForLoadState('domcontentloaded');
      secondProfileDropdownPage = new ProfileDropdownPage(secondPage);

      await secondProfileDropdownPage.profileDropdown.click();
      await expect(secondProfileDropdownPage.profileIcon).toBeVisible();
      await expect(secondProfileDropdownPage.profileName).toHaveText(features[3].data.profileName);
      await expect(secondProfileDropdownPage.profileEmail).toContainText(features[3].data.profileEmail);
      await expect(secondProfileDropdownPage.profileJob).toBeVisible();
      await expect(secondProfileDropdownPage.profileJob).toHaveText(features[3].data.profileJob);
      await expect(secondProfileDropdownPage.partnerLevelDropdown).toBeVisible();
      await expect(secondProfileDropdownPage.partnerLevelDropdown).toHaveText(
        features[3].data.partnerLevelDropdown
      );
      await expect(secondProfileDropdownPage.updateProfile).toBeVisible();
      await expect(secondProfileDropdownPage.updateProfile).toHaveAttribute(
        'href',
        features[3].data.updateProfileLink
      );
      await expect(secondProfileDropdownPage.manageCompanyAccount).toBeVisible();
      await expect(secondProfileDropdownPage.manageCompanyAccount).toHaveAttribute(
        'href',
        features[3].data.manageCompanyAccountLink
      );
    });
    await test.step('Verify sign out redirection', async () => {
      await expect(secondProfileDropdownPage.signOut).toBeVisible();
      await secondProfileDropdownPage.signOut.click();
      await secondPage.waitForLoadState('domcontentloaded');
      await expect(secondPage).toHaveURL(
        new RegExp(features[3].data.signOutLink)
      );
    });
  });
});
