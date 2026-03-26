export default class RedirectsPage {
  constructor(page) {
    this.page = page;
    this.signInButton = page.locator('.feds-signIn');
    this.gnav = page.locator('.feds-topnav-wrapper');
    this.benefitsCenter = page.getByRole('link', { name: 'Benefits Center' });
    this.experienceLeague = page.getByRole('link', { name: 'Experience League' });
    this.menageUser = page.getByRole('link', { name: 'Manage user' });
    this.demo = page.getByRole('link', { name: 'Demo' });
    this.adobe = page.getByRole('link', { name: 'Adobe.com' });
    this.linksGnav = page.getByRole('button', { name: 'Links on gnav' });
    this.benefitsCenterGnav = page.getByLabel('Main', { exact: true }).getByRole('link', { name: 'Benefits Center' });
    this.experienceLeagueGnav = page.getByLabel('Main', { exact: true }).getByRole('link', { name: 'Experience League' });
    this.menageUserGnav = page.getByLabel('Main', { exact: true }).getByRole('link', { name: 'Manage user' });
    this.demoGnav = page.getByLabel('Main', { exact: true }).getByRole('link', { name: 'Demo' });
    this.adobeGnav = page.getByLabel('Main', { exact: true }).getByRole('link', { name: 'Adobe.com' });
    this.gnavDropdown = page.locator('.feds-menu-container');
    this.benefitsCenterIcon = page.getByRole('link', { name: 'Image' }).first();
    this.bellIcon = page.getByRole('link', { name: 'Image' }).nth(1);
    this.worldIcon = page.getByRole('link', { name: 'Image' }).nth(2);
    this.menageUserIcon = page.getByRole('link', { name: 'Image' }).nth(3);
    this.homeIcon = page.getByRole('link', { name: 'Image' }).nth(4);
    this.profileDropdown = page.locator('.feds-profile');
    this.benefitsCenterProfileDropdown = page.getByLabel('Main', { exact: true }).getByRole('link', { name: 'Benefits Center' });
    this.experienceLeagueProfileDropdown = page.getByLabel('Main', { exact: true }).getByRole('link', { name: 'Experience League' });
    this.menageUserProfileDropdown = page.getByLabel('Main', { exact: true }).getByRole('link', { name: 'Manage user' });
    this.demoProfileDropdown = page.getByLabel('Main', { exact: true }).getByRole('link', { name: 'Demo' });
    this.adobeProfileDropdown = page.getByLabel('Main', { exact: true }).getByRole('link', { name: 'Adobe.com' });
  }
}