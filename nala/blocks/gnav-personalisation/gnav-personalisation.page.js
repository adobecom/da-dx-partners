import { expect } from '@playwright/test';

export const LOGGED_IN_GNAV_FRAGMENT = 'dx-loggedin-gnav.plain.html';
export const PUBLIC_GNAV_FRAGMENT = 'dx-public-gnav.plain.html';
export default class GnavPersonalisationPage {
  constructor(page) {
    this.page = page;
    this.gnav = page.locator('.feds-topnav-wrapper');
    this.logo = page.locator('a.feds-brand').filter({ has: page.locator('img[src*="px-hub-logo"]') });
    this.personalisationButton = page.getByRole('button', { name: 'Personalization' });
    this.gnavDropdown = page.locator('#feds-popup-1');
    this.handshakeIcon = page.getByRole('link', { name: 'Image' }).first();
    this.globeIcon = page.getByRole('link', { name: 'Image' }).nth(1);
    this.searchIcon = page.getByRole('link', { name: 'Image' }).nth(2);
    this.menageUserIcon = page.getByRole('link', { name: 'Image' }).nth(3);
    this.homeIcon = page.getByRole('link', { name: 'Image' }).nth(4);
    this.navigationMenuButton = page.getByRole('button', { name: 'Navigation menu' });
    this.mainMenuButton = page.getByLabel('About').locator('div').filter({ hasText: 'Main menu' });
  }

  getPartnerLevelSegment(partnerLevelSegmentText) {
    return this.page.getByRole('main').locator('div').filter({ hasText: `${partnerLevelSegmentText}` }).nth(1);
  }

  getSegments(segmentText) {
    return this.page.locator('div').filter({ hasText: `${segmentText}` }).nth(1);
  }

  getSegmentsGnav(segmentText) {
    return this.page.getByRole('link', { name: `${segmentText}` });
  }

  generateDateWithDaysOffset(daysOffset) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date;
  }

  waitForLoggedInGnavFragment(timeout = 60000) {
    return this.page.waitForResponse(
      (response) => response.url().includes(LOGGED_IN_GNAV_FRAGMENT) && response.status() === 200,
      { timeout },
    );
  }

  waitForPublicGnavFragment(timeout = 60000) {
    return this.page.waitForResponse(
      (response) => response.url().includes(PUBLIC_GNAV_FRAGMENT) && response.status() === 200,
      { timeout },
    );
  }

  async verifyLogoVisible() {
    await expect(this.logo).toBeVisible({ timeout: 30000 });
    await expect(this.logo.locator('img[src*="px-hub-logo"]')).toBeVisible();
  }

  async verifyPartnerCtasHidden(ctaLabels) {
    for (const label of ctaLabels) {
      await expect(this.page.getByRole('link', { name: label })).toBeHidden();
    }
  }

  async verifyPartnerCtasVisible(ctaLabels) {
    for (const label of ctaLabels) {
      await expect(this.page.getByRole('link', { name: label })).toBeVisible({ timeout: 30000 });
    }
  }

  async verifyShortcutIconsNotVisible() {
    await expect(this.handshakeIcon).not.toBeVisible();
    await expect(this.globeIcon).not.toBeVisible();
    await expect(this.searchIcon).not.toBeVisible();
    await expect(this.menageUserIcon).not.toBeVisible();
    await expect(this.homeIcon).not.toBeVisible();
  }

  async verifyShortcutIconsVisible() {
    await expect(this.handshakeIcon).toBeVisible();
    await expect(this.globeIcon).toBeVisible();
    await expect(this.searchIcon).toBeVisible();
    await expect(this.menageUserIcon).toBeVisible();
    await expect(this.homeIcon).toBeVisible();
  }

  async openAboutTab() {
    await this.page.getByRole('button', { name: 'About' }).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async openMoreTab() {
    await this.page.getByRole('tab', { name: 'More' }).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async verifyMyPartnershipVisible(visible = true) {
    const locator = this.page.getByText('My partnership', { exact: true });
    if (visible) {
      await expect(locator).toBeVisible({ timeout: 30000 });
    } else {
      await expect(locator).toBeHidden();
    }
  }

  async verifyVisibleImagesNotBroken() {
    const images = this.page.locator('img:visible');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      const img = images.nth(i);
      await expect(img).toBeVisible();
      await expect
        .poll(async () => img.evaluate((el) => el.complete && el.naturalWidth > 0))
        .toBeTruthy();
    }
  }

  async verifyTabPanelImagesNotBroken() {
    const panel = this.page
      .getByRole('tabpanel')
      .locator(':visible')
      .first();

    await expect(panel).toBeVisible({ timeout: 30000 });

    await panel.evaluate(async (el) => {
      el.scrollTop = 0;

      await new Promise((resolve) => {
        let total = 0;
        const step = 300;

        const timer = setInterval(() => {
          el.scrollBy(0, step);
          total += step;

          if (total >= el.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    const images = panel.locator('img');
    const count = await images.count();

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);

      await expect
        .poll(
          async () => img.evaluate(
            (el) => el.complete && el.naturalWidth > 0,
          ),
          { timeout: 30000 },
        )
        .toBeTruthy();
    }
  }

  async openPromoteSellTab() {
    await this.page.getByRole('button', { name: /Promote\s*&\s*Sell/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  promoLink(hrefPart) {
    return this.page.locator(
      `a.feds-promo-image[href*="${hrefPart}"], a.feds-promo-link[href*="${hrefPart}"]`,
    );
  }

  coSellingLink(hrefPart) {
    return this.promoLink(hrefPart);
  }

  navMenuLink(hrefPart) {
    return this.page.locator(`a.feds-navLink[href*="${hrefPart}"]`);
  }

  ctaLink(hrefPart) {
    return this.page.locator(`a.feds-cta[href*="${hrefPart}"]`);
  }

  async verifyCoSellingUrlVisible(hrefParts) {
    for (const hrefPart of hrefParts) {
      await expect(this.coSellingLink(hrefPart).first()).toBeVisible({ timeout: 30000 });
    }
  }

  async verifyNavMenuLinksVisible(hrefParts) {
    for (const hrefPart of hrefParts) {
      const link = await this.getVisibleNavMenuLink(hrefPart);
      await expect(link).toBeVisible({ timeout: 30000 });
    }
  }

  async verifyCoSellingTitleVisible(title) {
    await expect(
      this.page.locator('.feds-promo-header').filter({ hasText: title }),
    ).toBeVisible({ timeout: 30000 });
  }

  async verifyCtaClickable(hrefPart) {
    const cta = this.ctaLink(hrefPart).first();
    await expect(cta).toBeVisible({ timeout: 30000 });
    await expect(cta).toBeEnabled();
  }

  async verifyPromoLinksAbsent(hrefParts) {
    for (const hrefPart of hrefParts) {
      expect(await this.countVisible(this.promoLink(hrefPart))).toBe(0);
    }
  }

  async verifyCoSellingTitleAbsent(title) {
    const headers = this.page.locator('.feds-promo-header').filter({ hasText: title });
    expect(await this.countVisible(headers)).toBe(0);
  }

  async verifyNavMenuLinksAbsent(hrefParts) {
    for (const hrefPart of hrefParts) {
      expect(await this.countVisible(this.navMenuLink(hrefPart))).toBe(0);
    }
  }

  async verifyCtaAbsent(hrefPart) {
    expect(await this.countVisible(this.ctaLink(hrefPart))).toBe(0);
  }

  async open404Page(baseURL, restrictedPath) {
    await this.page.goto(`${baseURL}${restrictedPath}`);
    await this.page.waitForLoadState('domcontentloaded');
    await this.gnav.waitFor({ state: 'visible', timeout: 30000 });
  }

  async verifyShortcutIconHrefs(links) {
    expect(await this.handshakeIcon.getAttribute('href')).toContain(links.handshakeIconLink);
    expect(await this.globeIcon.getAttribute('href')).toContain(links.globeIconLink);
    expect(await this.searchIcon.getAttribute('href')).toContain(links.searchIconLink);
    expect(await this.menageUserIcon.getAttribute('href')).toContain(links.menageUserIconLink);
    expect(await this.homeIcon.getAttribute('href')).toContain(links.homeIconLink);
  }

  async countVisible(locator) {
    const count = await locator.count();
    let visibleCount = 0;

    for (let i = 0; i < count; i += 1) {
      if (await locator.nth(i).isVisible()) {
        visibleCount += 1;
      }
    }

    return visibleCount;
  }

  async getVisibleNavMenuLink(hrefPart, timeout = 30_000) {
    const links = this.navMenuLink(hrefPart);

    await expect
      .poll(
        async () => {
          const count = await links.count();
          for (let i = 0; i < count; i += 1) {
            if (await links.nth(i).isVisible()) {
              return true;
            }
          }
          return false;
        },
        { timeout },
      )
      .toBeTruthy();

    const count = await links.count();
    for (let i = 0; i < count; i += 1) {
      const link = links.nth(i);
      if (await link.isVisible()) {
        return link;
      }
    }

    return links.first();
  }

  async verifyRestrictedPromoteSellPart1(data) {
    await this.openPromoteSellTab();
    await this.verifyCoSellingTitleVisible(data.coSellingTitle);
    await this.verifyVisibleImagesNotBroken();
    await this.verifyCoSellingUrlVisible(data.linksByHref);
    await this.verifyNavMenuLinksVisible(data.navMappingLinks);
    await this.verifyCtaClickable(data.ctaHref);
  }

  async verifyRestrictedPromoteSellPart2(data) {
    await this.openPromoteSellTab();
    await this.verifyNavMenuLinksVisible(data.navMenuLinks);
    await this.verifyCtaClickable(data.ctaHref);
  }

  async verifyPublicPromoteSellPart1Absent(data) {
    await this.openPromoteSellTab();
    await this.verifyCoSellingTitleAbsent(data.coSellingTitle);
    await this.verifyPromoLinksAbsent(data.hiddenPromoLinks);
    await this.verifyNavMenuLinksAbsent(data.hiddenNavMenuLinks);
    await this.verifyCtaAbsent(data.hiddenCtaHref);
    await this.verifyVisibleImagesNotBroken();
  }

  async verifyPublicPromoteSellPart2Absent(data) {
    await this.openPromoteSellTab();
    await this.verifyNavMenuLinksAbsent(data.hiddenNavMenuLinks);
    await this.verifyCtaAbsent(data.hiddenCtaHref);
  }

  async verifyGnavSegments(segmentTexts) {
    await this.navigationMenuButton.click();
    await expect(this.gnavDropdown).toBeVisible({ timeout: 30000 });

    for (const segmentText of segmentTexts) {
      await expect(this.getSegmentsGnav(segmentText)).toBeVisible({ timeout: 30000 });
    }
  }

  async verifyUserPageSegments(data) {
    await expect(this.getPartnerLevelSegment(data.partnerLevelSegmentText)).toBeVisible({ timeout: 30000 });
    await expect(this.getSegments(data.segmentBussinessSolution)).toBeVisible({ timeout: 30000 });
    await expect(this.getSegments(data.segemntBussinessTechnology)).toBeVisible({ timeout: 30000 });
    await expect(this.getSegments(data.segmentBillngAdmin)).toBeVisible({ timeout: 30000 });
    await expect(this.getSegments(data.segmentDesignationType)).toBeVisible({ timeout: 30000 });
    await expect(this.getSegments(data.segmentAdmin)).toBeVisible({ timeout: 30000 });
  }

  async verifyUserGnavSegments(data) {
    await this.navigationMenuButton.click();
    await expect(this.gnavDropdown).toBeVisible({ timeout: 30000 });

    const segments = [
      {
        tab: 'Levels',
        link: data.gnavSegmentLevel,
      },
      {
        tab: 'Admin cases',
        link: data.gnavSegmentAdmin,
      },
      {
        tab: 'Designation cases',
        link: data.gnavSegmentDesignation,
      },
    ];

    for (const segment of segments) {
      await this.page.getByRole('tab', { name: segment.tab }).click();

      await expect(
        this.page.getByRole('link', { name: segment.link }),
      ).toBeVisible({ timeout: 30000 });
    }
  }

  async verifyMobileShortcutIcons(data) {
    await this.navigationMenuButton.click();
    await this.verifyShortcutIconsVisible();
    await this.verifyShortcutIconHrefs(data);
  }

  async verifyMobilePublicGnavStatus(data) {
    await this.verifyLogoVisible();
    await this.navigationMenuButton.click();
    await this.verifyPartnerCtasVisible(data.visibleCtas);
    await this.verifyShortcutIconsNotVisible();
  }

  async verifyMobilePublicGnavAboutTab(data) {
    await this.openAboutTab();
    await this.verifyMyPartnershipVisible(false);
    await this.verifyPromoLinksAbsent(data.hiddenPromoLinks);
  }

  async verifyMobilePublicGnavMoreTab() {
    await this.openMoreTab();
    await this.verifyTabPanelImagesNotBroken();
  }

  async verifyMobileRestrictedGnavStatus(data) {
    await this.verifyLogoVisible();
    await this.verifyMobileShortcutIcons(data);
    await this.verifyPartnerCtasHidden(data.hiddenCtas);
  }

  async verifyMobileRestrictedGnavAboutTab() {
    await this.openAboutTab();
    await this.verifyMyPartnershipVisible(true);
  }
}
