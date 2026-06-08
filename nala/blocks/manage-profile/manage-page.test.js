import { test } from '@playwright/test';
import ManagePage from './manage-page.page.js';
import ManagePageSpec from './manage-page.spec.js';
import SignInPage from '../signin/signin.page.js';

const { features } = ManagePageSpec;

let managePage;
let signInPage;

test.describe('Manage company profile', () => {
  test.beforeEach(async ({ page }) => {
    managePage = new ManagePage(page);
    signInPage = new SignInPage(page);
  });

  // @manage-profile-admin-user
  test(`${features[0].name},${features[0].tags}`, async ({ page }) => {
    const { data } = features[0];
    await test.step('Go to page', async () => {
      await page.goto(`${features[0].path}`);
      await signInPage.signIn(page, `${features[0].data.partnerLevel}`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify first card content', async () => {
      await managePage.firstCard.waitFor({ state: 'visible', timeout: 30000 });
      await managePage.verifyFirstCardContent(features[0].data);
    });

    await test.step('Go to Manage Company page', async () => {
      await page.goto(data.manageCompanyLink);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify manage company first card', async () => {
      await managePage.firstCard.waitFor({
        state: 'visible',
        timeout: 30000,
      });
      await managePage.verifyManageCompanyFirstCard(data);
    });

    await test.step('Verify remaining card titles', async () => {
      await managePage.verifyCardTitles(
        data.cardTitles,
      );
    });
  });

  // @manage-profile-noadmin-user
  test(`${features[1].name},${features[1].tags}`, async ({ page }) => {
    const { data } = features[1];
    await test.step('Go to page', async () => {
      await page.goto(`${features[1].path}`);
      await signInPage.signIn(page, `${features[1].data.partnerLevel}`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify first card content', async () => {
      await managePage.firstCard.waitFor({ state: 'visible', timeout: 30000 });
      await managePage.verifyFirstCardContent(features[1].data);
    });

    await test.step('Go to Manage Company page', async () => {
      await page.goto(data.manageCompanyLink);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify manage company first card', async () => {
      await managePage.firstCard.waitFor({
        state: 'visible',
        timeout: 30000,
      });
      await managePage.verifyManageCompanyFirstCard(data);
    });

    await test.step('Verify remaining card titles', async () => {
      await managePage.verifyCardTitles(
        data.cardTitles,
      );
    });
  });

  // @manage-profile-biling-admin-user
  test(`${features[2].name},${features[2].tags}`, async ({ page }) => {
    const { data } = features[2];
    await test.step('Go to page', async () => {
      await page.goto(`${features[1].path}`);
      await signInPage.signIn(page, `${features[2].data.partnerLevel}`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify first card content', async () => {
      await managePage.firstCard.waitFor({ state: 'visible', timeout: 30000 });
      await managePage.verifyFirstCardContent(features[2].data);
    });

    await test.step('Go to Manage Company page', async () => {
      await page.goto(data.manageCompanyLink);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify manage company first card', async () => {
      await managePage.firstCard.waitFor({
        state: 'visible',
        timeout: 30000,
      });
      await managePage.verifyManageCompanyFirstCard(data);
    });

    await test.step('Verify remaining card titles', async () => {
      await managePage.verifyCardTitles(
        data.cardTitles,
      );
    });
  });

  // @manage-profile-biling-admin-admin-user'
  test(`${features[3].name},${features[3].tags}`, async ({ page }) => {
    const { data } = features[3];
    await test.step('Go to page', async () => {
      await page.goto(`${features[1].path}`);
      await signInPage.signIn(page, `${features[3].data.partnerLevel}`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify first card content', async () => {
      await managePage.firstCard.waitFor({ state: 'visible', timeout: 30000 });
      await managePage.verifyFirstCardContent(features[3].data);
    });

    await test.step('Go to Manage Company page', async () => {
      await page.goto(data.manageCompanyLink);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify manage company first card', async () => {
      await managePage.firstCard.waitFor({
        state: 'visible',
        timeout: 30000,
      });
      await managePage.verifyManageCompanyFirstCard(data);
    });

    await test.step('Verify remaining card titles', async () => {
      await managePage.verifyCardTitles(
        data.cardTitles,
      );
    });
  });
});
