import { expect, test } from '@playwright/test';
import SmokeTest from './smoke.page.js';
import SmokeSpec from './smoke.spec.js';

let smokeTest;

const { features } = SmokeSpec;

test.describe('Validate Partner Directory pages', () => {
  test.beforeEach(async ({ page, browserName, baseURL, context }) => {
    smokeTest = new SmokeTest(page);
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

  async function verifyPartnerLinks(data, baseURL, type = 'directory') {
    const linksToCheck = [];

    if (type === 'directory') {
      linksToCheck.push(
        // Solution Partners
        { element: smokeTest.contactUsLinkSP, expected: data.contactUsSPURL },
        { element: smokeTest.findPartnerLinkSP, expected: data.findPartnerSPURL },
        { element: smokeTest.learnMoreLinkSP, expected: data.learnMoreSPURL },

        // Technology Partners
        { element: smokeTest.contactUsLinkTP, expected: data.contactUsTPURL },
        { element: smokeTest.findPartnerLinkTP, expected: `${baseURL}${data.findPartnerTPURL}` },
        { element: smokeTest.learnMoreLinkTP, expected: `${baseURL}${data.learnMoreTPURL}` },

        // Authorized Resellers
        { element: smokeTest.contactUsLinkAR, expected: data.contactUsARURL },
        { element: smokeTest.findPartnerLinkAR, expected: data.findPartnerARURL },
        { element: smokeTest.learnMoreLinkAR, expected: `${baseURL}${data.learnMoreARURL}` },

        // Adobe Exchange
        { element: smokeTest.visitAdobeExchangeLink, expected: data.visitAdobeExchangeURL },
      );
    } else if (type === 'join') {
      linksToCheck.push(
        // Solution Partners
        { element: smokeTest.learnMoreLinkSP, expected: data.learnMoreSPURL },
        { element: smokeTest.joinNowLinkSP, expected: data.joinNowSPURL },

        // Technology Partners
        { element: smokeTest.learnMoreLinkTP, expected: `${baseURL}${data.learnMoreTPURL}` },
        { element: smokeTest.joinNowLinkTP, expected: `${baseURL}${data.joinNowTPURL}` },

        // Authorized Resellers
        { element: smokeTest.learnMoreLinkAR, expected: `${baseURL}${data.learnMoreARURL}` },
        { element: smokeTest.joinNowLinkAR, expected: `${baseURL}${data.joinNowARURL}` },
      );
    }

    for (const { element, expected } of linksToCheck) {
      await expect(element).toBeVisible();
      const href = await element.getAttribute('href');
      expect(href).toContain(expected);
    }
  }

  test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    const { path } = features[0];
    await test.step('Go to Partner Directory, verify status code and if gnav is visible', async () => {
      await smokeTest.verifyStatusCode(baseURL);
      await smokeTest.verifyIfGnavIsPresent();
      await smokeTest.verifyIfFooterIsPresent();
    });

    await test.step('Go to Partner Directory Join page and verify status code and if gnav is visible', async () => {
      await smokeTest.verifyStatusCode(`${baseURL}${path}`);
      await smokeTest.verifyIfGnavIsPresent();
      await smokeTest.verifyIfFooterIsPresent();
    });
  });

  test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
    const { data } = features[1];

    await test.step('Go to Partner Directory page and verify the links', async () => {
      await page.goto(baseURL);
      await smokeTest.gnav.waitFor({ state: 'visible', timeout: 40000 });
      await verifyPartnerLinks(data, baseURL, 'directory');
    });
  });

  test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
    const { data, path } = features[2];

    await test.step('Go to Partner Directory Join page and verify the links', async () => {
      await page.goto(`${baseURL}${path}`);
      await verifyPartnerLinks(data, baseURL, 'join');
    });
  });
});
