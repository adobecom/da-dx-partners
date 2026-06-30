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
    const message = this.page.getByText(successMessage, { exact: true });
    await message.waitFor({ state: 'visible', timeout: 60000 });
    await expect(message).toBeVisible();
  }

  async clickBadRequestCta() {
    await expect(this.badRequestCta).toBeVisible({ timeout: 30000 });
    await this.badRequestCta.click();
  }

  async verifyFailMessage(failMessage) {
    const message = this.page.getByText(failMessage, { exact: true });
    await message.waitFor({ state: 'visible', timeout: 60000 });
    await expect(message).toBeVisible();
  }

  async verifyRequestAccessButtonNotVisible() {
    await expect(this.requestAccessButton).not.toBeVisible();
  }
}
