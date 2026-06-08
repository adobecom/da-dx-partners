import { test, expect } from '@playwright/test';
import TrainingPage from './trainings.page.js';
import trainingSpec from './trainings.spec.js';
import SignInPage from '../signin/signin.page.js';

const { features } = trainingSpec;

let trainingPage;
let signInPage;

test.describe('Search Page Trainings', () => {
  test.beforeEach(async ({ page }) => {
    trainingPage = new TrainingPage(page);
    signInPage = new SignInPage(page);
  });

  test(`${features[0].name},${features[0].tags}`, async ({ page }) => {
    const { data } = features[0];

    await test.step('Go to search page and sign in as Community user', async () => {
      await page.goto(features[0].path);
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
      await signInPage.signIn(page, data.partnerLevel);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Search for training keyword', async () => {
      await expect(trainingPage.searchField).toBeVisible();
      await trainingPage.searchField.fill(data.searchKeyword);
      await trainingPage.searchField.press('Enter');
      await trainingPage.waitForResultsToSettle();
    });

    await test.step('Filter results by Trainings tab', async () => {
      await trainingPage.trainingButton.click();
      await trainingPage.waitForResultsToSettle();
    });

    await test.step('Verify training search results', async () => {
      await trainingPage.verifyTrainingSearchResults(data);
    });

    await test.step('Expand first training accordion and verify details', async () => {
      const card = trainingPage.getCardByTitle(data.topResultTitle);
      await trainingPage.clickCard(card);
      await page.waitForLoadState('domcontentloaded');

      const expandedCard = trainingPage
        .getExpandedCard()
        .filter({ hasText: data.topResultTitle })
        .first();
      await expect(expandedCard).toBeVisible({ timeout: 30000 });

      await trainingPage.verifyExpandedTrainingDetails(expandedCard, data);
    });
  });

  test(`${features[1].name},${features[1].tags}`, async ({ page }) => {
    const { data } = features[1];

    await test.step('Go to search page and sign in as Silver user', async () => {
      await page.goto(features[1].path);
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
      await signInPage.signIn(page, data.partnerLevel);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Search for training keyword', async () => {
      await expect(trainingPage.searchField).toBeVisible();
      await trainingPage.searchField.fill(data.searchKeyword);
      await trainingPage.searchField.press('Enter');
      await trainingPage.waitForResultsToSettle();
      await trainingPage.dismissCardCollectionSearchSuggestions();
    });

    await test.step('Filter results by Trainings tab', async () => {
      await trainingPage.trainingButton.click();
      await page.waitForLoadState('domcontentloaded');
      await trainingPage.waitForResultsToSettle();
    });

    await test.step('Verify training search results', async () => {
      await trainingPage.verifyTrainingSearchResults(data);
    });

    await test.step('Expand first training accordion and verify details', async () => {
      const card = trainingPage.getCardByTitle(data.topResultTitle);
      await trainingPage.clickCard(card);
      await page.waitForLoadState('domcontentloaded');

      const expandedCard = trainingPage
        .getExpandedCard()
        .filter({ hasText: data.topResultTitle })
        .first();
      await expect(expandedCard).toBeVisible({ timeout: 30000 });

      await trainingPage.verifyExpandedTrainingDetails(expandedCard, data);
    });
  });

  test(`${features[2].name},${features[2].tags}`, async ({ page }) => {
    const { data } = features[2];

    await test.step('Go to on-demand trainings page and sign in as Gold user', async () => {
      await page.goto(features[2].path);
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
      await signInPage.signIn(page, data.partnerLevel);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Search for training keyword in card collection', async () => {
      await trainingPage.searchCardCollection(data.searchKeyword);
    });

    await test.step('Apply tag filters in filter panel', async () => {
      await trainingPage.applyTagMappingFilters();
    });

    await test.step('Verify filtered training result', async () => {
      await trainingPage.verifyFilteredTrainingResult(data);
    });
  });

  test(`${features[3].name},${features[3].tags}`, async ({ page }) => {
    const { data } = features[3];

    await test.step('Go to on-demand trainings page and sign in as Silver user', async () => {
      await page.goto(features[3].path);
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
      await signInPage.signIn(page, data.partnerLevel);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Search for training keyword in card collection', async () => {
      await trainingPage.searchCardCollection(data.searchKeyword);
    });

    await test.step('Verify training search results in card collection', async () => {
      await trainingPage.verifyPartnerCollectionSearchResults(data);
    });

    await test.step('Validate training preview thumbnails', async () => {
      await trainingPage.verifyPartnerCollectionCardThumbnails(data.cardThumbnails);
    });
  });

  test(`${features[4].name},${features[4].tags}`, async ({ page, context }) => {
    const { data } = features[4];

    await test.step('Go to search page', async () => {
      await page.goto(features[4].path);
    });

    await test.step('Sign in as Platinum user', async () => {
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
      await signInPage.signIn(page, data.partnerLevel);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Search for retired training in search bar', async () => {
      await expect(trainingPage.searchField).toBeVisible();
      await trainingPage.searchField.fill(data.searchKeyword);
      await trainingPage.searchField.press('Enter');
      await trainingPage.waitForResultsToSettle();
    });

    await test.step('Click Trainings tab in quick filters', async () => {
      await trainingPage.trainingButton.click();
      await trainingPage.waitForResultsToSettle();
    });

    await test.step('Verify top training title is not retired training', async () => {
      await trainingPage.verifyRetiredTrainingNotShownOnSearchPage(data.retiredTrainingTitle);
    });

    await test.step('Open on-demand trainings in new tab and search card collection', async () => {
      const cardCollectionPage = await context.newPage();
      const cardCollectionTrainingPage = new TrainingPage(cardCollectionPage);

      await cardCollectionPage.goto(data.onDemandTrainingsPath);
      await cardCollectionPage.waitForLoadState('domcontentloaded');
      await cardCollectionTrainingPage.searchCardCollection(data.searchKeyword);
      await cardCollectionTrainingPage.verifyPartnerCollectionNoResults(data.noResultsMessage);

      await cardCollectionPage.close();
    });
  });
});
