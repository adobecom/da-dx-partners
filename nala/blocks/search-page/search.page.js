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
  }

  async getCardTitle() {
    const titleText = (await this.cardTilte.textContent()).trim();
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

  getCardDateLocator(card) {
    return card.locator('.card-date');
  }

  getCardSizeLocator(card) {
    return card.locator('.card-size');
  }

  getCardTagByText(card, tagText) {
    return card.locator('.card-tag').filter({ hasText: tagText });
  }

  async verifyCardTag(card, tagText) {
    const tag = this.getCardTagByText(card, tagText);
    await expect(tag).toBeVisible();
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
}