export default class AnalyticsAttributesPage {
  constructor(page) {
    this.page = page;
    this.searchField = page.getByRole('searchbox', { name: 'Search' });
  }

  byDaaLh(daaLh) {
    return this.page.locator(`[daa-lh="${daaLh}"]`);
  }

  getPartnerCards() {
    return this.page.locator('div.partner-cards[daa-lh^="Card Collection |"]');
  }

  buildCardCollectionDaaLh({ filters = 'No Filters', searchQuery = 'None' } = {}) {
    return `Card Collection | Filters: ${filters} | Search Query: ${searchQuery}`;
  }

  extractFilterFromDaaLh(daaLh = '') {
    const match = daaLh.match(/Filters:\s*(.+?)\s*\|\s*Search Query:/);
    return match?.[1]?.trim() ?? '';
  }

  async getPartnerCardsDaaLh() {
    return (await this.getPartnerCards().getAttribute('daa-lh')) ?? '';
  }

  async waitForPartnerCardsDaaLh(expectedDaaLh, timeout = 30000) {
    await this.getPartnerCards().waitFor({ state: 'visible', timeout: 30000 });

    const start = Date.now();
    while (Date.now() - start < timeout) {
      const actualDaaLh = await this.getPartnerCardsDaaLh();
      if (actualDaaLh === expectedDaaLh) {
        return;
      }
      await this.page.waitForTimeout(250);
    }

    const actualDaaLh = await this.getPartnerCardsDaaLh();
    throw new Error(
      `Expected partner cards daa-lh "${expectedDaaLh}" but got "${actualDaaLh}"`,
    );
  }

  async verifyInitialCardCollectionDaaLh() {
    await this.waitForPartnerCardsDaaLh(this.buildCardCollectionDaaLh());
  }

  async search(searchKeyWord) {
    const { searchField } = this;
    await searchField.waitFor({ state: 'visible', timeout: 30000 });
    await searchField.fill(searchKeyWord);
    await searchField.press('Enter');
  }

  async getFilter(filter) {
    const filterElement = this.page.getByLabel(filter);
    await filterElement.click();
  }

  getCheckBox(checkBoxName) {
    return this.page.getByRole('checkbox', { name: checkBoxName });
  }

  getFilterPanel(filter) {
    return this.page.locator('.filter').filter({ has: this.page.getByLabel(filter) });
  }

  async getCheckboxName(checkbox) {
    const ariaLabel = await checkbox.getAttribute('aria-label');
    if (ariaLabel?.trim()) {
      return ariaLabel.trim();
    }

    return checkbox.evaluate((input) => {
      const id = input.getAttribute('id');
      const label = id
        ? input.ownerDocument.querySelector(`label[for="${id}"]`)
        : input.closest('label');

      return (label?.textContent || input.getAttribute('aria-label') || '').trim();
    });
  }

  async clickFirstCheckboxInFilter(filter) {
    await this.getFilter(filter);

    const filterPanel = this.getFilterPanel(filter);
    await filterPanel.waitFor({ state: 'visible', timeout: 30000 });

    const firstLabel = filterPanel.locator('label:has(input[type="checkbox"])').first();
    if (await firstLabel.count()) {
      await firstLabel.waitFor({ state: 'visible', timeout: 30000 });
      await firstLabel.click();
    } else {
      const firstCheckbox = filterPanel.getByRole('checkbox').first();
      await firstCheckbox.waitFor({ state: 'visible', timeout: 30000 });
      await firstCheckbox.click();
    }

    await this.getPartnerCards().waitFor({ state: 'visible', timeout: 30000 });

    const start = Date.now();
    while (Date.now() - start < 30000) {
      const appliedFilter = this.extractFilterFromDaaLh(await this.getPartnerCardsDaaLh());
      if (appliedFilter && appliedFilter !== 'No Filters') {
        return appliedFilter;
      }
      await this.page.waitForTimeout(250);
    }

    throw new Error(`Filter was not applied on partner cards after selecting "${filter}"`);
  }

  async verifyPartnerCardsDaaLh({ searchQuery, selectedFilter }) {
    const expectedDaaLh = this.buildCardCollectionDaaLh({
      filters: selectedFilter,
      searchQuery,
    });

    await this.waitForPartnerCardsDaaLh(expectedDaaLh);
  }
}
