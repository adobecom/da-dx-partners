export default class GnavPersonalisationPage {
  constructor(page) {
    this.page = page;
    this.gnav = page.locator('.feds-topnav-wrapper');
    this.personalisationButton = page.getByRole('button', { name: 'Personalization' });
    this.gnavDropdown = page.locator('#feds-popup-1');
    this.handshakeIcon = page.getByRole('link', { name: 'Image' }).first();
    this.globeIcon = page.getByRole('link', { name: 'Image' }).nth(1);
    this.searchIcon = page.getByRole('link', { name: 'Image' }).nth(2);
    this.menageUserIcon = page.getByRole('link', { name: 'Image' }).nth(3);
    this.homeIcon = page.getByRole('link', { name: 'Image' }).nth(4);
  }

  getPartnerLevelSegment(partnerLevelSegmentText) {
    return this.page.getByRole('main').locator('div').filter({ hasText: `${partnerLevelSegmentText}` }).nth(1)
  }

  getSegments(segmentText) {
    return this.page.locator('div').filter({ hasText: `${segmentText}` }).nth(1)
  }

  getSegmentsGnav(segmentText) {
    return this.page.getByRole('link', { name: `${segmentText}` });
  }

  generateDateWithDaysOffset(daysOffset) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date;
  }
}