import { expect } from '@playwright/test';

export default class EventsPage {
  constructor(page) {
    this.page = page;
    this.cardsResults = page.locator('.partner-cards-cards-results strong');
    this.productFilter = page.getByLabel('Products');
    this.filterRegion = page.getByRole('button', { name: 'Region' });
  }

  async verifyPublicCardTitle(cardTitle) {
    const cardTitleLocator = this.page
      .locator('.card-title')
      .filter({ hasText: cardTitle });
  
    await expect(cardTitleLocator).toHaveText(cardTitle);
  }

  async verifyCardNotVisible(cardTitle) {
    const allCardTitles = await this.page.locator('.card-title').allTextContents();
    const cardExists = allCardTitles.some(title => title.trim() === cardTitle);
    await expect(cardExists).toBe(false);
  }

  async getResultsNumber() {
    const results = await this.cardsResults.textContent();
    const firstResultAfterFilter = parseInt(results.match(/\d+/)[0], 10);
    return firstResultAfterFilter;
  }
  filterCheckbox(role, name) {
    return this.page.getByRole(role, { name, exact: true });
  }

  getFirstFilterCheckbox(filterContainer = null) {
    const list = filterContainer || this.page.getByRole('list');
    return list.locator('sp-checkbox').first();
  }
}