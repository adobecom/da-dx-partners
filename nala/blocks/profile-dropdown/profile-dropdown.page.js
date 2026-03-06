export default class ProfileDropdownPage {
  constructor(page) {
    this.page = page;
    this.profileDropdownButton = page.locator('.feds-profile-button');
    this.profileDropdown = page.locator('.feds-profile');
    this.profileName = page.locator('.feds-profile-name');
    this.profileIcon = page.locator('#feds-profile-menu .feds-profile-img');
    this.profileEmail = page.locator('.feds-profile-email');
    this.profileJob = page.locator('.primaryjobrole-placeholder');
    this.accountName = page.locator('.accountname-placeholder');
    this.partnerLevelDropdown = page.locator('.purchasedpartnerlevel-placeholder');
    this.updateProfile = page.getByRole('link', { name: 'Update your profile' });
    this.manageCompanyAccount = page.getByRole('link', { name: 'Manage Company Account' });
    this.signOut = page.getByRole('link', { name: 'Sign Out' });
  }
}
