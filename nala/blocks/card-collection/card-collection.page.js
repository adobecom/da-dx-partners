import { expect } from '@playwright/test';

export default class CardCollectionPage {
  constructor(page) {
    this.page = page;
    this.searchField = page.locator('.input');
    this.clearAll = page.locator('.sidebar-clear-btn');
    this.cardsResults = page.locator('.partner-cards-cards-results');
    this.dateFilterButton = page.locator('button.filter-header >> text=Date');
    this.flterLast90Days = page.getByRole('button', { name: 'Last 90 days' });
    this.sideFilter = page.locator('.partner-cards-sidebar-wrapper');
    this.pagination = page.locator('.pagination-pages-list');
    this.cardContent = page.locator('.card-content');
    this.sortButton = page.locator('.sort-btn');
    this.cards = page.locator('.card-wrapper');
    this.nextButton = page.locator('.pagination-next-btn ');
    this.prevButton = page.locator('.pagination-prev-btn ');
    this.page2Button = page.locator('button[aria-label="Page 2"]');
    this.page1Button = page.locator('button[aria-label="Page 1"]');
    this.noResults = page.locator('.no-results-title');
    this.mainCollection = page.locator('div.content:has(p:has-text("Main Card Collection with filters and sorting"))');
    this.additionalCollection = page.locator('div.content:has(p:has-text("Additional Card Collection without filters and sorting"))');
    this.productFilter = page.getByLabel('Products');
    this.partnerCardCollection = page.locator('.partner-cards-collection ');
    this.inproductfilter = page.getByRole('checkbox', { name: 'InDesign' });
    this.premiereRush = page.getByRole('checkbox', { name: 'Premiere Rush' });
    this.workFromAnywhere = page.getByRole('checkbox', { name: 'Work from anywhere' });
  }

  filterCheckbox(role, name) {
    return this.page.getByRole(role, { name, exact: true });
  }

  async cardTitleByText(title) {
    const card = this.page.locator(`.card-title:has-text("${title}")`);
    await expect(card)
      .toBeVisible();
  }

  async getFirstCardTitle() {
    return (await this.cards.nth(0)
      .locator('.card-title')
      .textContent()).trim();
  }

  async getFirstCardMainCollection() {
    const mainCollection = this.partnerCardCollection.first();
    const firstCardTitle = await mainCollection.locator('.card-content')
      .first()
      .textContent();
    return firstCardTitle.trim();
  }

  async getFirstCardAdditionalCollection() {
    const additionalCollection = this.partnerCardCollection.nth(1);
    const firstCardTitle = await additionalCollection.locator('.card-content')
      .first()
      .textContent();
    return firstCardTitle.trim();
  }

  async expectResultsNumber(expectedValue) {
    const results = await this.cardsResults.textContent();
    const firstResultAfterFilter = parseInt(results.match(/\d+/)[0], 10);
    await expect(firstResultAfterFilter)
      .toBe(expectedValue);
  }

  async selectDateSort(value) {
    await this.sortButton.click(); // open the dropdown
    const option = this.page.locator(`button.sort-item[value="${value}"]`);
    await option.waitFor({ state: 'visible' }); // ensure it's visible
    await option.click();
    await this.page.waitForLoadState('networkidle');
  }
}
