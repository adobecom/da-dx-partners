export default class AnalyticsAttributesPage {
    constructor(page) {
      this.page = page;
      this.searchField = page.getByRole('searchbox', { name: 'Search' });
    }
  
    byDaaLh(daaLh) {
      return this.page.locator(`[daa-lh="${daaLh}"]`);
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
  }
  