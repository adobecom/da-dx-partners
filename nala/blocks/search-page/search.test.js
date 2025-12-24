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
  test(`${features[0].name},${features[0].tags}`, async ({ page, context }) => {
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
        
        const [newPage] = await Promise.all([
          context.waitForEvent('page'),
          searchPage.trainingPreviewButton.click()
        ]);

        await newPage.waitForTimeout(10000);

        const newPageUrl = newPage.url();
        expect(newPageUrl).toContain(data.trainingLink);
    });
  });
  test(`${features[1].name},${features[1].tags}`, async ({ page }) => {
    const { data } = features[1];
    await test.step('Go to search page', async () => {
      await page.goto(`${features[1].path}`);
      await page.waitForLoadState('networkidle');
      await signInPage.signInButton.click();
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });
    await test.step('Search for asset', async () => {
      await searchPage.searchField.fill(data.searchKeyword);
      await searchPage.searchField.press('Enter');
      const text = await searchPage.searchAllResults.textContent();
      const match = text.match(/\((\d+)\)/);
      const numberResults = Number(match[1]);
      await expect(numberResults).toBeGreaterThanOrEqual(4);
    });
    await test.step('Check Filter Journey Phase Explore', async () => {
      await searchPage.journeyPhaseFilter.click();
      await searchPage.exploreCheckBox.click();
      const firstCardTitle = await searchPage.getCardTitle();
      await expect(firstCardTitle).toBe(data.assetTitle1);
    });
    await test.step('Check Filter Journey Phase Discover', async () => {
      await searchPage.discoverCheckBox.click();
      const cardTitle2 = await searchPage.getCardTitle();
      await expect(cardTitle2).toBe(data.assetTitle2);
    });
    await test.step('Check Filter Functionality Analysis & Insights', async () => { 
      await searchPage.functionalityFilter.click();
      await searchPage.analysisInsgightCheckBox.click();
      const cardTitle3 = await searchPage.getCardTitle();
      await expect(cardTitle3).toBe(data.assetTitle2);
    });
    await test.step('Check Filter Busines Solution', async () => { 
      await searchPage.businessSolutionFilter.click();
      await searchPage.b2bCheckBox.click();
      await expect(searchPage.cardTilte).not.toBeVisible();
    });
    await test.step('Uncheck Filters and Verify Results', async () => {
      await searchPage.exploreCheckBox.click();
      await searchPage.discoverCheckBox.click();
      await searchPage.journeyPhaseFilter.click();
      await searchPage.analysisInsgightCheckBox.click();
      await searchPage.functionalityFilter.click();
      const cardTitle4 = await searchPage.getCardTitle();
      await expect(cardTitle4).toBe(data.assetTitle3);
    });
    await test.step('Check Filter Cross-functional', async () => {
      await searchPage.crossFunctionalCheckBox.click();
      const cardTitle5 = await searchPage.getCardTitle();
      await expect(cardTitle5).toBe(data.assetTitle4);
    });
    await test.step('Uncheck Filter Clear All', async () => {
      await searchPage.crossFunctionalCheckBox.click();
      await searchPage.b2bCheckBox.click();
      const text = await searchPage.searchAllResults.textContent();
      const match = text.match(/\((\d+)\)/);
      const numberResults = Number(match[1]);
      await expect(numberResults).toBeGreaterThanOrEqual(4);
    });
    await test.step('Check Silver Asset', async () => {
      await searchPage.clearSearch.click();
      await searchPage.searchField.fill(data.silverAsset);
      await searchPage.searchField.press('Enter');
      const firstCardTitle = await searchPage.getCardTitle();
      await expect(firstCardTitle).toBe(data.silverAsset);

      const card = searchPage.getCardByTitle(data.silverAsset);
      await card.click();

      const cardDate = searchPage.getCardDateLocator(card);
      await expect(cardDate).toBeVisible();
    });
  });
  test(`${features[2].name},${features[2].tags}`, async ({ page, context }) => {
    const { data } = features[2];
    await test.step('Go to search page', async () => {
      await page.goto(`${features[2].path}`);
      await page.waitForLoadState('networkidle');
    });
    await test.step('Verify asset details', async () => {
      await expect(searchPage.assetTitlePreview).toBeVisible();
      const assetTitle = await searchPage.assetTitlePreview.textContent();
      await expect(assetTitle).toBe(data.assetTitle);
      // asset date
      await expect(searchPage.assetDate).toBeVisible();
      const assetDate = await searchPage.assetDate.textContent();
      const dateValue = assetDate.replace('Date: ', '').trim();
      await expect(dateValue).toContain(data.assetDateValue);
      // asset summary
      await expect(searchPage.assetSummary).toBeVisible();
      const assetSummary = await searchPage.assetSummary.textContent();
      await expect(assetSummary).toBe(data.assetSummary);
      // asset type
      await expect(searchPage.assetType).toBeVisible();
      const assetType = await searchPage.assetType.textContent();
      const typeValue = assetType.replace('Type: ', '').trim();
      await expect(typeValue).toBe(data.assetTypeValue);
      // asset tags
      await expect(searchPage.assetTags).toBeVisible();
      const assetTags = await searchPage.assetTags.textContent();
      const tagsValue = assetTags.replace('Tags: ', '').trim().toLowerCase();
      for (const tag of data.assetTagsValue) {
        await expect(tagsValue).toContain(tag.toLowerCase());
      }
      // asset size
      await expect(searchPage.assetSize).toBeVisible();
      const assetSize = await searchPage.assetSize.textContent();
      const sizeValue = assetSize.replace('Size: ', '').trim();
      await expect(sizeValue).toContain(data.assetSizeValue);
    });

    await test.step('View Asset', async () => {
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        searchPage.viewAssetButton.click()
      ]);

      await newPage.waitForLoadState('networkidle');
      const newPageUrl = newPage.url();
      await expect(newPageUrl).toContain(data.assetUrl);
      await newPage.close();
    });
    await test.step('Download Asset', async () => {
      await searchPage.downloadAssetButton.isVisible();
    });
  });
  test(`${features[3].name},${features[3].tags}`, async ({ page, context }) => {
    const { data } = features[3];
    await test.step('Go to search page', async () => {
      await page.goto(`${features[3].path}`);
      await page.waitForLoadState('networkidle');
    });
    await test.step('Verify asset details', async () => {
      await expect(searchPage.assetTitlePreview).toBeVisible();
      const assetTitle = await searchPage.assetTitlePreview.textContent();
      await expect(assetTitle).toBe(data.assetTitle);
      // asset date
      await expect(searchPage.assetDate).toBeVisible();
      const assetDate = await searchPage.assetDate.textContent();
      const dateValue = assetDate.replace('Date: ', '').trim();
      await expect(dateValue).toContain(data.assetDateValue);
      // asset summary
      await expect(searchPage.assetSummary).toBeVisible();
      const assetSummary = await searchPage.assetSummary.textContent();
      const summaryValue = assetSummary.replace('Summary: ', '').trim();
      await expect(summaryValue).toBe(data.assetSummaryValue);
      // asset type
      await expect(searchPage.assetType).toBeVisible();
      const assetType = await searchPage.assetType.textContent();
      const typeValue = assetType.replace('Type: ', '').trim();
      await expect(typeValue).toBe(data.assetTypeValue);
      // asset tags
      await expect(searchPage.assetTags).toBeVisible();
      const assetTags = await searchPage.assetTags.textContent();
      const tagsValue = assetTags.replace('Tags: ', '').trim().toLowerCase();
      for (const tag of data.assetTagsValue) {
        await expect(tagsValue).toContain(tag.toLowerCase());
      }
      // asset size
      await expect(searchPage.assetSize).toBeVisible();
      const assetSize = await searchPage.assetSize.textContent();
      const sizeValue = assetSize.replace('Size: ', '').trim();
      await expect(sizeValue).toContain(data.assetSizeValue);

      await expect(searchPage.downloadAssetButton).toBeHidden();
    });
    await test.step('Logged in user asset validation', async () => {
      await signInPage.signInButton.click();
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });

      await expect(searchPage.downloadImageButton).toBeVisible(); 
    });
    await test.step('Search All Assets', async () => {
      await searchPage.searchAllAssetsButton.click();
      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();
      await expect(currentUrl).toBe(data.searchAllAssetsPath);
    });
    await test.step('Go to Gold Asset', async () => {
      await page.goto(`${data.goldAssetLink}`);
      await page.waitForLoadState('networkidle');
      await expect(searchPage.assetTitlePreview).toBeVisible();
      const assetTitle = await searchPage.assetTitlePreview.textContent();
      await expect(assetTitle).toBe(data.asssetPreviewTitle);

      await expect(searchPage.downloadAssetButton).toBeHidden();
    });
  });
});