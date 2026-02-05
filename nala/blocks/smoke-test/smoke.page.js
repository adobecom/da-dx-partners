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
    this.findPartnerLinkAR = page.locator('a[href*="/channel?lang=en"]');
    this.learnMoreLinkAR = page.locator('a[href*="/channelpartners/"]').nth(1);
    this.visitAdobeExchangeLink = page.locator('a[href*="exchange.adobe.com/"]');
    this.joinNowLinkSP = page.locator('a[href*="/solution-partners/registration.html"]');
    this.joinNowLinkTP = page.locator('a[href*="/technologyprogram/experiencecloud/registration.html"]');
    this.joinNowLinkAR = page.locator('a[href*="/na/channelpartners/enrollment/"]');
    this.footer = page.locator('.global-footer');
    this.becomeAPartnerButton = page.getByRole('link', { name: 'Become a partner' });
    this.signInButton = page.locator('.feds-signIn');
    this.findAPartnerButton = page.getByRole('link', { name: 'Find a partner' });
    this.profileIconButton = page.locator('.feds-profile-button');
    this.emailField = page.locator('#EmailPage-EmailField');
    this.emailPageContinueButton = page.locator('//button[@data-id="EmailPage-ContinueButton"]');
    this.passwordField = page.locator('#PasswordPage-PasswordField');
    this.passwordPageContinueButton = page.locator('//button[@data-id="PasswordPage-ContinueButton"]');
    this.saleCenterButton = page.locator('a[href*="/digitalexperience/m/salescenter/"]:has(img[src*="handshake.svg"])');
    this.homeButton = page.locator('a[href*="digitalexperience/home/"]:has(img[src*="home.svg"])');
    this.searchField = page.getByRole('searchbox', { name: 'Search' });
    this.searchAllResults = page.getByRole('button', { name: 'All', exact: true });
    this.productFilter = page.getByLabel('Products');
    this.productFilterPanel = page.getByRole('list').filter({ hasText: 'Adobe Advertising Cloud Adobe' });
    this.productFilterCheckbox = page.getByRole('checkbox', { name: 'Adobe Advertising Cloud' });
    this.loader = page.locator('.progress-circle-wrapper');
    this.feedbackButton = page.locator('.feedback-mechanism');
    this.feedbackTitle = page.locator('.feedback-title');
    this.feedbackTextArea = page.locator('.feedback-textarea');
    this.feedbackSendButton = page.locator('.feedback-dialog-button.cta');
    this.feedBackStars3 = page.locator('sp-action-button[data-rating="3"]');
    this.collectionBlock = page.locator('#explore-all-related-product-assets');
    this.cardsResults = page.locator('.partner-cards-cards-results');
    this.firstFilterButton = page.locator('.filter .filter-header').first();
    this.firstFilterList = page.locator('.filter').first().locator('.filter-list');
    this.firstFilterCheckbox = page.locator('.filter').first().locator('sp-checkbox').first();
    this.jarvisChatButton = page.getByRole('button', { name: 'Chat with us' });
    this.jarvisChatPanel = page.frameLocator('iframe[title="Adobe Virtual Assistant"]').getByText("We're here to help.");
    this.searchCardsCollection = page.locator('.partner-cards-collection');
  }

  async smokeSignIn(page, baseURL, partnerLevel) {
    const isProduction = baseURL.includes('partners.adobe.com');
    const emailData = isProduction ? process.env.IMS_EMAIL_PROD : process.env.IMS_EMAIL;
    const emailPart = emailData.split(';');
    const emailEntry = emailPart.find((pair) => pair.startsWith(partnerLevel));
    const email = emailEntry ? emailEntry.split(':')[1] : null;
    await page.waitForLoadState('domcontentloaded');
    await this.emailField.fill(email);
    await this.emailPageContinueButton.click();
    await this.passwordField.fill(process.env.IMS_PASS);
    await this.passwordPageContinueButton.click();
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

  async getResultsCount() {
    const text = await this.searchAllResults.textContent();
    const match = text?.match(/\((\d+)\)/);
    return Number(match?.[1] ?? 0);
  }

  async waitForSearchResults() {
    await this.loader.waitFor({ state: 'hidden', timeout: 30000 });
    await this.searchCardsCollection.waitFor({ state: 'visible', timeout: 30000 });
    await this.searchAllResults.waitFor({ state: 'visible', timeout: 30000 });
  }

  async searchFor(keyword) {
    await this.searchField.focus();
    await this.searchField.fill('');
    await this.searchField.type(keyword, { delay: 80 });
    await this.page.waitForTimeout(5000);
    await this.page.keyboard.press('Enter');
  }
}
