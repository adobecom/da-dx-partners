import { expect } from '@playwright/test';

export default class ManagePage {
  constructor(page) {
    this.page = page;
    this.firstCard = page.locator('[daa-lh="b1|brick"]');
    this.profileImage = this.firstCard.locator('.detail-l');
    this.userName = this.firstCard.locator('#accountname');
    this.userEmail = this.firstCard.locator('.body-m');
    this.company = this.firstCard.locator('#company');
    this.companyLevel = this.firstCard.locator('.body-m');
  }

  async verifyFirstCardContent({ userName, userEmail }) {
    await expect(this.profileImage).toBeVisible();
    await expect(this.userName).toHaveText(userName);
    await expect(this.userEmail).toHaveText(userEmail);
  }

  async verifyManageCompanyFirstCard({
    userName,
    userPartnerLevel,
  }) {
    await expect(this.company).toHaveText(userName);
    await expect(this.companyLevel).toHaveText(
      userPartnerLevel,
    );
  }

  async verifyCardTitles(cardTitles) {
    for (const [brickNumber, expectedTitle] of Object.entries(cardTitles)) {
      const title = this.page.locator(
        `[daa-lh="b${brickNumber}|brick"]:visible h1`,
      );

      await expect(title).toHaveText(expectedTitle);
    }
  }
}
