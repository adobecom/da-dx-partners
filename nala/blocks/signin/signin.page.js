export default class SignInPage {
  constructor(page) {
    this.page = page;
    this.signInButton = page.locator('.feds-profile');
    this.signInButtonStageAdobe = page.locator('.profile-comp.secondary-button');
    this.profileIconButton = page.locator('.feds-profile-button');
    this.joinNowButton = page.locator('a:has-text("Join now")');
    this.gnavJoinNowButton = page.locator('.feds-cta-wrapper a:has-text("Join now")');
    this.explorePastArticles = page.locator('a:has-text("Explore past articles")');
    this.newsletterLink = page.locator('a:has-text("product newsletter")');
    this.logoutButton = page.locator('.feds-profile-actions');
    this.userNameDisplay = page.locator('.user-name');
    this.adobeProfile = page.locator('[data-test-id="unav-profile"]');
    this.adobeGnav = page.locator('[data-test-id="top-app-bar-content"]');
    this.globalFooter = page.getByRole('contentinfo');
    this.IMSEmailPage = page.locator('form#EmailForm');
    this.emailField = page.locator('#EmailPage-EmailField');
    this.emailPageContinueButton = page.locator('//button[@data-id="EmailPage-ContinueButton"]');
    this.IMSPasswordPage = page.locator('form#PasswordForm');
    this.passwordField = page.locator('#PasswordPage-PasswordField');
    this.passwordPageContinueButton = page.locator('//button[@data-id="PasswordPage-ContinueButton"]');
    this.notFound = page.getByRole('heading', { name: 'Not Found' });
    this.popupCloseButton = page.getByRole('button', { name: 'Close' });
    this.searchField = page.getByRole('searchbox', { name: 'Search' });
    this.searchAllResults = page.getByRole('button', { name: 'All', exact: true });
    this.loader = page.locator('.progress-circle-wrapper');
    this.cardWrapper = page.locator('.card-wrapper').nth(0);
  }

  async signIn(page, partnerLevel) {
    const email = process.env.IMS_EMAIL.split(partnerLevel)[1].split(';')[0];
    await page.waitForLoadState('domcontentloaded');
    await this.emailField.fill(email);
    await this.emailPageContinueButton.click();
    await this.passwordField.fill(process.env.IMS_PASS);
    await this.passwordPageContinueButton.click();
  }

  async verifyLandingPageAfterLogin({ page, expect, path, partnerLevel, expectedLandingPageURL }) {
    await page.goto(path);
    await page.waitForLoadState('domcontentloaded');
    await this.signInButton.click();
    await this.signIn(page, partnerLevel);
    await this.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
    const pages = await page.context().pages();
    await expect(pages[0].url()).toContain(expectedLandingPageURL);
  }

  async addCookie(partnerPortal, partnerLevel, url, context, partnerData) {
    this.context = context;
    const {
      accessType,
      complianceExpiryDate,
      complianceStatus,
      createdDate,
      designationType,
      isAdmin,
      email,
      latestAgreementAccepted,
      latestAgreementAcceptedVersion,
      primaryBusiness,
      primaryContact,
      primaryJobRole,
      purchasedPartnerLevel,
      salesCenterAccess,
      specialState,
      status,
    } = partnerData;

    const cookieData = {
      [partnerPortal]: {
        accessType: JSON.parse(accessType),
        complianceExpiryDate: parseInt(complianceExpiryDate, 10),
        complianceStatus,
        createdDate: parseInt(createdDate, 10),
        designationType: JSON.parse(designationType),
        email,
        latestAgreementAccepted: latestAgreementAccepted === 'true',
        latestAgreementAcceptedVersion,
        level: partnerLevel,
        isAdmin: isAdmin,
        primaryBusiness: JSON.parse(primaryBusiness),
        primaryContact: primaryContact === 'true',
        primaryJobRole,
        purchasedPartnerLevel,
        salesCenterAccess: salesCenterAccess === 'true',
        specialState: specialState,
        status,
      },
    };
    
    await this.context.addCookies([{
      name: 'partner_data',
      value: JSON.stringify(cookieData),
      url,
    }]);
  }

  async waitForResultsToSettle() {
    await this.loader.waitFor({ state: 'hidden', timeout: 30000 });
  }
  
  assetTitleCheck(assetTitle) {
    return this.page.getByText(assetTitle);
  }

  async getNumberOfResults() {
    const text = await this.searchAllResults.textContent();
    const match = text.match(/\((\d+)\)/);
    const numberResults = Number(match[1]);
    return numberResults;
  }
}
