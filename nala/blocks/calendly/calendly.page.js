export default class CalendlyPage {
  constructor(page) {
    this.page = page;
    this.profile = page.locator('.feds-profile-button');

    this.calendlyFrame = page.frameLocator('.calendly-embed iframe, iframe[src*="calendly.com"]');
    this.calendlyComponent = this.calendlyFrame.locator('[data-id="layout-container"]');
    this.availableDate = this.calendlyFrame.getByRole('button', { name: /Times available/ }).first();

    this.spotList = this.calendlyFrame.locator('[data-component="spot-list"]');
    this.timeSlots = this.spotList.locator('[data-container="time-button"]');
    this.firstTimeSlot = this.timeSlots.first();

    this.firstNameInput = this.calendlyFrame.locator('input[name="first_name"]');
    this.lastNameInput = this.calendlyFrame.locator('input[name="last_name"]');
    this.emailInput = this.calendlyFrame.locator('input[name="email"]');
    this.scheduleEventButton = this.calendlyFrame.getByRole('button', { name: 'Schedule Event' });

    this.alreadyBookedFragment = this.page.locator('#already-booked-fragment');
    this.calendlyEmbed = this.page.locator('.calendly-embed');
  }
}
