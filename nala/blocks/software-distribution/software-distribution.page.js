import { expect } from '@playwright/test';

export default class SoftwareDistributionPage {
  constructor(page) {
    this.page = page;
    this.requestAccessButton = page.getByRole('link', { name: 'Request access to Software Distribution' });
    this.badRequestCta = page.getByRole('link', { name: 'Example of a bad request' });
    this.apiLogs = [];
  }

  startApiCapture() {
    this.apiLogs = [];

    const isApiRequest = (request) => ['fetch', 'xhr'].includes(request.resourceType());

    const onRequest = (request) => {
      if (isApiRequest(request)) {
        this.apiLogs.push(`REQUEST ${request.method()} ${request.url()}`);
      }
    };

    const onResponse = (response) => {
      const request = response.request();
      if (isApiRequest(request)) {
        this.apiLogs.push(`RESPONSE ${response.status()} ${request.method()} ${response.url()}`);
      }
    };

    const onRequestFailed = (request) => {
      if (isApiRequest(request)) {
        this.apiLogs.push(
          `FAILED ${request.method()} ${request.url()} ${request.failure()?.errorText ?? 'unknown error'}`,
        );
      }
    };

    const onConsole = (message) => {
      if (message.type() === 'error') {
        this.apiLogs.push(`BROWSER ERROR ${message.text()}`);
      }
    };

    this.page.on('request', onRequest);
    this.page.on('response', onResponse);
    this.page.on('requestfailed', onRequestFailed);
    this.page.on('console', onConsole);
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
