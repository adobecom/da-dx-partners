import { expect } from '@playwright/test';

export default class SearchPage {
  constructor(page) {
    this.page = page;
    this.searchField = page.getByRole('searchbox', { name: 'Search' });
    this.searchAllResults = page.getByRole('button', { name: 'All', exact: true });
    this.mostRelevant = page.getByRole('button', { name: 'most relevant' });
    this.mostRecent = page.getByRole('button', { name: 'most recent' });
    this.cardTilte = page.locator('.card-title').nth(0);
    this.cardDate = page.locator('.card-date');
    this.cardSize = page.locator('.card-size');
    this.clearSearch = page.getByRole('button', { name: 'Reset' });
    this.trainingButton = page.getByRole('button', { name: 'Trainings' });
    this.trainingPreviewButton = page.locator('.card-icons').nth(0);
    this.journeyPhaseFilter = page.getByRole('button', { name: 'Journey Phase' });
    this.exploreCheckBox = page.getByRole('checkbox', { name: 'Explore' });
    this.discoverCheckBox = page.getByRole('checkbox', { name: 'Discover' });
    this.functionalityFilter = page.getByRole('button', { name: 'Functionality' });
    this.analysisInsgightCheckBox = page.getByRole('checkbox', { name: 'Analysis & Insights' });
    this.businessSolutionFilter= page.getByRole('button', { name: 'Business Solutions' });
    this.b2bCheckBox = page.getByRole('checkbox', { name: 'B2B Orchestration' });
    this.crossFunctionalCheckBox = page.getByRole('checkbox', { name: 'Cross-functional Collaboration' });
    this.assetTitlePreview = page.locator('.asset-preview-block-header');
    this.assetDate = page.locator('p').filter({ hasText: 'Date:' });
    this.assetSummary = page.locator('p').filter({ hasText: 'Summary:' });
    this.assetType = page.locator('p').filter({ hasText: 'Type:' });
    this.assetTags = page.locator('p').filter({ hasText: 'Tags:' });
    this.assetSize = page.locator('p').filter({ hasText: 'Size:' });
    this.viewAssetButton = page.getByRole('button', { name: 'View' });
    this.downloadAssetButton = page.getByRole('button', { name: 'Download PDF' });
    this.downloadImageButton = page.getByRole('button', { name: 'Download Image' });
    this.downloadPPTButton = page.getByRole('button', { name: 'Download PPT' });
    this.downloadZIPButton = page.getByRole('button', { name: 'Download ZIP' });
    this.searchAllAssetsButton = page.getByRole('link', { name: 'Search All Assets' });
    this.training = page.locator("//p[@id='titletext' and contains(text(),'Adobe Digital Experience Partner Training')]");
    this.loader = page.locator('.progress-circle-wrapper');
    this.clearAll = page.getByRole('button', { name: 'Clear all' });
    this.oneTrustBanner = page.getByRole('button', { name: 'Enable all' });
    this.journeyPhaseFilterPanel = page.getByRole('list').filter({ hasText: 'Discover Explore Evaluate Use' });
    this.functionalityFilterPanel = page.getByRole('list').filter({ hasText: 'Data Activation Analysis &' });
    this.searchCardExpended = page.locator('.search-card.expanded');
  }

  async getCardTitle() {
    await this.cardTilte.first().waitFor({ state: 'visible', timeout: 15000 });
    await expect(this.cardTilte.first()).not.toHaveText('', { timeout: 15000 });
    const titleText = (await this.cardTilte.first().textContent())?.trim() ?? '';
    return titleText;
  }

  async getCardDate() {
    const dateText = (await this.cardDate.textContent()).trim();
    return dateText;
    console.log(dateText);
  }

  async getCardSize() {
    const sizeText = (await this.cardSize.textContent()).trim();
    return sizeText;
  }

  getCardByTitle(title) {
    return this.page.locator('.search-card').filter({ hasText: title }).first();
  }

  async clickCard(card, timeout = 15000) {
    await card.waitFor({ state: 'visible', timeout });
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible({ timeout });
    await card.click({ timeout });
    await this.waitForCardToExpand(card, timeout);
    
    // Check if card is expanded, if not try clicking again
    try {
      await this.searchCardExpended.waitFor({ state: 'visible', timeout: 10000 });
    } catch (error) {
      await card.click({ timeout });
      await this.waitForCardToExpand(card, timeout);
      await this.searchCardExpended.waitFor({ state: 'visible', timeout: 10000 });
    }
  }

  getCardDateLocator(card) {
    return card.locator('.card-date');
  }

  getCardSizeLocator(card) {
    return card.locator('.card-size');
  }

  getCardTagByText(card, tagText) {
    return card.locator('.card-tag').filter({ hasText: tagText });
  }

  async waitForCardToExpand(card, timeout = 10000) {
    await expect.poll(
      async () => {
        const classList = await card.evaluate((el) => el.classList.toString());
        return classList.includes('expanded');
      },
      { timeout }
    ).toBe(true);
  }

  async verifyCardTag(card, tagText) {
    // Check if card is expanded, if not click it
    const isExpanded = await card.evaluate((el) => el.classList.contains('expanded')).catch(() => false);
    
    if (!isExpanded) {
      await card.click({ timeout: 15000 });
      await this.waitForCardToExpand(card, 15000);
      await this.searchCardExpended.waitFor({ state: 'visible', timeout: 10000 });
    }
    
    const tag = this.getCardTagByText(card, tagText);
    await expect(tag).toBeVisible({ timeout: 10000 });
    const text = await tag.textContent();
    expect(text.trim()).toBe(tagText);
  }

  getCardButtonLink(card, expectedUrl) {
    return card.locator(`a[href="${expectedUrl}"]`);
  }

  async verifyCardButtonLink(card, expectedUrl) {
    const buttonLink = this.getCardButtonLink(card, expectedUrl);
    await expect(buttonLink).toBeVisible();
    const href = await buttonLink.getAttribute('href');
    expect(href).toBe(expectedUrl);
  }

  async getNumberOfResults() {
    const text = await this.searchAllResults.textContent();
    const match = text.match(/\((\d+)\)/);
    const numberResults = Number(match[1]);
    return numberResults;
  }

  async waitForNumberOfResults(expectedMin, timeout = 30_000) {
    await expect
      .poll(
        async () => {
          const text = await this.searchAllResults.textContent();
          const match = text?.match(/\((\d+)\)/);
          return match ? Number(match[1]) : 0;
        },
        { timeout }
      )
      .toBeGreaterThanOrEqual(expectedMin);
  }

  async waitForResultsToSettle() {
    await this.loader.waitFor({ state: 'hidden', timeout: 30000 });
  }
}