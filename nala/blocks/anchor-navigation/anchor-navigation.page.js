import { expect } from '@playwright/test';

export default class AnchorNavigationPage {
  constructor(page) {
    this.page = page;
    this.viewAllResourcesLink = page.getByRole('link', { name: 'View all resources' });
    this.productResourcesHeading = page.locator('#view-all-product-resources');
  }

  async verifyProductResourcesHeadingVisible(headingText) {
    await expect(this.productResourcesHeading).toBeVisible({ timeout: 30000 });
    await expect(this.productResourcesHeading).toHaveText(headingText);
  }

  async clickViewAllResources() {
    await expect(this.viewAllResourcesLink).toBeVisible({ timeout: 30000 });
    await this.viewAllResourcesLink.click();
  }

  async verifyUrlContainsHash(anchorHash) {
    await expect(this.page).toHaveURL(new RegExp(`${anchorHash.replace('#', '\\#')}$`));
  }
}
