import { expect } from '@playwright/test';

export default class EventsPage {
  constructor(page) {
    this.page = page;
    this.cardsResults = page.locator('.partner-cards-cards-results strong');
    this.productFilter = page.getByLabel('Products');
    this.filterRegion = page.getByRole('button', { name: 'Region' });
    this.japanRegion = page.getByRole('checkbox', { name: 'Japan' });
    this.partnerCradCollection = page.locator('.partner-cards-collection ');
    this.searchField = page.locator('.input');
  }

  async verifyPublicCardTitle(cardTitle) {
    const cardTitleLocator = this.page
      .locator('.card-title')
      .filter({ hasText: cardTitle });

    await expect(cardTitleLocator).toHaveText(cardTitle);
  }

  async verifyCardDateDaysFromToday(cardTitle, daysFromToday) {
    const card = this.page.locator('.single-partner-card').filter({ has: this.page.locator('.card-title', { hasText: cardTitle }) });
    const dateText = (await card.locator('.card-date').textContent()).trim();
    const datePart = dateText.split('|')[0].trim();
    const displayed = new Date(datePart);
    displayed.setHours(0, 0, 0, 0);

    const expected = new Date();
    expected.setHours(0, 0, 0, 0);
    expected.setDate(expected.getDate() + daysFromToday);

    expect(
      displayed.getTime(),
      `Card date "${datePart}" should be ${daysFromToday} days from today (${expected.toDateString()})`,
    ).toBe(expected.getTime());
  }

  async verifyCardNotVisible(cardTitle) {
    const allCardTitles = await this.page.locator('.card-title').allTextContents();
    const cardExists = allCardTitles.some((title) => title.trim() === cardTitle);
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
