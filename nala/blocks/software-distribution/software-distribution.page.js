import { expect } from '@playwright/test';

const GRANT_DOWNLOAD_ACCESS_URL = '**/grant-download-access**';

export default class SoftwareDistributionPage {
  constructor(page) {
    this.page = page;
    this.requestAccessButton = page.getByRole('link', { name: 'Request access to Software Distribution' });
    this.badRequestCta = page.getByRole('link', { name: 'Example of a bad request' });
  }

  getMessage(messageText) {
    return this.page.getByText(messageText, { exact: true });
  }

  async mockGrantDownloadAccessResponse(status) {
    await this.page.route(GRANT_DOWNLOAD_ACCESS_URL, async (route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(status === 200 ? { success: true } : { error: 'Unsuccessful request.' }),
      });
    });
  }

  waitForGrantDownloadAccessResponse() {
    return this.page.waitForResponse(
      (response) => response.url().includes('grant-download-access'),
      { timeout: 60000 },
    );
  }

  waitForRequestResponse() {
    return this.page.waitForResponse(
      (response) => {
        const type = response.request().resourceType();
        return (type === 'fetch' || type === 'xhr') && response.status() < 500;
      },
      { timeout: 60000 },
    );
  }

  async clickRequestAccess() {
    await expect(this.requestAccessButton).toBeVisible({ timeout: 30000 });
    await expect(this.requestAccessButton).toBeEnabled();

    const responsePromise = this.waitForGrantDownloadAccessResponse();
    await this.requestAccessButton.click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  }

  async clickBadRequestCta() {
    await expect(this.badRequestCta).toBeVisible({ timeout: 30000 });
    await expect(this.badRequestCta).toBeEnabled();

    const responsePromise = this.waitForRequestResponse();
    await this.badRequestCta.click();
    await responsePromise;
  }

  async verifySuccessMessage(successMessage) {
    await expect(this.getMessage(successMessage)).toBeVisible({ timeout: 60000 });
  }

  async verifyFailMessage(failMessage) {
    await expect(this.getMessage(failMessage)).toBeVisible({ timeout: 60000 });
  }

  async verifyRequestAccessButtonNotVisible() {
    await expect(this.requestAccessButton).not.toBeVisible();
  }
}
