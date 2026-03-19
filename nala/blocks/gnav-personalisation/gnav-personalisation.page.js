export default class GnavPersonalisationPage {
  constructor(page) {
    this.page = page;
    this.gnav = page.locator('.feds-topnav-wrapper');
    this.personalisationButton = page.getByRole('button', { name: 'Personalization' });
    this.gnavDropdown = page.locator('#feds-popup-1');
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
}