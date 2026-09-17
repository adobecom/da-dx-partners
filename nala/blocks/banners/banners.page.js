export default class BannersPage {
  constructor(page) {
    this.page = page;
    this.banners = page.locator('.banners');
    this.bctqBanner90days = page.locator('div').filter({ hasText: 'Your BCTQ compliance will expire in 65 days. Please renew to maintain your' }).nth(1);
    this.completeComplianceButton = page.getByRole('link', { name: 'Complete Compliance' });
    this.bctqBanner = page.locator('div').filter({ hasText: 'Your BCTQ compliance will' }).nth(1);
    this.globalBanner = page.locator('div').filter({ hasText: 'Live chat is unavailable on' }).nth(1);
    this.globalBannerCta = this.globalBanner.getByRole('link', { name: 'here.' });
    this.bctqBannerSection = page.locator('[daa-lh^="s"]').filter({ hasText: 'Your BCTQ compliance will' });
    this.globalBannerSection = page.locator('[daa-lh^="s"]').filter({ hasText: 'Live chat is unavailable on' });
  }

  parseDaaLhSectionNumber(daaLh = '') {
    const match = daaLh.match(/^s(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  async getDaaLhSectionNumber(locator) {
    const daaLh = await locator.getAttribute('daa-lh');
    return this.parseDaaLhSectionNumber(daaLh);
  }

  generateDateWithDaysOffset(daysOffset) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date;
  }
}
