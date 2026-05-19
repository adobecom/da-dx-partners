import { expect } from '@playwright/test';

export default class ProgressWidgetPage {
  constructor(page) {
    this.page = page;
    this.progressWidget = page.locator('.partnership-progress-block');
    this.solutionTable = this.progressWidget.locator('table').filter({ hasText: 'Solution' });
    this.technologyTable = this.progressWidget.locator('table').filter({ hasText: 'Technology' });
    this.solutionHeading = this.progressWidget.getByText('Solution', { exact: true });
    this.technologyHeading = this.progressWidget.getByText('Technology', { exact: true });
    this.progressBars = this.progressWidget.locator(
      '[role="progressbar"], progress, .progress-bar, .progress-bar-fill, .meter',
    );
  }

  async verifyProgressionLevel(level) {
    const locator = this.page
      .locator('.partnership-progress-header-row span')
      .filter({ hasText: level });
    await expect(locator).toHaveCount(2);
    await expect(locator.first()).toBeVisible();
    await expect(locator.nth(1)).toBeVisible();
  }

  async verifySolutionAndTechnologyTables() {
    await expect(this.solutionHeading).toBeVisible();
    await expect(this.technologyHeading).toBeVisible();
  }

  async verifySolutionRequirementProgressBars(progressBars) {
    const solutionSection = this.page
      .locator('section')
      .filter({ hasText: 'Solution Requirements' });

    for (const progressBar of progressBars) {
      const locator = solutionSection.locator(
        `.partnership-progress-bar-wrapper[aria-label="${progressBar.label}"]`,
      );

      await expect(locator).toHaveAttribute(
        'aria-valuenow',
        progressBar.value,
      );
    }
  }
}
