export default class GnavPersonalisationPage {
  constructor(page) {
    this.page = page;
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    this.partnerLevelSegment = page.getByRole('main').locator('div').filter({ hasText: 'Partner platinum' }).nth(1)
    this.personalisationButton = page.getByRole('button', { name: 'Personalization' });
    this.gnavDropdown = page.locator('#feds-popup-1');
  }

  getSegments(segmentText) {
    return this.page.locator('div').filter({ hasText: `${segmentText}` }).nth(1)
  }

  getSegmentsGnav(segmentText) {
    return this.page.getByRole('link', { name: `${segmentText}` });
  }
}