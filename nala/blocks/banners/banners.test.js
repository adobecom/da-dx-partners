import { test, expect } from '@playwright/test';
import BannersPage from './banners.page.js';
import banners from './banners.spec.js';
import SignInPage from '../signin/signin.page.js';

let bannersPage;
let signInPage;
const { features } = banners;

test.describe('Validate banners block', () => {
  test.beforeEach(async ({ page, baseURL, context, browserName }) => {
    bannersPage = new BannersPage(page);
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
  test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL, context, browserName }) => {
    const { data, path } = features[0];
    await test.step('Go to the page', async () => {
        await page.goto(`${baseURL}${path}`);
        await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Set partner_data cookie', async () => {
        const complianceExpiryDate = bannersPage.generateDateWithDaysOffset(data.partnerData.daysToComplianceExpiry);
        await signInPage.addCookie(
          data.partnerData.partnerPortal,
          data.partnerData.partnerLevel,
          `${baseURL}${path}`,
          context,
          { ...data.partnerData, complianceExpiryDate: complianceExpiryDate.getTime().toString()},
        );
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
      });
    await test.step('Verify banners are present', async () => {
        await expect(bannersPage.bctqBanner90days).toBeVisible();
        await expect(bannersPage.completeComplianceButton).toBeVisible();
        const href = await bannersPage.completeComplianceButton.getAttribute('href');
        expect(href).toContain(data.completeComplianceButtonLink);
    });
  });
});