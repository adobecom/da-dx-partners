export default class SmokeTest {
  constructor(page) {
    this.page = page;
    this.gnav = page.locator('.global-navigation.ready');
    // DX-specific page elements only
    this.contactUsLinkDX = page.locator('a[href*="/digitalexperience/contact.html"]');
    this.learnMoreLinkDX = page.locator('a[href*="/digitalexperience/about.html"]');
    this.joinNowLinkDX = page.locator('a[href*="/digitalexperience/registration.html"]');
    this.visitAdobeExchangeLink = page.locator('a[href*="https://stage.exchange.adobe.com/"]');
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