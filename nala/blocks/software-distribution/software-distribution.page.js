import { expect } from '@playwright/test';

export default class SoftwareDistributionPage {
  constructor(page) {
    this.page = page;
    this.requestAccessButton = page.getByRole('link', { name: 'Request access to Software Distribution' });
    this.badRequestCta = page.getByRole('link', { name: 'Example of a bad request' });
  }

  getMessage(messageText) {
    return this.page.getByText(messageText, { exact: true });
  }

  async clickRequestAccess() {
    await expect(this.requestAccessButton).toBeVisible({ timeout: 30000 });
    await expect(this.requestAccessButton).toBeEnabled();

    const responsePromise = this.page
      .waitForResponse(
        (response) => {
          const type = response.request().resourceType();
          return (type === 'fetch' || type === 'xhr') && response.status() < 500;
        },
        { timeout: 60000 },
      )
      .catch(() => null);

    await this.requestAccessButton.click();
    await responsePromise;
  }

  async clickBadRequestCta() {
    await expect(this.badRequestCta).toBeVisible({ timeout: 30000 });
    await expect(this.badRequestCta).toBeEnabled();

    const responsePromise = this.page
      .waitForResponse(
        (response) => {
          const type = response.request().resourceType();
          return (type === 'fetch' || type === 'xhr') && response.status() < 500;
        },
        { timeout: 60000 },
      )
      .catch(() => null);

    await this.badRequestCta.click();
    await responsePromise;
  }

  async verifySuccessMessage(successMessage) {
    const message = this.getMessage(successMessage);
    await message.waitFor({ state: 'visible', timeout: 60000 });
    await expect(message).toBeVisible();
  }

  async verifyFailMessage(failMessage) {
    const message = this.getMessage(failMessage);
    await message.waitFor({ state: 'visible', timeout: 60000 });
    await expect(message).toBeVisible();
  }

  async verifyRequestAccessButtonNotVisible() {
    await expect(this.requestAccessButton).not.toBeVisible();
  }
}
