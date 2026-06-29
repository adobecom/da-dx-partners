import { expect } from '@playwright/test';

export default class SoftwareDistributionPage {
  constructor(page) {
    this.page = page;
    this.requestAccessButton = page.getByRole('link', { name: 'Request access to Software' });
    this.badRequestCta = page.getByRole('link', { name: 'Example of a bad request' });
    this.successMessage = page.getByText('Successful request.', { exact: true });
  }

  async clickRequestAccess() {
    await expect(this.requestAccessButton).toBeVisible({ timeout: 30000 });
    await this.requestAccessButton.click();
  }

  async verifySuccessMessage(successMessage) {
    await expect(this.page.getByText(successMessage, { exact: true })).toBeVisible({ timeout: 60000 });
  }

  async clickBadRequestCta() {
    await expect(this.badRequestCta).toBeVisible({ timeout: 30000 });
    await this.badRequestCta.click();
  }

  async verifyFailMessage(failMessage) {
    await expect(this.page.getByText(failMessage, { exact: true })).toBeVisible({ timeout: 60000 });
  }

  async verifyRequestAccessButtonNotVisible() {
    await expect(this.requestAccessButton).not.toBeVisible();
  }
}
