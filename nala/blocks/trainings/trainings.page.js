import { expect } from '@playwright/test';
import SearchPage from '../search-page/search.page.js';

export default class TrainingPage extends SearchPage {
  constructor(page) {
    super(page);
    this.cardTitles = page.locator('.card-title');
    this.cardCollectionSearchField = page.getByRole('searchbox', { name: 'Search' });
    this.contentTypeFilter = page.getByRole('button', { name: 'Content Type' });
    this.productsFilter = page.getByLabel('Products');
    this.audienceTypeFilter = page.getByRole('button', { name: 'Audience Type' });
    this.technicalLevelFilter = page.getByRole('button', { name: 'Technical Level' });
    this.courseCheckBox = page.getByRole('checkbox', { name: 'Course' });
    this.adobeCampaignCheckBox = page.getByRole('checkbox', { name: 'Adobe Campaign' });
    this.businessPractitionerCheckBox = page.getByRole('checkbox', { name: 'Business Practitioner' });
    this.developerCheckBox = page.getByRole('checkbox', { name: 'Developer', exact: true });
    this.technicalSalesCheckBox = page.getByRole('checkbox', { name: 'Technical Sales' });
    this.beginnerCheckBox = page.getByRole('checkbox', { name: 'Beginner' });
    this.partnerCardsCollection = page.locator('.partner-cards-collection:not(.layout-4-up)');
    this.partnerCollectionCards = this.partnerCardsCollection.locator('single-partner-card.card-wrapper');
    this.partnerCollectionCardTitles = this.partnerCardsCollection.locator('.card-title');
  }

  async getCardTitleAtIndex(index) {
    const title = this.cardTitles.nth(index);
    await title.waitFor({ state: 'visible', timeout: 30000 });
    await expect(title).not.toHaveText('', { timeout: 30000 });
    return (await title.textContent())?.trim() ?? '';
  }

  async getAllCardTitles() {
    await this.cardTitles.first().waitFor({ state: 'visible', timeout: 15000 });
    const titles = await this.cardTitles.allTextContents();
    return titles.map((title) => title.trim()).filter(Boolean);
  }

  async dismissSearchSuggestions() {
    await this.page.keyboard.press('Escape');
    await this.searchField.blur();

    const suggestions = this.page.locator(
      '[role="listbox"], [role="dialog"], .search-suggestions, .suggestions-panel',
    );
    if ((await suggestions.count()) > 0) {
      await suggestions
        .first()
        .waitFor({ state: 'hidden', timeout: 5000 })
        .catch(() => {});
    }

    await this.searchAllResults.waitFor({ state: 'visible', timeout: 10000 });
    await this.searchAllResults.click();
  }

  async verifyTrainingSearchResults(data) {
    await this.waitForResultsToSettle();

    if (data.secondResultTitle) {
      const firstTitle = await this.getCardTitleAtIndex(0);
      expect(firstTitle).toBe(data.firstResultTitle);
      const secondTitle = await this.getCardTitleAtIndex(1);
      expect(secondTitle).toBe(data.secondResultTitle);
      return;
    }

    const firstTitle = await this.getCardTitleAtIndex(0);
    expect(firstTitle).toBe(data.topResultTitle);

    const allTitles = await this.getAllCardTitles();
    expect(allTitles).not.toContain(data.excludedResultTitle);

    if (allTitles.length > 1) {
      expect(allTitles[1]).not.toBe(data.excludedResultTitle);
    }
  }

  getTrainingCardButton(card) {
    return card.locator('a.card-btn[aria-label="Open in"]');
  }

  async clickCard(card, timeout = 30000) {
    await card.waitFor({ state: 'visible', timeout });
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible({ timeout });
    try {
      await card.click({ timeout });
    } catch {
      await card.click({ force: true });
    }
    await this.waitForCardToExpand(card, timeout);
  }

  async verifyTrainingCardButtonLink(card, hrefPart) {
    const buttonLink = this.getTrainingCardButton(card);
    await expect(buttonLink).toBeVisible({ timeout: 30000 });
    await expect(buttonLink).toBeEnabled();
    await expect(buttonLink).toHaveAttribute('target', '_blank');
    const href = await buttonLink.getAttribute('href');
    expect(href).toContain(hrefPart);
  }

  async verifyExpandedTrainingDetails(card, data) {
    const cardDate = this.getCardDateLocator(card);
    await expect(cardDate).toContainText(data.lastModifiedDate);

    await expect(card.getByText(data.shortDescription, { exact: true })).toBeVisible({ timeout: 30000 });

    await this.verifyTrainingCardButtonLink(card, data.previewUrl);
  }

  async selectFilterCheckbox(checkbox) {
    await checkbox.waitFor({ state: 'visible', timeout: 30000 });
    if (!(await checkbox.isChecked())) {
      await checkbox.click();
    }
    await this.waitForResultsToSettle();
  }

  async applyTagMappingFilters() {
    await this.contentTypeFilter.click();
    await this.selectFilterCheckbox(this.courseCheckBox);

    await this.productsFilter.click();
    await this.selectFilterCheckbox(this.adobeCampaignCheckBox);

    await this.audienceTypeFilter.click();
    await this.selectFilterCheckbox(this.businessPractitionerCheckBox);
    await this.selectFilterCheckbox(this.developerCheckBox);
    await this.selectFilterCheckbox(this.technicalSalesCheckBox);

    await this.technicalLevelFilter.click();
    await this.selectFilterCheckbox(this.beginnerCheckBox);
  }

  async getPartnerCollectionCardTitleAtIndex(index) {
    const title = this.partnerCollectionCardTitles.nth(index);
    await title.waitFor({ state: 'visible', timeout: 15000 });
    await expect(title).not.toHaveText('', { timeout: 15000 });
    return (await title.textContent())?.trim() ?? '';
  }

  getPartnerCollectionCardByTitle(title) {
    return this.partnerCollectionCards.filter({ hasText: title }).first();
  }

  getPartnerCollectionCardHeader(card) {
    return card.locator('.card-header');
  }

  async verifyPartnerCollectionSearchResults(data) {
    await this.waitForResultsToSettle();
    await this.partnerCardsCollection.waitFor({ state: 'visible', timeout: 30000 });

    await expect
      .poll(async () => this.partnerCollectionCards.count(), { timeout: 30000 })
      .toBe(data.expectedResultCount);

    const firstTitle = await this.getPartnerCollectionCardTitleAtIndex(0);
    expect(firstTitle).toContain(data.firstResultTitle);

    const secondTitle = await this.getPartnerCollectionCardTitleAtIndex(1);
    expect(secondTitle).toBe(data.secondResultTitle);
  }

  async verifyPartnerCollectionCardThumbnail(title, thumbnailUrl) {
    const card = this.getPartnerCollectionCardByTitle(title);
    await expect(card).toBeVisible({ timeout: 30000 });

    const cardHeader = this.getPartnerCollectionCardHeader(card);
    await expect(cardHeader).toBeVisible({ timeout: 30000 });

    const style = await cardHeader.getAttribute('style');
    expect(style).toContain(thumbnailUrl);
  }

  async verifyPartnerCollectionCardThumbnails(cardThumbnails) {
    for (const { title, thumbnailUrl } of cardThumbnails) {
      await this.verifyPartnerCollectionCardThumbnail(title, thumbnailUrl);
    }
  }

  async verifyFilteredTrainingResult(data) {
    await this.waitForResultsToSettle();
    await this.partnerCardsCollection.waitFor({ state: 'visible', timeout: 30000 });

    await expect
      .poll(async () => this.partnerCollectionCards.count(), { timeout: 30000 })
      .toBe(data.expectedResultCount);

    const title = await this.getPartnerCollectionCardTitleAtIndex(0);
    expect(title).toBe(data.expectedResultTitle);

    await expect(
      this.partnerCollectionCards.filter({ hasText: data.expectedResultTitle }),
    ).toHaveCount(data.expectedResultCount);
  }

  async verifyRetiredTrainingNotShownOnSearchPage(retiredTrainingTitle) {
    await this.waitForResultsToSettle();
    await this.cardTitles.first().waitFor({ state: 'visible', timeout: 30000 });

    const firstTitle = await this.getCardTitleAtIndex(0);
    expect(firstTitle).not.toBe(retiredTrainingTitle);
  }

  async verifyPartnerCollectionNoResults(noResultsMessage) {
    await this.waitForResultsToSettle();
    await this.partnerCardsCollection.waitFor({ state: 'visible', timeout: 30000 });

    await expect
      .poll(async () => this.partnerCollectionCards.count(), { timeout: 30000 })
      .toBe(0);

    await expect(this.partnerCardsCollection.getByText(noResultsMessage)).toBeVisible({ timeout: 30000 });
  }

  async dismissCardCollectionSearchSuggestions() {
    const searchValue = await this.cardCollectionSearchField.inputValue();
    const typeahead = this.page.locator('dialog#typeahead.suggestion-dialog-wrapper');

    await this.cardCollectionSearchField.blur();

    if (await typeahead.isVisible()) {
      await typeahead.evaluate((dialog) => dialog.close());
    }

    await expect(typeahead).toBeHidden({ timeout: 10000 });
    await expect(this.cardCollectionSearchField).toHaveValue(searchValue);
  }

  async searchCardCollection(keyword) {
    await expect(this.cardCollectionSearchField).toBeVisible();
    await this.cardCollectionSearchField.fill(keyword);
    await this.cardCollectionSearchField.press('Enter');
    await this.waitForResultsToSettle();
  }
}
