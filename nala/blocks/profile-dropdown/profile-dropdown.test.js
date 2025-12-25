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
});
