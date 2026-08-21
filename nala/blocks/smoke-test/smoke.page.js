import { expect } from '@playwright/test';

export default class SmokeTest {
  constructor(page) {
    this.page = page;
    this.gnav = page.locator('.global-navigation.ready');
    this.contactUsLinkSP = page.locator('a[href*="/digitalexperience/m/forms/case"]').nth(0);
    this.findPartnerLinkSP = page.locator('a[href*="/s/directory/solution"]');
    this.learnMoreLinkSP = page.locator('a[href*="/digitalexperience/about"]').nth(0);
    this.contactUsLinkTP = page.locator('a[href*="/digitalexperience/m/forms/case"]').nth(1);
    this.findPartnerLinkTP = page.locator('a[href*="/s/directory/technology"]');
    this.learnMoreLinkTP = page.locator('a[href*="/digitalexperience/about"]').nth(1);
    this.contactUsLinkAR = page.locator('a[href*="/en/apc-helpdesk"]');
    this.findPartnerLinkAR = page.locator('a[href*="/channel?lang=en"]');
    this.learnMoreLinkAR = page.locator('a[href*="/channelpartners/"]').nth(1);
    this.visitAdobeExchangeLink = page.locator('a[href*="exchange.adobe.com/"]');
    this.joinNowLinkSP = page.locator('a[href*="/digitalexperience/s/registration/"]').nth(0);
    this.joinNowLinkTP = page.locator('a[href*="/digitalexperience/s/registration/"]').nth(1);
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
    this.feedbackTextArea = page.locator('textarea.feedback-textarea, textarea.input');
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
    this.cardCollectionSortButton = page.getByRole('button', { name: 'date: newest' });
    this.globalFooter = page.locator('.global-footer');
    this.signOutButton = page.getByRole('link', { name: 'Sign Out' });
  }

  async smokeSignIn(page, baseURL, partnerLevel) {
    const isProduction = baseURL.includes('partners.adobe.com');
    const emailData = isProduction ? 'cpp-latin-na-platinum:yugo-test+cpp-prod-platinum-latam-na@adobetest.com;cpp-distributor-us:yugo-test+cpp-prod-distributor-us@adobetest.com;cpp-distributor-india:yugo-test+cpp-prod-distr-india-apac@adobetest.com;cpp-emea-platinum:yugo-test+cpp-prod-gold-uk-eur-west@adobetest.com;cpp-distributor-japan:yugo-test+cpp-prod-distributor-jp@adobetest.com;cpp-latin-america-na-platinum:yugo-test+cpp-prod-distributor-latam@adobetest.com ;cpp-na-certified:yugo-test+cpp-prod-platinum-na@adobetest.com ;cpp-spain-platinum:yugo-test+cpp-prod-platinum-spain@adobetest.com;cpp-de-gold:yugo-test+cpp-prod-gold-eurwest-de@adobetest.com;cpp-kr-gold:yugo-test+cpp-prod-gold-kr@adobetest.com;cpp-latin-america-gold:yugo-test+cpp-prod-gold-latam@adobetest.com;dxp-platinum:yugo-test+dx-prod-platinum@adobetest.com;dxp-gold:yugo-test+dx-prod-gold@adobetest.com;dxp-silver:yugo-test+dx-prod-silver-auto@adobetest.com;dxp-abandoned:yugo-test+dx-prod-abandoned@adobetest.com;dxp-terminated:yugo-test+dx-prod-terminated@adobetest.com;dxp-rejected:yugo-test+dx-prod-rejected@adobetest.com;dxp-community:yugo-test+dx-prod-community-auto@adobetest.com;dxp-prod-silver: yugo-test+dx-prod-silver-auto@adobetest.com;dxp-prod-community: yugo-test+dx-prod-community-auto@adobetest.com;' : process.env.IMS_EMAIL;
    const emailPart = emailData.split(';');
    const emailEntry = emailPart.find((pair) => pair.startsWith(partnerLevel));
    const email = emailEntry ? emailEntry.split(':')[1] : null;
    await page.waitForLoadState('domcontentloaded');
    await this.emailField.fill(email);
    await this.emailPageContinueButton.click();
    await this.passwordField.fill('Test@123');
    await this.passwordPageContinueButton.click();
  }

  async verifyStatusCode(url) {
    const response = await this.page.goto(url);
    if (!response || response.status() !== 200) {
      throw new Error(`Page failed to load. Status: ${response ? response.status() : 'No response'}`);
    }
  }

  async verifyIfGnavIsPresent() {
    return this.gnav.isVisible();
  }

  async verifyIfFooterIsPresent() {
    return this.footer.isVisible();
  }

  async verifyFooterSocialMediaIcons(data) {
    const root = this.globalFooter;
    await expect(root).toBeVisible({ timeout: 30000 });
    const pairs = [
      ['facebook', data.facebookLink],
      ['instagram', data.instagramLink],
      ['linkedin', data.linkedinLink],
      ['twitter', data.twitterLink],
    ];
    for (const [label, href] of pairs) {
      const link = root.locator(`a.feds-social-link[aria-label="${label}"]`);
      await expect(link).toBeVisible({ timeout: 30000 });
      await expect(link).toHaveAttribute('href', href);
    }
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
    await this.dismissSearchSuggestions();
    await this.page.keyboard.press('Enter');
  }

  async signOut() {
    await this.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    await this.profileIconButton.click();
    await this.signOutButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.signOutButton.click();
  }

  async dismissSearchSuggestions() {
    const searchValue = await this.searchField.inputValue();
    const typeahead = this.page.locator('dialog#typeahead.suggestion-dialog-wrapper');

    await this.searchField.blur();

    if (await typeahead.isVisible()) {
      await typeahead.evaluate((dialog) => dialog.close());
    }

    await expect(typeahead).toBeHidden({ timeout: 10000 });
    await expect(this.searchField).toHaveValue(searchValue);
  }
}
