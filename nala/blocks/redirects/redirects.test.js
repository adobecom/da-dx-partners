import {expect, test} from '@playwright/test';
import RedirectsPage from './redirects.page.js';
import RedirectsSpec from './redirects.spec.js';
import SignInPage from '../signin/signin.page.js';

let redirectsPage;
let signInPage;
const { features } = RedirectsSpec;

test.describe('Validate redirects block', () => {
  test.beforeEach(async ({ page, browserName, baseURL, context }) => {
    redirectsPage = new RedirectsPage(page);
    signInPage = new SignInPage(page);
    if (!baseURL.includes('partners.stage.adobe.com')) {
        await context.setExtraHTTPHeaders({ authorization: `token ${process.env.MILO_AEM_API_KEY}` });
      }
      if (browserName === 'chromium' && !baseURL.includes('partners.stage.adobe.com')) {
        await page.route('https://www.adobe.com/chimera-api/**', async (route, request) => {
          const newUrl = request.url().replace(
            'https://www.adobe.com/chimera-api',
            'https://14257-chimera.adobeioruntime.net/api/v1/web/chimera-0.0.1',
          );
          route.continue({ url: newUrl });
        });
      }
  });

  test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    const { data, path } = features[0];
    await test.step('Go to the page', async () => {
        await page.goto(`${baseURL}${path}`);
        await redirectsPage.signInButton.waitFor({ state: 'visible' });
    });
    await test.step('Verify links on page', async () => {
        const href = await redirectsPage.benefitsCenter.getAttribute('href');
        expect(href).toBe(data.benefitsCenterLink);
        const hrefexperienceLeague = await redirectsPage.experienceLeague.getAttribute('href');
        expect(hrefexperienceLeague).toBe(data.experienceLeagueLink);
        const hrefmenageUser = await redirectsPage.menageUser.getAttribute('href');
        expect(hrefmenageUser).toBe(data.menageUserLink);
        const hrefdemo = await redirectsPage.demo.getAttribute('href');
        expect(hrefdemo).toBe(data.demoLink);
        const hrefadobe = await redirectsPage.adobe.getAttribute('href');
        expect(hrefadobe).toBe(data.adobeLink);
    });
    await test.step('Verify links on gnav', async () => {
        await redirectsPage.linksGnav.click();
        await redirectsPage.gnavDropdown.waitFor({ state: 'visible' });
        const hrefbenefitsCenterGnav = await redirectsPage.benefitsCenterGnav.getAttribute('href');
        expect(hrefbenefitsCenterGnav).toBe(data.benefitsCenterLink);
        const hrefexperienceLeagueGnav = await redirectsPage.experienceLeagueGnav.getAttribute('href');
        expect(hrefexperienceLeagueGnav).toBe(data.experienceLeagueLink);
        const hrefmenageUserGnav = await redirectsPage.menageUserGnav.getAttribute('href');
        expect(hrefmenageUserGnav).toBe(data.menageUserLink);
        const hrefdemoGnav = await redirectsPage.demoGnav.getAttribute('href');
        expect(hrefdemoGnav).toBe(data.demoLink);
        const hrefadobeGnav = await redirectsPage.adobeGnav.getAttribute('href');
        expect(hrefadobeGnav).toBe(data.adobeLink);
    });
  });
  test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
    const { data,path } = features[1];
    await test.step('Go to the page', async () => {
        await page.goto(`${baseURL}${path}`);
        await redirectsPage.signInButton.waitFor({ state: 'visible' });
    });
    await test.step('Verify icon links on page', async () => {
        const hrefbenefitsCenterIcon = await redirectsPage.benefitsCenterIcon.getAttribute('href');
        expect(hrefbenefitsCenterIcon).toBe(data.benefitsCenterIconLink);
        const hrefbellIcon = await redirectsPage.bellIcon.getAttribute('href');
        expect(hrefbellIcon).toBe(data.bellIconLink);
        const hrefworldIcon = await redirectsPage.worldIcon.getAttribute('href');
        expect(hrefworldIcon).toBe(data.worldIconLink);
        const hrefmenageUserIcon = await redirectsPage.menageUserIcon.getAttribute('href');
        expect(hrefmenageUserIcon).toBe(data.menageUserIconLink);
        const hrefhomeIcon = await redirectsPage.homeIcon.getAttribute('href');
        expect(hrefhomeIcon).toBe(data.homeIconLink);
    });
  });
  test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
    const { data, path } = features[2];
    await test.step('Go to the page', async () => {
        await page.goto(`${baseURL}${path}`);
        await redirectsPage.signInButton.waitFor({ state: 'visible' });
        await redirectsPage.signInButton.click();
        await signInPage.signIn(page, data.partnerLevel);
        await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
    });
    await test.step('Verify links on page', async () => {
        const hrefbenefitsCenter = await redirectsPage.benefitsCenter.getAttribute('href');
        expect(hrefbenefitsCenter).toBe(data.benefitsCenterLink);
        const bellIconLink = await redirectsPage.bellIcon.getAttribute('href');
        expect(bellIconLink).toBe(data.bellIconLink);
        const hrefdemo = await redirectsPage.demo.getAttribute('href');
        expect(hrefdemo).toBe(data.demoLink);
    });
    await test.step('Verify links on profile dropdown', async () => {
        await redirectsPage.profileDropdown.click();
        const hrefbenefitsCenterProfileDropdown = await redirectsPage.benefitsCenterProfileDropdown.getAttribute('href');
        expect(hrefbenefitsCenterProfileDropdown).toBe(data.benefitsCenterLink);
        const hrefexperienceLeagueProfileDropdown = await redirectsPage.experienceLeagueProfileDropdown.getAttribute('href');
        expect(hrefexperienceLeagueProfileDropdown).toBe(data.experienceLeagueLink);
        const hrefmenageUserProfileDropdown = await redirectsPage.menageUserProfileDropdown.getAttribute('href');
        expect(hrefmenageUserProfileDropdown).toBe(data.menageUserLink);
        const hrefdemoProfileDropdown = await redirectsPage.demoProfileDropdown.getAttribute('href');
        expect(hrefdemoProfileDropdown).toBe(data.demoLink);
        const hrefadobeProfileDropdown = await redirectsPage.adobeProfileDropdown.getAttribute('href');
        expect(hrefadobeProfileDropdown).toBe(data.adobeLink);
    });
  });
});