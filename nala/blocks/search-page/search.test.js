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
      const numberResults = await searchPage.getNumberOfResults();
      await expect(numberResults).toBeGreaterThanOrEqual(6);
    });
    await test.step('Asset Card Content Validation', async () => {
      const card = searchPage.getCardByTitle(data.cardTitle);
      await searchPage.clickCard(card);

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
      await searchPage.waitForResultsToSettle();
      const numberResults = await searchPage.getNumberOfResults();
      await expect(numberResults).toBeGreaterThanOrEqual(4);
    });
    await test.step('Check Filter Journey Phase Explore', async () => {
      await searchPage.journeyPhaseFilter.click();
      await searchPage.journeyPhaseFilterPanel.waitFor({ state: 'visible', timeout: 30000 });
      await searchPage.exploreCheckBox.click();
      await expect(searchPage.exploreCheckBox).toBeChecked();
      await searchPage.waitForResultsToSettle();

      const firstCardTitle = await searchPage.getCardTitle();
      await expect(firstCardTitle).toBe(data.assetTitle1);
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
  test(`${features[2].name},${features[2].tags}`, async ({ page }) => {
    const { data } = features[2];
    await test.step('Go to search page', async () => {
      await page.goto(`${features[2].path}`);
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Verify asset details', async () => {
      await searchPage.verifyAssetDetails(data);
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
  test(`${features[3].name},${features[3].tags}`, async ({ page }) => {
    const { data } = features[3];
    await test.step('Go to search page', async () => {
      await page.goto(`${features[3].path}`);
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Verify asset details', async () => {
      await searchPage.verifyAssetDetails(data);
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
      await searchPage.verifyAssetDetails(data);
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
      await searchPage.verifyAssetDetails(data);
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
      await searchPage.verifyAssetDetails(data);
    });
  });
  test(`${features[7].name},${features[7].tags}`, async ({ page }) => {
    const { data } = features[7];
    await test.step('Go to search page', async () => {
      await page.goto(`${features[7].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });
    await test.step('Verify asset details', async () => {
      await searchPage.verifyAssetDetails(data);
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

  test(`${features[10].name},${features[10].tags}`, async ({ page, context }) => {
    const { data } = features[10];
    const sharedData = features.find(f => f.tcid === '8')?.data;

    await test.step('Go to search page', async () => {
      await page.goto(`${features[10].path}`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Check asset details', async () => {
      await searchPage.verifyAssetDetails(sharedData);
    });

    await test.step('Verify asset restricted preview message', async () => {
      await searchPage.verifyPreviewMessage(data)
    });

    await test.step('Verify register link', async () => {
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        searchPage.clickLinkFromMessage(data.textBlock, data.link[0].text)
      ]);
      await newPage.waitForLoadState();
      await expect(newPage).toHaveURL(data.link[0].url);
    });
  });

  test(`${features[11].name},${features[11].tags}`, async ({ page }) => {
    const { data } = features[11];
    const sharedData = features.find(f => f.tcid === '8')?.data;

    await test.step('Go to search page', async () => {
      await page.goto(`${features[11].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Check asset details', async () => {
      await searchPage.verifyAssetDetails(sharedData);
    });

    await test.step('Verify asset restricted preview message', async () => {
      await searchPage.verifyPreviewMessage(data)
    });

    await test.step('Verify silver-membership link', async () => {
      await expect(
        searchPage.restrictedMessageBox
          .locator('a', { hasText: data.link[0].text })
      ).toHaveAttribute('href', data.link[0].url);
    });
  });

  test(`${features[12].name},${features[12].tags}`, async ({ page }) => {
    const { data } = features[12];
    const sharedData = features.find(f => f.tcid === '8')?.data;

    await test.step('Go to search page', async () => {
      await page.goto(`${features[12].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Check asset details', async () => {
      await searchPage.verifyAssetDetails(sharedData);
    });

    await test.step('Verify asset restricted preview message', async () => {
      await searchPage.verifyPreviewMessage(data)
    });

    await test.step('Verify upleveling link', async () => {
      await searchPage.clickLinkFromMessage(
        data.textBlock,
        data.link[0].text
      );
      await page.waitForURL(data.link[0].url);
      await expect(page).toHaveURL(data.link[0].url);
    });
  });
});
