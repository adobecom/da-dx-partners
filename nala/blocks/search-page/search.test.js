import { test, expect } from '@playwright/test';
import SearchPage from './search.page.js';
import searchSpec from './search.spec.js';
import SignInPage from '../signin/signin.page.js';

const { features } = searchSpec;
let searchPage;
let signInPage;

test.describe('Search Page', () => {
  test.beforeEach(async ({ page }) => {
    searchPage = new SearchPage(page);
    signInPage = new SignInPage(page);
  });
  test(`${features[0].name},${features[0].tags}`, async ({ page }) => {
    const { data } = features[0];
    await test.step('Go to search page', async () => {
      await page.goto(`${features[0].path}`);
      await page.waitForLoadState('networkidle');
      await signInPage.signInButton.click();
    });
    await test.step('Sign in', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });
    await test.step('Verify search page', async () => {
      await expect(searchPage.searchField).toBeVisible();
      await searchPage.searchField.fill(data.searchKeyword);
      await searchPage.searchField.press('Enter');

      await searchPage.searchAllResults.waitFor({ state: 'visible' });
      const text = await searchPage.searchAllResults.textContent();
      const match = text.match(/\((\d+)\)/);
      const numberResults = Number(match[1]);
      await expect(numberResults).toBeGreaterThanOrEqual(6);

      const firstCardTitle = await searchPage.getCardTitle();
      await searchPage.mostRelevant.click();
      await searchPage.mostRecent.click();
      const secondCardTitle = await searchPage.getCardTitle();
      await expect(firstCardTitle).not.toBe(secondCardTitle);
    });
    await test.step('Asset Card Content Validation', async () => {
      const card = searchPage.getCardByTitle(data.cardTitle);
      await card.click();

      const cardDate = searchPage.getCardDateLocator(card);
      await expect(cardDate).toBeVisible();
      const dateText = await cardDate.textContent();
      expect(dateText).toContain(data.cardDate);

      const cardSize = searchPage.getCardSizeLocator(card);
      await expect(cardSize).toBeVisible();
      const sizeText = await cardSize.textContent();
      expect(sizeText).toContain(data.cardSize);

      for (const tagText of data.cardTags) {
        await searchPage.verifyCardTag(card, tagText);
      }

      await searchPage.verifyCardButtonLink(card, data.cardButtonLink);
    });

    await test.step('Check Silver Asset', async () => {
        await searchPage.clearSearch.click();
        await searchPage.searchField.fill(data.silverAssetTitle);
        await searchPage.searchField.press('Enter');
        const firstCardTitle = await searchPage.getCardTitle();
        await expect(firstCardTitle).not.toBe(data.silverAssetTitle);
    });

    await test.step('Check Training', async () => {
        await searchPage.clearSearch.click();
        await searchPage.trainingButton.click();
        await page.waitForLoadState('domcontentloaded');
        await searchPage.verifyTrainingPreviewLink(data.trainingLink);
    });
  });
});