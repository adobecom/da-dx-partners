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
    this.uplevelBanner = (level) => page.locator(`.uplevel-banner.partner-level-${level}`);
    this.upgradeButton = (level) => this.uplevelBanner(level).getByRole('link', { name: 'Upgrade now' });
    this.closeBannerButton = (level) => this.uplevelBanner(level).locator('button[daa-ll="Close Promotional Ba-2--Silver Uplevel Banne"]');
    this.partnershipProgressBar = page.locator('partnership-progress');
    this.solutionHeading = this.partnershipProgressBar.getByText('Solution', { exact: true });
    this.technologyHeading = this.partnershipProgressBar.getByText('Technology', { exact: true });
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
