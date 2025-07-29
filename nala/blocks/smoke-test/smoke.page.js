export default class SmokeTest {
  constructor(page) {
    this.page = page;
    this.gnav = page.locator('.global-navigation.ready');
    this.contactUsLinkSP = page.locator('a[href*="/solution-partners/contact.html"]');
    this.findPartnerLinkSP = page.locator('a[href*="/s/directory/solution"]');
    this.learnMoreLinkSP = page.locator('a[href*="/solution-partners/about.html"]');
    this.contactUsLinkTP = page.locator('a[href*="/technologyprogram/experiencecloud/support.html"]');
    this.findPartnerLinkTP = page.locator('a[href*="/s/directory/technology"]');
    this.learnMoreLinkTP = page.locator('a[href*="/technologyprogram/experiencecloud/about.html"]');
    this.contactUsLinkAR = page.locator('a[href*="/en/apc-helpdesk"]');
    this.findPartnerLinkAR = page.locator('a[href*="/PartnerSearch?lang=en"]');
    this.learnMoreLinkAR = page.locator('a[href*="/na/channelpartners/program/"]');
    this.visitAdobeExchangeLink = page.locator('a[href*="exchange.adobe.com/"]');
    this.joinNowLinkSP = page.locator('a[href*="/solution-partners/registration.html"]');
    this.joinNowLinkTP = page.locator('a[href*="/technologyprogram/experiencecloud/registration.html"]');
    this.joinNowLinkAR = page.locator('a[href*="/na/channelpartners/enrollment/"]');
    this.footer = page.locator('.global-footer');
  }

  async verifyStatusCode(url) {
    const response = await this.page.goto(url);
    if (!response || response.status() !== 200) {
      throw new Error(`Page failed to load. Status: ${response ? response.status() : "No response"}`);
    }
  }

  async verifyIfGnavIsPresent() {
    return await this.gnav.isVisible();
  }

  async verifyIfFooterIsPresent() {
    return await this.footer.isVisible();
  }
}
