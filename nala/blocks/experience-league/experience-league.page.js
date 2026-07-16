import { expect } from '@playwright/test';

export default class ExperienceLeaguePage {
  constructor(page) {
    this.page = page;
    this.searchField = page.getByRole('searchbox', { name: 'Search' });
    this.loader = page.locator('.progress-circle-wrapper');
    this.partnerCardsCollection = page.locator('.partner-cards-collection:not(.layout-4-up)');
    this.partnerCollectionCards = this.partnerCardsCollection.locator('single-partner-card.card-wrapper');
    this.pagesTab = page.getByRole('button', { name: 'Pages' });
    this.searchCardTitles = page.locator('.search-card .card-title');
  }

  async waitForResultsToSettle() {
    await this.loader.waitFor({ state: 'hidden', timeout: 30000 });
  }

  async dismissSearchSuggestions() {
    const searchValue = await this.searchField.inputValue();
    const typeahead = this.page.locator('dialog#typeahead.suggestion-dialog-wrapper');

    await this.searchField.blur();

    if (await typeahead.isVisible()) {
      await typeahead.evaluate((dialog) => dialog.close());
    }

    await expect(typeahead).toBeHidden({ timeout: 10000 });
    await expect(this.searchField).toHaveValue(searchValue);
  }

  async clickLinkAndVerifyNewTab(link, previewUrl) {
    await expect(link).toBeVisible({ timeout: 30000 });
    await expect(link).toHaveAttribute('target', '_blank');

    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      link.click(),
    ]);

    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toBe(previewUrl);
    await expect(newPage.getByText(/404|page not found|error/i)).toBeHidden({ timeout: 10000 });
    await newPage.close();
  }

  async searchCardCollection(keyword) {
    await expect(this.searchField).toBeVisible();
    await this.searchField.fill(keyword);
    await this.searchField.press('Enter');
    await this.waitForResultsToSettle();
    await this.dismissSearchSuggestions();
    await this.partnerCardsCollection.waitFor({ state: 'visible', timeout: 30000 });
  }

  async verifyCardMetadata(data, previewUrl) {
    await this.waitForPartnerCollectionReady(data.expectedCardCount);

    const card = this.partnerCollectionCards.first();
    await expect(card).toBeVisible({ timeout: 30000 });
    await expect(card.locator('.card-title')).toContainText(data.cardTitle);
    await expect(card.getByText(data.description, { exact: true })).toBeVisible({ timeout: 30000 });
    await expect(card.getByText(data.cardDate)).toBeVisible({ timeout: 30000 });

    const cardHeaderStyle = await card.locator('.card-header').getAttribute('style');
    expect(cardHeaderStyle).toContain(data.cardImagePath);

    await expect(card.getByRole('link', { name: 'View now' })).toHaveAttribute('href', previewUrl);
  }

  async verifyCardStillDisplayed(data) {
    await this.waitForPartnerCollectionReady(data.expectedCardCount);
    await expect(this.getPartnerCollectionCardByTitle(data.cardTitle)).toBeVisible({ timeout: 30000 });
  }

  async clickViewNowLinkAndVerifyNewTab(previewUrl) {
    await this.clickLinkAndVerifyNewTab(
      this.page.getByRole('link', { name: 'View now' }),
      previewUrl,
    );
  }

  async searchOnSearchPage(keyword) {
    await expect(this.searchField).toBeVisible();
    await this.searchField.fill(keyword);
    await this.searchField.press('Enter');
    await this.waitForResultsToSettle();
    await this.dismissSearchSuggestions();
  }

  async clickPagesTab() {
    await this.pagesTab.waitFor({ state: 'visible', timeout: 30000 });
    await this.pagesTab.click();
    await this.waitForResultsToSettle();
  }

  async expandAndVerifySearchPageCard(data, previewUrl) {
    const card = this.page.locator('.search-card').filter({ hasText: data.cardTitle }).first();
    await card.waitFor({ state: 'visible', timeout: 30000 });
    await card.scrollIntoViewIfNeeded();

    try {
      await card.click({ timeout: 30000 });
    } catch {
      await card.click({ force: true });
    }

    await expect.poll(
      async () => card.evaluate((el) => el.classList.contains('expanded')),
      { timeout: 30000 },
    ).toBe(true);

    await expect(card.locator('.card-title')).toContainText(data.cardTitle);
    await expect(card.getByText(data.description, { exact: true })).toBeVisible({ timeout: 30000 });
    await expect(card.locator('.card-date')).toContainText(data.cardDate);

    const previewButton = card.locator('a.card-btn[aria-label="Open in"]');
    await expect(previewButton).toBeVisible({ timeout: 30000 });
    await expect(previewButton).toHaveAttribute('target', '_blank');
    await expect(previewButton).toHaveAttribute('href', previewUrl);

    const fileIcon = card.locator('.file-icon');
    await expect(fileIcon).toBeVisible({ timeout: 30000 });
    const iconStyle = await fileIcon.getAttribute('style');
    expect(iconStyle).toContain(data.pageIconPath);

    return card;
  }

  async verifySearchPageTopCardTitle(data) {
    await expect
      .poll(async () => {
        const title = this.searchCardTitles.first();
        await title.waitFor({ state: 'visible', timeout: 30000 });
        await expect(title).not.toHaveText('', { timeout: 30000 });
        return (await title.textContent())?.trim() ?? '';
      }, { timeout: 30000 })
      .toContain(data.cardTitle);
  }

  async clickSearchPagePreviewButtonAndVerifyNewTab(card, previewUrl) {
    await this.clickLinkAndVerifyNewTab(
      card.locator('a.card-btn[aria-label="Open in"]'),
      previewUrl,
    );
  }

  async applyIndustryFilter(industryFilter, industryCheckbox) {
    await this.page.getByRole('button', { name: industryFilter }).click();
    const checkbox = this.page.getByRole('checkbox', { name: industryCheckbox });
    await checkbox.waitFor({ state: 'visible', timeout: 30000 });

    if (!(await checkbox.isChecked())) {
      await checkbox.click();
    }

    await this.waitForResultsToSettle();
  }

  async waitForPartnerCollectionReady(expectedCount) {
    await this.waitForResultsToSettle();
    await this.partnerCardsCollection.waitFor({ state: 'visible', timeout: 30000 });
    await expect
      .poll(async () => this.partnerCollectionCards.count(), { timeout: 30000 })
      .toBe(expectedCount);
  }

  getPartnerCollectionCardByTitle(title) {
    return this.partnerCollectionCards.filter({ hasText: title }).first();
  }
}
