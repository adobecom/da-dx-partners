export default class BannersPage {
  constructor(page) {
    this.page = page;
    this.banners = page.locator('.banners');
    this.bctqBanner90days = page.locator('div').filter({ hasText: 'Your BCTQ compliance will expire in 65 days. Please renew to maintain your' }).nth(1);
    this.completeComplianceButton = page.getByRole('link', { name: 'Complete Compliance' });
  }

  generateDateWithDaysOffset(daysOffset) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date;
  }
}