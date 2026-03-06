import { test, expect } from '@playwright/test';
import CardCollectionPage from './card-collection.page.js';
import CardCollectionSpec from './card-collection.spec.js';

let cardCollectionPage;
const { features } = CardCollectionSpec;

test.describe('Validate card collection block', () => {
  test.beforeEach(async ({ page, browserName, baseURL, context }) => {
    cardCollectionPage = new CardCollectionPage(page);
    if (!baseURL.includes('partners.stage.adobe.com')) {
      await context.setExtraHTTPHeaders({ authorization: `token ${process.env.MILO_AEM_API_KEY}` });
    }
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

  // @card-collection-no-tags-configured
  test(`${features[0].name},${features[0].tags}`, async ({ page }) => {
    const { data } = features[0];
    await test.step('Go to card collection page', async () => {
      await page.goto(`${features[0].path}`);
      await page.waitForLoadState('domcontentloaded');
      await cardCollectionPage.searchField.waitFor({ state: 'visible', timeout: 10000 });
      await cardCollectionPage.searchField.click({ force: true });
      await cardCollectionPage.searchField.type(data.keyword);
      await cardCollectionPage.cardTitleByText(data.cardTitle1);
      await cardCollectionPage.cardTitleByText(data.cardTitle2);
      await cardCollectionPage.cardTitleByText(data.cardTitle3);
      await cardCollectionPage.cardTitleByText(data.cardTitle4);
      await cardCollectionPage.cardTitleByText(data.cardTitle5);
      await cardCollectionPage.cardTitleByText(data.cardTitle6);
    });
    await test.step('Apply filter for card collection', async () => {
      await cardCollectionPage.clearAll.click();
      const result = await cardCollectionPage.cardsResults.textContent();
      const firstResultNumber = parseInt(result.match(/\d+/)[0], 10);
      await expect(firstResultNumber).toBeGreaterThan(data.numberOfFilteredCards);
      await cardCollectionPage.dateFilterButton.click();
      await cardCollectionPage.flterLast90Days.click();
      const numberResultAfterFilter = await cardCollectionPage.cardsResults.textContent();
      const secondResultNumber = parseInt(numberResultAfterFilter.match(/\d+/)[0], 10);
      await expect(firstResultNumber).toBeGreaterThan(secondResultNumber);
      await cardCollectionPage.dateFilterButton.click();
      await cardCollectionPage.flterLast90Days.click();
      const lastFilterResults = await cardCollectionPage.cardsResults.textContent();
      const lastResultNumberAfter = parseInt(lastFilterResults.match(/\d+/)[0], 10);
      await expect(lastResultNumberAfter).toBeGreaterThan(secondResultNumber);
    });
  });
  // @card-collection-one-tag-configured
  test(`${features[1].name},${features[1].tags}`, async ({ page }) => {
    const { data } = features[1];
    await test.step('Go to card collection page', async () => {
      await page.goto(`${features[1].path}`);
      await page.waitForLoadState('domcontentloaded');
      await cardCollectionPage.cardTitleByText(data.cardTitle1);
      await cardCollectionPage.cardTitleByText(data.cardTitle2);
      expect(cardCollectionPage.sideFilter).toBeVisible();
      expect(cardCollectionPage.dateFilterButton).not.toBeVisible();
      expect(cardCollectionPage.pagination).not.toBeVisible();
      expect(cardCollectionPage.cardContent).not.toBeVisible();
    });
  });
  // @card-collection-and-logic
  test(`${features[2].name},${features[2].tags}`, async ({ page }) => {
    const { data } = features[2];
    await test.step('Go to card collection page', async () => {
      await page.goto(`${features[2].path}`);
      await page.waitForLoadState('domcontentloaded');
      await cardCollectionPage.cardTitleByText(data.cardTitle1);
      await cardCollectionPage.cardTitleByText(data.cardTitle2);
    });
    await test.step('Check filter panel', async () => {
      expect(cardCollectionPage.sideFilter).not.toBeVisible();
      expect(cardCollectionPage.dateFilterButton).not.toBeVisible();
    });
    await test.step('Check sorting', async () => {
      const firstCardOriginal = await cardCollectionPage.getFirstCardTitle();
      await cardCollectionPage.selectDateSort(data.oldestSort);
      const firstCardAfterOldest = await cardCollectionPage.getFirstCardTitle();
      expect(firstCardAfterOldest).not.toBe(firstCardOriginal);
      await cardCollectionPage.selectDateSort(data.newstSort);
      const firstCardAfterNewst = await cardCollectionPage.getFirstCardTitle();
      expect(firstCardAfterNewst).not.toBe(firstCardAfterOldest);
    });
  });
  // @card-collection-or-logic
  test(`${features[3].name},${features[3].tags}`, async ({ page}) => {
    const { data } = features[3];
    await test.step('Go to card collection page', async () => {
      await page.goto(`${features[3].path}`);
      await page.waitForLoadState('domcontentloaded');
      await cardCollectionPage.cardTitleByText(data.cardTitle1);
      await cardCollectionPage.nextButton.click();
      await cardCollectionPage.cardTitleByText(data.cardTitle2);
      await cardCollectionPage.prevButton.click();
    });
  });
  // @card-collection-and-or-logic
  test(`${features[4].name},${features[4].tags}`, async ({ page }) => {
    const { data } = features[4];
    await test.step('Go to card collection page', async () => {
      await page.goto(`${features[4].path}`);
      await page.waitForLoadState('domcontentloaded');
      await cardCollectionPage.cardTitleByText(data.cardTitle1);
      await cardCollectionPage.cardTitleByText(data.cardTitle2);
      await cardCollectionPage.page2Button.click();
      await cardCollectionPage.cardTitleByText(data.cardTitle3);
      await cardCollectionPage.page1Button.click();
      await cardCollectionPage.cardTitleByText(data.cardTitle1);
      await cardCollectionPage.cardTitleByText(data.cardTitle2);
    });
  });
  // @card-collection-page-without-cards
  test(`${features[5].name},${features[5].tags}`, async ({ page }) => {
    await test.step('Go to card collection page', async () => {
      await page.goto(`${features[5].path}`);
      await page.waitForLoadState('domcontentloaded');
      await cardCollectionPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await expect(cardCollectionPage.noResults).toBeVisible();
    });
  });
  // @multiple-card-collections-on-one-page
  test(`${features[6].name},${features[6].tags}`, async ({ page }) => {
    const { data } = features[6];

    const extractNumber = (s) => {
      const m = (s ?? '').match(/\d+/);
      return m ? Number(m[0]) : 0;
    };

    await test.step('Go to card collection page', async () => {
      await page.goto(`${features[6].path}`);
      await page.waitForLoadState('domcontentloaded');
      await expect(cardCollectionPage.mainCollection).toBeVisible();
      await expect(cardCollectionPage.additionalCollection).toBeVisible();
      await expect(cardCollectionPage.cardsResults).toHaveCount(2, { timeout: 20000 });
      await expect(cardCollectionPage.cardsResults.first()).toContainText(/\d+/);
      await expect(cardCollectionPage.cardsResults.nth(1)).toContainText(/\d+/);
    });
    await test.step('Filter main collection', async () => {

      const firstText = await cardCollectionPage.cardsResults.first().innerText();
      const secondText = await cardCollectionPage.cardsResults.nth(1).innerText();

      const mainCollectionResults = extractNumber(firstText);
      const assitionalCollectionresults = extractNumber(secondText);

      await expect(mainCollectionResults).toBeGreaterThanOrEqual(assitionalCollectionresults);

      await cardCollectionPage.productFilter.click();
      await expect(cardCollectionPage.productFilterPanel).toBeVisible();
      const checkBox = cardCollectionPage.filterCheckbox(data.btnRole, data.checkBoxAfterEffects);
      await expect(checkBox).toBeVisible();
      await expect(checkBox).toBeEnabled();

      const firstLocator = cardCollectionPage.cardsResults.first();
      await checkBox.click();
      await expect(checkBox).toBeChecked();
      await expect(firstLocator).not.toHaveText(firstText);

      const firstTextAfter = await firstLocator.innerText();
      await cardCollectionPage.cardsResults.nth(1).scrollIntoViewIfNeeded();
      await page.locator('.progress-circle-wrapper').waitFor({ state: 'hidden' });
      
      const secondTextAfter = await cardCollectionPage.cardsResults.nth(1).innerText();
  
      const mainAfter = extractNumber(firstTextAfter);
      const additionalAfter = extractNumber(secondTextAfter);
      
      console.log('Main collection results after filter:', mainAfter);
      console.log('Additional collection results after filter:', additionalAfter);
  
      await expect(mainAfter).toBeLessThan(additionalAfter);
    });
    await test.step('Sort main collection', async () => {
      await cardCollectionPage.clearAll.click();
      await expect(cardCollectionPage.checkedFilterButton).not.toBeVisible();
      const mainCardTitleBefore = await cardCollectionPage.getFirstCardMainCollection();
      const additionalCardTitleBefore = await cardCollectionPage.getFirstCardAdditionalCollection();

      await cardCollectionPage.selectDateSort(data.oldestSort);

      await expect
        .poll(async () => await cardCollectionPage.getFirstCardMainCollection())
        .not.toBe(mainCardTitleBefore);

      const mainCardTitleAfter = await cardCollectionPage.getFirstCardMainCollection();
      const additionalCardTitleAfter = await cardCollectionPage.getFirstCardAdditionalCollection();

      await expect(mainCardTitleBefore).not.toBe(mainCardTitleAfter);
      await expect(additionalCardTitleBefore).toBe(additionalCardTitleAfter);
    });
  });
  // @card-collection-mutually-exclusive-filters-across-groups
  test(`${features[7].name},${features[7].tags}`, async ({ page }) => {
    const { data } = features[7];
    await test.step('Go to card collection page', async () => {
      await page.goto(`${features[7].path}`);
      await page.waitForLoadState('domcontentloaded');
      await cardCollectionPage.searchField.waitFor({ state: 'visible', timeout: 10000 });
    });
    await test.step('Search and Filter Collection', async () => {
      await cardCollectionPage.searchField.click({ force: true });
      await cardCollectionPage.searchField.type(data.keyword);
      await cardCollectionPage.expectResultsNumber(data.numberOfFilteredCards);
      await cardCollectionPage.filterCheckbox(data.buttonRole, data.topicFilter).click();
      await cardCollectionPage.filterCheckbox(data.btnRoleFileSign, data.checkBoxFileSign).click();
      await cardCollectionPage.expectResultsNumber(data.topicFilterResults);
      await cardCollectionPage.productFilter.click();
      await cardCollectionPage.filterCheckbox(data.btnRoleAfterEffects, data.checkBoxAfterEffects).click();
      await expect(cardCollectionPage.noResults).toBeVisible();
      await cardCollectionPage.filterCheckbox(data.btnRoleAfterEffects, data.checkBoxAfterEffects).click();
      await cardCollectionPage.filterCheckbox(data.btnRoleB2B, data.checkBoxB2B).click();
      await cardCollectionPage.expectResultsNumber(data.b2bFilterResults);
      await cardCollectionPage.clearAll.click();
    });
  });
  // @card-collection-or-logic-inside-same-group
  test(`${features[8].name},${features[8].tags}`, async ({ page }) => {
    const { data } = features[8];
    await test.step('Go to card collection page', async () => {
      await page.goto(`${features[8].path}`);
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Search and Filter Collection', async () => {
      await cardCollectionPage.productFilter.click();
      await cardCollectionPage.filterCheckbox(data.btnRoleInDesign, data.checkBoxInDesign).click();
      await cardCollectionPage.expectResultsNumber(data.numberOfFilteredCards);
      await cardCollectionPage.filterCheckbox(data.btnRolePremiereRush, data.checkBoxPremiereRush).click();
      await cardCollectionPage.expectResultsNumber(data.topicPremiereResults);
      await cardCollectionPage.filterCheckbox(data.buttonRole, data.checkBoxAfterEffects).click();
      await cardCollectionPage.expectResultsNumber(data.afterEffectsResults);
    });
  });
  // @card-collection-removing-one-of-several-active-filters
  test(`${features[9].name},${features[9].tags}`, async ({ page }) => {
    const { data } = features[9];
    await test.step('Go to card collection page', async () => {
      await page.goto(`${features[9].path}`);
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Search and Filter Collection', async () => {
      await cardCollectionPage.productFilter.click();
      await cardCollectionPage.filterCheckbox(data.btnRoleXd, data.checkBoxXdFilter).click();
      await cardCollectionPage.expectResultsNumber(data.numberOfFilteredCards);
      await cardCollectionPage.filterCheckbox(data.buttonRole, data.topicFilter).click();
      await cardCollectionPage.filterCheckbox(data.btnRoleWorkFromAnywhere, data.workFromAnywhereFilter).click();
      await cardCollectionPage.expectResultsNumber(data.topicWorkFromAnywhere);
      await cardCollectionPage.filterCheckbox(data.btnRoleWorkFromAnywhere, data.workFromAnywhereFilter).click();
      await page.reload({ waitUntil: 'networkidle' });
      await cardCollectionPage.expectResultsNumber(data.numberOfFilteredCards);
    });
  });
  // @card-collection-duplicate-tag-handling
  test(`${features[10].name},${features[10].tags}`, async ({ page }) => {
    const { data } = features[10];
    await test.step('Go to card collection page', async () => {
      await page.goto(`${features[10].path}`);
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Search and Filter Collection', async () => {
      await cardCollectionPage.productFilter.click();
      await cardCollectionPage.filterCheckbox(data.btnRoleBridge, data.checkboxBridgeFilter).click();
      await cardCollectionPage.expectResultsNumber(data.numberOfFilteredCards);
      await cardCollectionPage.filterCheckbox(data.btnRoleAudience, data.checkboxAudienceFilter).click();
      await cardCollectionPage.filterCheckbox(data.btnRolePC, data.checkBoxPClFilter).click();
      await cardCollectionPage.expectResultsNumber(data.partnerConfidential);
      await cardCollectionPage.filterCheckbox(data.buttonRole, data.topicFilter).click();
      await cardCollectionPage.filterCheckbox(data.btnRoleInvoices, data.checkBoxInvoicesFilter).click();
      await cardCollectionPage.expectResultsNumber(data.invoices);
    });
  });
  // @card-collection-overlapping-filters-inside-one-group
  test(`${features[11].name},${features[11].tags}`, async ({ page }) => {
    const { data } = features[11];
    await test.step('Go to card collection page', async () => {
      await page.goto(`${features[11].path}`);
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Search and Filter Collection', async () => {
      await cardCollectionPage.filterCheckbox(data.buttonRole, data.topicFilter).click();
      await cardCollectionPage.filterCheckbox(data.btnRole3D, data.checkBox3DFilter).click();
      await cardCollectionPage.expectResultsNumber(data.numberOfFilteredCards);
      await cardCollectionPage.filterCheckbox(data.btnRoleAudience, data.checkboxAudienceFilter).click();
      await cardCollectionPage.filterCheckbox(data.btnRoleEnterprise, data.checkBoxEnterpriseFilter).click();
      await cardCollectionPage.expectResultsNumber(data.audienceEnterpriseResult);
      await cardCollectionPage.filterCheckbox(data.btnRoleEnterprise, data.checkBoxEnterpriseFilter).click();
      await cardCollectionPage.filterCheckbox(data.btnRoleIndividual, data.checkBoxIndividualFilter).click();
      await cardCollectionPage.expectResultsNumber(data.individualResults);
    });
  });
  // @card-collection-data-filter-test-case
  test(`${features[12].name},${features[12].tags}`, async ({ page }) => {
    const { data } = features[12];
    await test.step('Go to card collection page', async () => {
      await page.goto(`${features[12].path}`);
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Check Product Categories Filter', async () => {
      await cardCollectionPage.filterCheckbox(data.btnRoleProductCategories, data.productCategoriesFilter).click();
      await cardCollectionPage.filterCheckbox(data.btnRoleUIUX, data.checkBoxUIUX).isVisible();
      await cardCollectionPage.filterCheckbox(data.btnRoleAcrobatPDF, data.checkBoxAcrobatPDF).isVisible();
      await cardCollectionPage.filterCheckbox(data.btnRole3DAR, data.checkBox3DAR).isVisible();
      await cardCollectionPage.filterCheckbox(data.btnRole3D, data.checkBox3D).isVisible();
    });
    await test.step('Search and filter by Date', async () => {
      await cardCollectionPage.searchField.type(data.keyword);
      await cardCollectionPage.expectResultsNumber(data.numberOfSearcheddCards);
      
      // Print all card titles and dates
      const cardsData = await cardCollectionPage.getAllCardTitlesAndDates();
      console.log('\n=== All Cards on Page ===');
      cardsData.forEach((card, index) => {
        console.log(`${index + 1}. Title: ${card.title} | Date: ${card.date}`);
      });
      console.log(`Total cards: ${cardsData.length}\n`);
      
      await cardCollectionPage.dateFilterButton.click();
      await cardCollectionPage.filterCheckbox(data.btnRoleCurrentMonth, data.checkBoxCurrentMonth).click();
      await cardCollectionPage.expectResultsNumber(data.numberOfCardsCurrentMonth);
      await cardCollectionPage.dateFilterButton.click();
      await cardCollectionPage.filterCheckbox(data.btnRoleCurrentMonth, data.checkBoxCurrentMonth).click();
      await cardCollectionPage.dateFilterButton.click();
      await cardCollectionPage.filterCheckbox(data.btnRolePreviousMonth, data.checkBoxPreviousMonth).click();
      await cardCollectionPage.expectResultsNumber(data.numberOfCardsPreviousMonth);
      await cardCollectionPage.dateFilterButton.click();
      await cardCollectionPage.filterCheckbox(data.btnRolePreviousMonth, data.checkBoxPreviousMonth).click();
      await cardCollectionPage.dateFilterButton.click();
      await cardCollectionPage.filterCheckbox(data.btnRoleLast90Days, data.checkBoxLast90Days).click();
      await cardCollectionPage.expectResultsNumber(data.numberOfCardsLast90Days);
    });
  });
});
