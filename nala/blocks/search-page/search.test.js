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
  test(`${features[0].name},${features[0].tags}`, async ({ page, browserName, context }) => {
    const { data } = features[0];
    await test.step('Go to search page', async () => {
      await page.goto(`${features[0].path}`);
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 15000 });
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
      await searchPage.waitForResultsToSettle();
      await searchPage.searchAllResults.waitFor({ state: 'visible' });
      await expect.poll(
        async () => await searchPage.getNumberOfResults(),
        { timeout: 15000 }
      ).toBeGreaterThanOrEqual(6);
    });
    await test.step('Asset Card Content Validation', async () => {
      await expect(async () => {
        const card = searchPage.getCardByTitle(data.cardTitle);
        await searchPage.clickCard(card);
        await page.waitForLoadState('domcontentloaded');
        const expanded = await card.evaluate(el =>
          el.classList.contains('expanded')
        );

        expect(expanded).toBe(true);
      }).toPass({ timeout: 30000 });
      const expandedCard = searchPage
        .getExpandedCard()
        .filter({ hasText: data.cardTitle })
        .first();
      await expect(expandedCard).toBeVisible({ timeout: 30000 });

      const cardDate = searchPage.getCardDateLocator(expandedCard);
      await expect(cardDate).toContainText(data.cardDate);

      const cardSize = searchPage.getCardSizeLocator(expandedCard);
      await expect(cardSize).toContainText(data.cardSize);

      for (const tagText of data.cardTags) {
        const tag = searchPage.getCardTagByText(expandedCard, tagText);
        await expect(tag).toBeVisible({ timeout: 30000 });
      }

      await searchPage.verifyCardButtonLink(expandedCard, data.cardButtonLink);
    });

    await test.step('Check Silver Asset', async () => {
        await searchPage.clearSearch.click();
        await searchPage.searchField.fill(data.silverAssetTitle);
        await searchPage.searchField.press('Enter');
        const firstCardTitle = await searchPage.getCardTitle();
        await expect(firstCardTitle).not.toBe(data.silverAssetTitle);
    });
  });
  test(`${features[1].name},${features[1].tags}`, async ({ page }) => {
    const { data } = features[1];
    await test.step('Go to search page', async () => {
      await page.goto(`${features[1].path}`);
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });
    await test.step('Search for asset', async () => {
      await searchPage.searchField.fill(data.searchKeyword);
      await searchPage.searchField.press('Enter');
      const initialResults = await signInPage.getNumberOfResults();
      await expect.poll(
        async () => await signInPage.getNumberOfResults(),
        { timeout: 15000 },
      ).not.toBe(initialResults);

      await expect.poll(
        async () => await signInPage.getNumberOfResults(),
        { timeout: 15000 },
      ).toBe(4);
    });
    await test.step('Check Filter Journey Phase Explore', async () => {
      await searchPage.journeyPhaseFilter.click();
      await searchPage.journeyPhaseFilterPanel.waitFor({ state: 'visible', timeout: 30000 });
      const initialTitle = await searchPage.getCardTitle(); 
      await searchPage.exploreCheckBox.click();
      await expect(searchPage.exploreCheckBox).toBeChecked();

      await expect.poll(
        async () => await searchPage.getCardTitle(),
        { timeout: 15000 }
      ).not.toBe(initialTitle);
      await expect.poll(
        async () => await searchPage.getCardTitle(),
        { timeout: 15000 }
      ).toBe(data.assetTitle1);
    });
    await test.step('Check Filter Journey Phase Discover', async () => {
      await searchPage.discoverCheckBox.click();
      await expect(searchPage.discoverCheckBox).toBeChecked();
      await searchPage.waitForResultsToSettle();
      await searchPage.waitForNumberOfResults(2);
      const cardTitle2 = await searchPage.getCardTitle();
      await expect(cardTitle2).toBe(data.assetTitle2);
    });
    await test.step('Check Filter Functionality Analysis & Insights', async () => { 
      await searchPage.functionalityFilter.click();
      await searchPage.functionalityFilterPanel.waitFor({ state: 'visible', timeout: 30000 });
      await searchPage.analysisInsgightCheckBox.click();
      await expect(searchPage.analysisInsgightCheckBox).toBeChecked();
      await searchPage.waitForResultsToSettle();
      const cardTitle3 = await searchPage.getCardTitle();
      await expect(cardTitle3).toBe(data.assetTitle2);
    });
    await test.step('Check Silver Asset', async () => {
      await searchPage.clearAll.click();
      await searchPage.searchField.fill(data.silverAsset);
      await searchPage.searchField.press('Enter');
      await searchPage.waitForResultsToSettle();
      const firstCardTitle = await searchPage.getCardTitle();
      await expect(firstCardTitle).toBe(data.silverAsset);

      const card = searchPage.getCardByTitle(data.silverAsset);
      await card.waitFor({ state: 'visible', timeout: 15000 });
      await card.click();

      const cardDate = searchPage.getCardDateLocator(card);
      await expect(cardDate).toBeVisible({ timeout: 15000 });
    });
  });
  test(`${features[2].name},${features[2].tags}`, async ({ page, context }) => {
    const { data } = features[2];
    await test.step('Go to search page', async () => {
      await page.goto(`${features[2].path}`);
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Verify asset details', async () => {
      await expect(searchPage.assetTitlePreview.locator('p')).toHaveText(data.assetTitle, { timeout: 15000 });
      // asset date
      await expect(searchPage.assetDate).toBeVisible();
      const assetDate = await searchPage.assetDate.textContent();
      const dateValue = assetDate.replace('Date: ', '').trim();
      await expect(dateValue).toContain(data.assetDateValue);
      // asset summary
      await expect(searchPage.assetSummary).toBeVisible();
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

      const [newTab] = await Promise.all([
        page.waitForEvent('popup'),
        searchPage.viewAssetButton.click(),
      ]);

      const pages = page.context().pages();
      expect(pages.length).toBe(2);
      await newTab.close();
    });
    await test.step('Download Asset', async () => {
      await searchPage.downloadAssetButton.isVisible();
    });
  });
  test(`${features[3].name},${features[3].tags}`, async ({ page, context }) => {
    const { data } = features[3];
    await test.step('Go to search page', async () => {
      await page.goto(`${features[3].path}`);
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Verify asset details', async () => {
      await expect(searchPage.assetTitlePreview.locator('p')).toHaveText(data.assetTitle, { timeout: 15000 });
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
      await page.waitForLoadState('domcontentloaded');
      const currentUrl = page.url();
      await expect(currentUrl).toContain(data.searchAllAssetsPath);
    });
    await test.step('Go to Gold Asset', async () => {
      await page.goto(`${data.goldAssetLink}`);
      await page.waitForLoadState('domcontentloaded');
      await expect(searchPage.assetTitlePreview).toBeVisible();
      await expect(searchPage.assetTitlePreview.locator('p')).toHaveText(data.asssetPreviewTitle, { timeout: 15000 });

      await expect(searchPage.downloadAssetButton).toBeHidden();
    });
  });
  test(`${features[4].name},${features[4].tags}`, async ({ page }) => {
    const { data } = features[4];
    await test.step('Go to search page', async () => {
      await page.goto(`${features[4].path}`);
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Verify asset details without login', async () => {
      await expect(searchPage.assetTitlePreview).toBeVisible();
      await expect(searchPage.assetTitlePreview.locator('p')).toHaveText(data.assetTitle, { timeout: 15000 });
      await expect(searchPage.downloadPPTButton).toBeHidden();
      await expect(searchPage.accessToViewOrDownloadText).toBeVisible();

      // asset date
      await expect(searchPage.assetDate).toBeVisible();
      const assetDate = await searchPage.assetDate.textContent();
      const dateValue = assetDate.replace('Date: ', '').trim();
      await expect(dateValue).toContain(data.assetDateValue);
      // asset summary
      await expect(searchPage.assetSummary).toBeVisible();
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
    await test.step('Logged in user asset validation', async () => {
      await signInPage.signInButton.click();
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });

      await expect(searchPage.downloadPPTButton).toBeVisible();
      await expect(searchPage.searchAllAssetsButton).toBeVisible();
    });
  });
  test(`${features[5].name},${features[5].tags}`, async ({ page }) => {
    const { data } = features[5];
    await test.step('Go to search page', async () => {
      await page.goto(`${features[5].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });
    await test.step('Verify asset details without login', async () => {
      await expect(searchPage.assetTitlePreview).toBeVisible();
      await expect(searchPage.assetTitlePreview.locator('p')).toHaveText(data.assetTitle, { timeout: 15000 });
      await expect(searchPage.downloadPPTButton).toBeHidden();

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

      await expect(searchPage.downloadZIPButton).toBeVisible();
    });
  });
  test(`${features[6].name},${features[6].tags}`, async ({ page }) => {
    const { data } = features[6];
    await test.step('Go to search page', async () => {
      await page.goto(`${features[6].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });
    await test.step('Verify asset details without login', async () => {
      await expect(searchPage.assetTitlePreview).toBeVisible();
      await expect(searchPage.assetTitlePreview.locator('p')).toHaveText(data.assetTitle, { timeout: 15000 });
      await expect(searchPage.downloadPPTButton).toBeHidden();

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
    });
  });
  test (`${features[7].name},${features[7].tags}`, async ({ page }) => {
    const { data } = features[7];
    await test.step('Go to search page', async () => {
      await page.goto(`${features[7].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });
    await test.step('Verify asset details', async () => {
      await expect(searchPage.assetTitlePreview).toBeVisible();
      await expect(searchPage.assetTitlePreview.locator('p')).toHaveText(data.assetTitle, { timeout: 15000 });
      await expect(searchPage.downloadPPTButton).toBeHidden();

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
    });
  });
  test(`${features[8].name},${features[8].tags}`, async ({ page, context }) => {
    const { data } = features[8];
    await test.step('Go to search page', async () => {
      await page.goto(`${features[8].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });
    await test.step('Check Training', async () => {
      await searchPage.trainingButton.click();
      await page.waitForTimeout(5000);
      
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        searchPage.trainingPreviewButton.click()
      ]);

      await newPage.waitForURL((url) => url.toString().includes(data.trainingLink), { timeout: 30000 });

      const newPageUrl = newPage.url();
      expect(newPageUrl).toContain(data.trainingLink);
      await newPage.close();
    });
  });
  test(`${features[9].name},${features[9].tags}`, async ({ page, browserName }) => {
    const { data } = features[9];
    await test.step('Go to search page', async () => {
      await page.goto(`${features[9].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });
    await test.step('Search for asset', async () => {
      await searchPage.searchField.fill(data.searchKeyword);
      await page.waitForTimeout(5000);
      await searchPage.searchField.press('Enter');
      await searchPage.loader.waitFor({ state: 'hidden', timeout: 10000 });
      await page.waitForLoadState('domcontentloaded');
      const numberResults = await searchPage.getNumberOfResults();
      await expect(numberResults).toBeGreaterThanOrEqual(4);
    });
    await test.step('Check Filter Busines Solution', async () => { 
      await searchPage.functionalityFilter.click();
      await searchPage.loader.waitFor({ state: 'hidden', timeout: 10000 });
      await searchPage.analysisInsgightCheckBox.click();
      await searchPage.loader.waitFor({ state: 'hidden', timeout: 10000 });

      await searchPage.businessSolutionFilter.click();
      await searchPage.loader.waitFor({ state: 'hidden', timeout: 10000 });
      await searchPage.b2bCheckBox.click();
      await searchPage.loader.waitFor({ state: 'hidden', timeout: 10000 });
      await expect(searchPage.cardTilte).not.toBeVisible();
    });
    await test.step('Uncheck Filters and Verify Results', async () => {
      await searchPage.analysisInsgightCheckBox.click();
      await searchPage.loader.waitFor({ state: 'hidden', timeout: 10000 });
      await searchPage.functionalityFilter.click();
      await searchPage.loader.waitFor({ state: 'hidden', timeout: 10000 });

      await page.waitForLoadState('domcontentloaded');

      const cardTitle4 = await searchPage.getCardTitle();
      await expect(cardTitle4).toBe(data.assetTitle3);
    });
    await test.step('Check Filter Cross-functional', async () => {
      await searchPage.crossFunctionalCheckBox.waitFor({ state: 'visible', timeout: 10000 });
      await searchPage.crossFunctionalCheckBox.isVisible();
      await searchPage.crossFunctionalCheckBox.click();
      await expect(searchPage.crossFunctionalCheckBox).toBeChecked();
      await searchPage.waitForResultsToSettle();
      await searchPage.waitForNumberOfResults(2);
      const cardTitle5 = await searchPage.getCardTitle();
      await expect(cardTitle5).toBe(data.assetTitle4);
    });
    await test.step('Uncheck Filter Clear All', async () => {
      await searchPage.crossFunctionalCheckBox.waitFor({ state: 'visible', timeout: 10000 });
      await searchPage.crossFunctionalCheckBox.isVisible();
      await searchPage.crossFunctionalCheckBox.click();
      await searchPage.waitForResultsToSettle();
      await expect(searchPage.crossFunctionalCheckBox).not.toBeChecked();
      await searchPage.b2bCheckBox.isVisible();
      await searchPage.b2bCheckBox.click();
      await searchPage.waitForResultsToSettle();
      await searchPage.waitForNumberOfResults(4);
      const numberResults = await searchPage.getNumberOfResults();
      await expect(numberResults).toBeGreaterThanOrEqual(4);
    });
  });
});
