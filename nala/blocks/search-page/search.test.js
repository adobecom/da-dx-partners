import { test, expect } from '@playwright/test';
import SearchPage from './search.page.js';
import searchSpec from './search.spec.js';
import SignInPage from '../signin/signin.page.js';

const { features } = searchSpec;
const platinumAssetData = features.find((feature) => feature.tcid === '8').data;
const thumbnailCases = features.slice(19, 23);
const searchPagePath = features[0].path;

let searchPage;
let signInPage;

async function goTo(page, path) {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
}

async function signInAs(page, signInPageInstance, partnerLevel) {
  await signInPageInstance.signInButton.waitFor({ state: 'visible', timeout: 30000 });
  await signInPageInstance.signInButton.click();
  await signInPageInstance.signIn(page, partnerLevel);
  await signInPageInstance.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
}

function describeSignedInTests({ title, partnerLevel, startPath, defineTests }) {
  test.describe(title, () => {
    test.describe.configure({ mode: 'serial' });

    let context;
    let page;
    let sessionSearchPage;
    let sessionSignInPage;

    test.beforeAll(async ({ browser, baseURL }) => {
      context = await browser.newContext({ baseURL });
      page = await context.newPage();
      sessionSignInPage = new SignInPage(page);
      sessionSearchPage = new SearchPage(page);

      await goTo(page, startPath);
      await signInAs(page, sessionSignInPage, partnerLevel);
    }, { timeout: 120000 });

    test.afterAll(async () => {
      await context.close();
    });

    defineTests({
      getPage: () => page,
      getSearchPage: () => sessionSearchPage,
      getSignInPage: () => sessionSignInPage,
    });
  });
}

test.describe('Search Page', () => {
  describeSignedInTests({
    title: 'Platinum user',
    partnerLevel: 'dxp-platinum:',
    startPath: searchPagePath,
    defineTests: ({ getPage, getSearchPage }) => {
      // @search-page-platinum-user-validation
      test(`${features[0].name},${features[0].tags}`, async () => {
        const { data } = features[0];
        const searchPageInstance = getSearchPage();

        await test.step('Verify search page', async () => {
          await expect(searchPageInstance.searchField).toBeVisible();
          await searchPageInstance.searchField.fill(data.searchKeyword);
          await searchPageInstance.searchField.press('Enter');
          await searchPageInstance.waitForResultsToSettle();
          await searchPageInstance.searchAllResults.waitFor({ state: 'visible' });
          await expect.poll(
            async () => searchPageInstance.getNumberOfResults(),
            { timeout: 15000 },
          ).toBeGreaterThanOrEqual(6);
        });

        await test.step('Asset Card Content Validation', async () => {
          await expect(async () => {
            const card = searchPageInstance.getCardByTitle(data.cardTitle);
            await searchPageInstance.clickCard(card);
            await getPage().waitForLoadState('domcontentloaded');
            const expanded = await card.evaluate((el) => el.classList.contains('expanded'));

            expect(expanded).toBe(true);
          }).toPass({ timeout: 30000 });
          const expandedCard = searchPageInstance
            .getExpandedCard()
            .filter({ hasText: data.cardTitle })
            .first();
          await expect(expandedCard).toBeVisible({ timeout: 30000 });

          const cardDate = searchPageInstance.getCardDateLocator(expandedCard);
          await expect(cardDate).toContainText(data.cardDate);

          const cardSize = searchPageInstance.getCardSizeLocator(expandedCard);
          await expect(cardSize).toContainText(data.cardSize);

          for (const tagText of data.cardTags) {
            const tag = searchPageInstance.getCardTagByText(expandedCard, tagText);
            await expect(tag).toBeVisible({ timeout: 30000 });
          }

          await searchPageInstance.verifyCardButtonLink(expandedCard, data.cardButtonLink);
        });

        await test.step('Check Silver Asset', async () => {
          await searchPageInstance.clearSearch.click();
          await searchPageInstance.searchField.fill(data.silverAssetTitle);
          await searchPageInstance.searchField.press('Enter');
          const firstCardTitle = await searchPageInstance.getCardTitle();
          await expect(firstCardTitle).not.toBe(data.silverAssetTitle);
        });
      });

      // @asset-preview-zip-platinum-user-validation
      test(`${features[5].name},${features[5].tags}`, async () => {
        const { data } = features[5];
        const searchPageInstance = getSearchPage();

        await test.step('Go to search page', async () => {
          await goTo(getPage(), features[5].path);
        });

        await test.step('Verify asset details without login', async () => {
          await searchPageInstance.verifyAssetDetails(data);
        });
      });

      // @search-page-training-validation
      test(`${features[8].name},${features[8].tags}`, async () => {
        const { data } = features[8];
        const page = getPage();
        const searchPageInstance = getSearchPage();

        await test.step('Go to search page', async () => {
          await goTo(page, features[8].path);
        });

        await test.step('Check Training', async () => {
          await searchPageInstance.trainingButton.click();
          await searchPageInstance.waitForResultsToSettle();
          await expect(searchPageInstance.trainingPreviewButton).toBeVisible({ timeout: 30000 });

          const [newPage] = await Promise.all([
            page.context().waitForEvent('page'),
            searchPageInstance.trainingPreviewButton.click(),
          ]);

          await newPage.waitForURL((url) => url.toString().includes(data.trainingLink), { timeout: 30000 });

          const newPageUrl = newPage.url();
          expect(newPageUrl).toContain(data.trainingLink);
          await newPage.close();
        });
      }, { timeout: 60000 });

      // @asset-special-character-filters
      test(`${features[13].name},${features[13].tags}`, async () => {
        const { data } = features[13];
        const searchPageInstance = getSearchPage();

        await test.step('Go to search page', async () => {
          await goTo(getPage(), features[13].path);
        });

        await test.step('Verify selected filters', async () => {
          const filters = ['Industries', 'Content Type', 'Topic', 'Journey Phase'];

          for (const name of filters) {
            const filter = searchPageInstance.getFilterCount(name);
            await expect(filter).toBeVisible();
            await expect(filter).toHaveText('1');
          }
        });

        await test.step('Verify asset', async () => {
          await expect(searchPageInstance.getCardByTitle(data.cardTitle)).toBeVisible();
          await expect(searchPageInstance.getCardByTitle(data.cardTitle)).toContainText(data.cardTitle);
        });
      });

      // @training-card-details
      test(`${features[17].name},${features[17].tags}`, async () => {
        const { data } = features[17];
        const page = getPage();
        const searchPageInstance = getSearchPage();

        await test.step('Go to search page', async () => {
          await goTo(page, features[17].path);
        });

        await test.step('Open Training tab', async () => {
          await searchPageInstance.trainingButton.click();
          await page.waitForLoadState('domcontentloaded');
          await searchPageInstance.clickCard(searchPageInstance.card.first());
        });

        await test.step('Verify card details', async () => {
          await expect(searchPageInstance.cardTilte).toBeVisible();
          await expect(searchPageInstance.cardDate.first()).toBeVisible();
          await expect(searchPageInstance.cardDescription.first()).toBeVisible();
          await expect(searchPageInstance.fileIcon.first()).toBeVisible();
          await expect(searchPageInstance.fileIcon.first()).toHaveCSS('background-image', data.cardIcon);
        });
      });
    },
  });

  describeSignedInTests({
    title: 'Silver user',
    partnerLevel: 'dxp-silver:',
    startPath: searchPagePath,
    defineTests: ({ getPage, getSearchPage, getSignInPage }) => {
      // @search-page-silver-user-validation
      test(`${features[1].name},${features[1].tags}`, async () => {
        const { data } = features[1];
        const searchPageInstance = getSearchPage();

        await test.step('Search for asset', async () => {
          await searchPageInstance.searchField.fill(data.searchKeyword);
          await searchPageInstance.searchField.press('Enter');
          await expect.poll(
            async () => getSignInPage().getNumberOfResults(),
            { timeout: 15000 },
          ).toBe(4);
        });

        await test.step('Check Filter Journey Phase Explore', async () => {
          await searchPageInstance.journeyPhaseFilter.click();
          await searchPageInstance.exploreCheckBox.click();
          await expect(searchPageInstance.exploreCheckBox).toBeChecked();
          await expect.poll(
            async () => searchPageInstance.getCardTitle(),
            { timeout: 15000 },
          ).toBe(data.assetTitle1);
        });

        await test.step('Check Filter Journey Phase Discover', async () => {
          await searchPageInstance.discoverCheckBox.click();
          await expect(searchPageInstance.discoverCheckBox).toBeChecked();
          await searchPageInstance.waitForResultsToSettle();
          await searchPageInstance.waitForNumberOfResults(2);
          const cardTitle2 = await searchPageInstance.getCardTitle();
          await expect(cardTitle2).toBe(data.assetTitle2);
        });

        await test.step('Check Filter Functionality Analysis & Insights', async () => {
          await searchPageInstance.functionalityFilter.click();
          await searchPageInstance.analysisInsgightCheckBox.click();
          await expect(searchPageInstance.analysisInsgightCheckBox).toBeChecked();
          await searchPageInstance.waitForResultsToSettle();
          const cardTitle3 = await searchPageInstance.getCardTitle();
          await expect(cardTitle3).toBe(data.assetTitle2);
        });

        await test.step('Check Silver Asset', async () => {
          await searchPageInstance.clearAll.click();
          await searchPageInstance.searchField.fill(data.silverAsset);
          await searchPageInstance.searchField.press('Enter');
          await searchPageInstance.waitForResultsToSettle();
          const firstCardTitle = await searchPageInstance.getCardTitle();
          await expect(firstCardTitle).toBe(data.silverAsset);

          const card = searchPageInstance.getCardByTitle(data.silverAsset);
          await card.waitFor({ state: 'visible', timeout: 15000 });
          await card.click();

          const cardDate = searchPageInstance.getCardDateLocator(card);
          await expect(cardDate).toBeVisible({ timeout: 15000 });
        });
      });

      // @search-page-uncheck-filters-flow-validation
      test(`${features[9].name},${features[9].tags}`, async () => {
        const { data } = features[9];
        const page = getPage();
        const searchPageInstance = getSearchPage();

        await test.step('Go to search page', async () => {
          await goTo(page, features[9].path);
        });

        await test.step('Search for asset', async () => {
          await searchPageInstance.searchField.fill(data.searchKeyword);
          await page.waitForTimeout(5000);
          await searchPageInstance.searchField.press('Enter');
          await searchPageInstance.loader.waitFor({ state: 'hidden', timeout: 10000 });
          await page.waitForLoadState('domcontentloaded');
          const numberResults = await searchPageInstance.getNumberOfResults();
          await expect(numberResults).toBeGreaterThanOrEqual(4);
        });

        await test.step('Check Filter Busines Solution', async () => {
          await searchPageInstance.functionalityFilter.click();
          await searchPageInstance.loader.waitFor({ state: 'hidden', timeout: 10000 });
          await searchPageInstance.analysisInsgightCheckBox.click();
          await searchPageInstance.loader.waitFor({ state: 'hidden', timeout: 10000 });

          await searchPageInstance.businessSolutionFilter.click();
          await searchPageInstance.loader.waitFor({ state: 'hidden', timeout: 10000 });
          await searchPageInstance.b2bCheckBox.click();
          await searchPageInstance.loader.waitFor({ state: 'hidden', timeout: 10000 });
          await expect(searchPageInstance.cardTilte).not.toBeVisible();
        });

        await test.step('Uncheck Filters and Verify Results', async () => {
          await searchPageInstance.analysisInsgightCheckBox.click();
          await searchPageInstance.loader.waitFor({ state: 'hidden', timeout: 10000 });
          await searchPageInstance.functionalityFilter.click();
          await searchPageInstance.loader.waitFor({ state: 'hidden', timeout: 10000 });

          await page.waitForLoadState('domcontentloaded');

          const cardTitle4 = await searchPageInstance.getCardTitle();
          await expect(cardTitle4).toBe(data.assetTitle3);
        });

        await test.step('Check Filter Cross-functional', async () => {
          await searchPageInstance.crossFunctionalCheckBox.waitFor({ state: 'visible', timeout: 10000 });
          await searchPageInstance.crossFunctionalCheckBox.isVisible();
          await searchPageInstance.crossFunctionalCheckBox.click();
          await expect(searchPageInstance.crossFunctionalCheckBox).toBeChecked();
          await searchPageInstance.waitForResultsToSettle();
          await searchPageInstance.waitForNumberOfResults(2);
          const cardTitle5 = await searchPageInstance.getCardTitle();
          await expect(cardTitle5).toBe(data.assetTitle4);
        });

        await test.step('Uncheck Filter Clear All', async () => {
          await searchPageInstance.clearAll.click();
          await searchPageInstance.waitForResultsToSettle();
          await searchPageInstance.waitForNumberOfResults(4);
          const numberResults = await searchPageInstance.getNumberOfResults();
          await expect(numberResults).toBeGreaterThanOrEqual(4);
        });
      });
    },
  });

  describeSignedInTests({
    title: 'Gold user',
    partnerLevel: 'dxp-gold:',
    startPath: features[6].path,
    defineTests: ({ getPage, getSearchPage }) => {
      // @asset-preview-mp4-public-asset-gold-user-validation
      test(`${features[6].name},${features[6].tags}`, async () => {
        const { data } = features[6];
        const searchPageInstance = getSearchPage();

        await test.step('Verify asset details', async () => {
          await searchPageInstance.verifyAssetDetails(data);
          await expect(searchPageInstance.downloadAssetButton).not.toBeVisible();
        });
      });

      // @asset-preview-platinum-asset-with-gold-user-validation
      test(`${features[7].name},${features[7].tags}`, async () => {
        const { data } = features[7];
        const searchPageInstance = getSearchPage();

        await test.step('Go to search page', async () => {
          await goTo(getPage(), features[7].path);
        });

        await test.step('Verify asset details without login', async () => {
          await searchPageInstance.verifyAssetDetails(data);
        });
      });
    },
  });

  describeSignedInTests({
    title: 'Community user',
    partnerLevel: 'dxp-community:',
    startPath: features[11].path,
    defineTests: ({ getPage, getSearchPage }) => {
      // @restricted-asset-preview-message-community-level
      test(`${features[11].name},${features[11].tags}`, async () => {
        const { data } = features[11];
        const searchPageInstance = getSearchPage();

        await test.step('Check asset details', async () => {
          await searchPageInstance.verifyAssetDetails(platinumAssetData);
        });

        await test.step('Verify asset restricted preview message', async () => {
          await searchPageInstance.verifyPreviewMessage(data);
        });

        await test.step('Verify silver-membership link', async () => {
          await expect(
            searchPageInstance.restrictedMessageBox
              .locator('a', { hasText: data.link[0].text }),
          ).toHaveAttribute('href', data.link[0].url);
        });
      });

      // @search-page-netstorage-asset-properties-validation
      test(`${features[18].name},${features[18].tags}`, async () => {
        const { data } = features[18];
        const page = getPage();
        const searchPageInstance = getSearchPage();

        await test.step('Go to search page and sign in as Community user', async () => {
          await goTo(page, features[18].path);
        });

        await test.step('Search for netstorage asset', async () => {
          await expect(searchPageInstance.searchField).toBeVisible();
          await searchPageInstance.searchField.fill(data.searchKeyword);
          await searchPageInstance.searchField.press('Enter');
          await searchPageInstance.waitForResultsToSettle();
          await searchPageInstance.searchAllResults.waitFor({ state: 'visible', timeout: 30000 });

          await expect.poll(async () => searchPageInstance.getNumberOfResults(), { timeout: 15000 }).toBe(data.expectedResultCount);
        });

        await test.step('Expand netstorage asset and verify properties', async () => {
          const card = searchPageInstance.getCardByTitle(data.cardTitle);
          await expect(card).toBeVisible({ timeout: 30000 });

          await expect(async () => {
            await searchPageInstance.clickCard(card, 60000);
            const classList = await card.evaluate((el) => el.classList.toString());
            expect(classList).toContain('expanded');
          }).toPass({ timeout: 60000 });

          const expandedCard = searchPageInstance
            .getExpandedCard()
            .filter({ hasText: data.cardTitle })
            .first();
          await expect(expandedCard).toBeVisible({ timeout: 30000 });

          await searchPageInstance.verifyExpandedNetstorageAsset(expandedCard, data);
        });
      });
    },
  });

  test.describe('Individual tests', () => {
    test.beforeEach(async ({ page }) => {
      searchPage = new SearchPage(page);
      signInPage = new SignInPage(page);
    });

    // @asset-preview-public-non-logged-in-user-validation
    test(`${features[2].name},${features[2].tags}`, async ({ page }) => {
      const { data } = features[2];

      await test.step('Go to search page', async () => {
        await goTo(page, features[2].path);
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

    // @asset-preview-silver-user-validation
    test(`${features[4].name},${features[4].tags}`, async ({ page }) => {
      const { data } = features[4];

      await test.step('Go to asset preview page', async () => {
        await goTo(page, features[4].path);
      });

      await test.step('Verify asset details without login', async () => {
        await searchPage.verifyAssetDetails(data);
        await expect(searchPage.assetPreviewImage).toBeVisible();
        await expect(signInPage.signInButton).toBeVisible();
        await expect(page.getByText(/restricted to registered partners/i)).toBeVisible({ timeout: 30000 });
      });

      await test.step('Logged in user asset validation', async () => {
        await signInAs(page, signInPage, data.partnerLevel);
        await expect(searchPage.downloadPPTButton).toBeVisible();
        await expect(searchPage.searchAllAssetsButton).toBeVisible();
      });
    });

    // @asset-preview-community-logged-in-user-validation
    test(`${features[3].name},${features[3].tags}`, async ({ page }) => {
      const { data } = features[3];

      await test.step('Go to search page', async () => {
        await goTo(page, features[3].path);
      });

      await test.step('Verify asset details', async () => {
        await searchPage.verifyAssetDetails(data);
        await expect(searchPage.downloadAssetButton).toBeHidden();
      });

      await test.step('Logged in user asset validation', async () => {
        await signInAs(page, signInPage, data.partnerLevel);
        await expect(searchPage.downloadImageButton).toBeVisible();
      });

      await test.step('Search All Assets', async () => {
        await searchPage.searchAllAssetsButton.click();
        await page.waitForLoadState('domcontentloaded');
        const currentUrl = page.url();
        await expect(currentUrl).toContain(data.searchAllAssetsPath);
      });

      await test.step('Go to Gold Asset', async () => {
        await goTo(page, data.goldAssetLink);
        await expect(searchPage.assetTitlePreview).toBeVisible();
        await expect(searchPage.assetTitlePreview.locator('p')).toHaveText(data.asssetPreviewTitle, { timeout: 15000 });

        await expect(searchPage.downloadAssetButton).toBeHidden();
      });
    });

    // @restricted-asset-preview-message-non-signed-in-user
    test(`${features[10].name},${features[10].tags}`, async ({ page, context }) => {
      const { data } = features[10];

      await test.step('Go to search page', async () => {
        await goTo(page, features[10].path);
      });

      await test.step('Check asset details', async () => {
        await searchPage.verifyAssetDetails(platinumAssetData);
      });

      await test.step('Verify asset restricted preview message', async () => {
        await searchPage.verifyPreviewMessage(data);
      });

      await test.step('Verify register link', async () => {
        const [newPage] = await Promise.all([
          context.waitForEvent('page'),
          searchPage.clickLinkFromMessage(data.textBlock, data.link[0].text),
        ]);
        await newPage.waitForLoadState();
        await expect(newPage).toHaveURL(data.link[0].url);
      });
    });

    // @restricted-asset-preview-message-gold-level
    test(`${features[12].name},${features[12].tags}`, async ({ page }) => {
      const { data } = features[12];
      const uplevelUrl = data.link[0].url.trim();

      await test.step('Go to restricted asset page as gold user', async () => {
        await goTo(page, features[12].path);
        await signInAs(page, signInPage, data.partnerLevel);
      });

      await test.step('Check asset details', async () => {
        await searchPage.verifyAssetDetails(platinumAssetData);
      });

      await test.step('Verify asset restricted preview message', async () => {
        await searchPage.verifyPreviewMessage(data);
      });

      await test.step('Verify upleveling link', async () => {
        await searchPage.clickLinkFromMessage(data.textBlock, data.link[0].text);
        await page.waitForURL(uplevelUrl);
        await expect(page).toHaveURL(uplevelUrl);
      });
    });

    // @direct-asset-preview
    test(`${features[14].name},${features[14].tags}`, async ({ page, context }) => {
      const { data } = features[14];
      let newTab;
      let newTabSearchPage;

      await test.step('Go to search page', async () => {
        await goTo(page, features[14].path);
        await signInAs(page, signInPage, data.partnerLevel);
      });

      await test.step('Open page in a new tab', async () => {
        newTab = await context.newPage();
        newTabSearchPage = new SearchPage(newTab);
        await newTab.goto(`${data.newURL}`);
        await expect(newTab.url()).toContain(`${data.newURL}`);
      });

      await test.step('Verify error message', async () => {
        await expect(newTabSearchPage.errorHeading).toContainText(data.errorText);
      });
    });

    // @direct-public-asset-preview
    test(`${features[15].name},${features[15].tags}`, async ({ request }) => {
      const response = await request.get(`${features[15].path}`);
      expect(response.status()).toBe(200);
    });

    // @direct-protected-asset-preview
    test(`${features[16].name},${features[16].tags}`, async ({ context }) => {
      const { data } = features[16];
      const newTab = await context.newPage();
      const signInPageTab = new SignInPage(newTab);
      const searchPageTab = new SearchPage(newTab);

      await test.step('Open asset preview link in incognito tab', async () => {
        await newTab.goto(`${features[16].path}`, { waitUntil: 'domcontentloaded' });
        await newTab.waitForURL(`**${data.previewURL}**`);
        expect(newTab.url()).toContain(data.previewURL);
      });

      await test.step('Login with silver partner account', async () => {
        await signInPageTab.signInButton.click();
        await signInPageTab.signIn(newTab, `${data.partnerLevel}`);
        await signInPageTab.profileIconButton.waitFor({
          state: 'visible',
          timeout: 10000,
        });
      });

      await test.step('Verify redirect happens again and View button is visible', async () => {
        await newTab.waitForURL(`**${data.previewURL}**`);
        await expect(searchPageTab.viewAssetButton).toBeVisible();
      });

      await test.step('Click View button and verify asset opens successfully', async () => {
        const responsePromise = context.waitForEvent('response', {
          predicate: (response) => response.url().includes(features[16].path)
          && response.status() === 200,
        });
        await searchPageTab.viewAssetButton.click();
        const response = await responsePromise;
        expect(response.status()).toBe(200);
      });
    });

    thumbnailCases.forEach((feature) => {
      test(`${feature.name},${feature.tags}`, async ({ page }) => {
        const { data } = feature;

        await test.step('Go to asset preview page', async () => {
          await goTo(page, feature.path);
        });

        await test.step('Verify asset preview thumbnail image src', async () => {
          await searchPage.verifyImageThumbnail(data.imageThumbnail);
        });
      });
    });

    // @restricted-asset-preview-message-mapc-user
    test(`${features[23].name},${features[23].tags}`, async ({ page, context }) => {
      const { data, path, signInPath } = features[23];
      let assetPage;
      let assetSearchPage;

      await test.step('Go to digitalexperience home and sign in as MAPC user', async () => {
        await goTo(page, signInPath);
        await signInAs(page, signInPage, data.partnerLevel);
      });

      await test.step('Click Adobe Partner Experience Hub logo', async () => {
        await expect(searchPage.hubLogo).toBeVisible({ timeout: 30000 });
        await searchPage.hubLogo.click();
        await page.waitForLoadState('domcontentloaded');
      });

      await test.step('Open restricted asset in new tab', async () => {
        assetPage = await context.newPage();
        assetSearchPage = new SearchPage(assetPage);
        await goTo(assetPage, path);
      });

      await test.step('Verify asset details and restricted preview message', async () => {
        await assetSearchPage.verifyAssetDetails(platinumAssetData);
        await assetSearchPage.verifyPreviewMessage(data);
      });

      await test.step('Verify register now link opens registration page', async () => {
        const [registrationPage] = await Promise.all([
          context.waitForEvent('page'),
          assetSearchPage.clickLinkFromMessage(data.textBlock, data.link[0].text),
        ]);
        await registrationPage.waitForLoadState();
        await expect(registrationPage).toHaveURL(data.link[0].url);
      });
    });
  });
});
