import { test, expect } from '@playwright/test';
import GnavPersonalisationPage from './gnav-personalisation.page';
import gnavPersonalisationSpec from './gnav-personalisation.spec';
import SignInPage from '../signin/signin.page';

const { features } = gnavPersonalisationSpec;
let gnavPersonalisationPage;
let signInPage;

test.describe('Gnav Personalisation', () => {
  test.beforeEach(async ({ page, baseURL, context, browserName }) => {
    gnavPersonalisationPage = new GnavPersonalisationPage(page);
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
        await gnavPersonalisationPage.signInButton.waitFor({ state: 'visible' });
        await page.pause();
    });
    await test.step('Verify segments on page', async () => {
        const segments = gnavPersonalisationPage.getSegments(data.segmentText);
        await expect(segments).toBeVisible();
    });
  });
  test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL, context }) => {
    const { data, path } = features[1];
    await test.step('Go to the page', async () => {
        await page.goto(`${baseURL}${path}`);
        await gnavPersonalisationPage.signInButton.waitFor({ state: 'visible' });
        await page.pause();
    });
    await test.step('Set partner_data cookie', async () => {
        await signInPage.addCookie(
            data.partnerData.partnerPortal,
            data.partnerData.partnerLevel,
            `${baseURL}${path}`,
            context,
          );
          await page.reload();
          await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Verify segments on page', async () => {
        await page.pause();
    });
  });
  
});