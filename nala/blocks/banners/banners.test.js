import { test, expect } from '@playwright/test';
import BannersPage from './banners.page.js';
import banners from './banners.spec.js';
import SignInPage from '../signin/signin.page.js';

let bannersPage;
let signInPage;
const { features } = banners;

const mockProgress = async (page, type, appAssurancesPercentage = 100) => {
  await page.route('**/level-requirements**', async (route) => {
    const response = await route.fetch();
    const body = await response.json();

    const mockedBody = {
      ...body,

      [type]: body[type].map((level) => ({
        ...level,

        customerDeployments: {
          ...level.customerDeployments,
          total: level.customerDeployments.required,
          percentage: 100,
        },

        credentials: {
          ...level.credentials,
          total: level.credentials.required,
          percentage: 100,
        },

        ...(type === 'solution' && {
          specializations: {
            ...level.specializations,
            total: level.specializations.required,
            percentage: 100,
          },
        }),

        ...(type === 'technology' && {
          solutions: {
            ...level.solutions,
            total: level.solutions.required,
            percentage: 100,
          },

          ...(level.appAssurances && {
            appAssurances: {
              ...level.appAssurances,
              total:
                appAssurancesPercentage === 100
                  ? level.appAssurances.required
                  : level.appAssurances.required / 2,
              percentage: appAssurancesPercentage,
            },
          }),
        }),
      })),
    };

    await route.fulfill({
      response,
      json: mockedBody,
    });
  });
};

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
  test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL, context }) => {
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
        { ...data.partnerData, complianceExpiryDate: complianceExpiryDate.getTime().toString() },
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

  test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL, context }) => {
    const { data, path } = features[1];
    await test.step('Go to the page', async () => {
      await page.goto(`${baseURL}${path}`);
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Verify global banner is present', async () => {
      await expect(bannersPage.globalBanner).toBeVisible();
      await expect(bannersPage.globalBanner).toContainText(data.globalBannerText);
    });
    await test.step('Click global banner CTA and verify page loads in a new tab', async () => {
      await expect(bannersPage.globalBannerCta).toBeVisible();
      const href = await bannersPage.globalBannerCta.getAttribute('href');
      expect(href).toContain(data.globalBannerCtaLink);

      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        bannersPage.globalBannerCta.click(),
      ]);

      await newPage.waitForLoadState('domcontentloaded');
      await expect(newPage).toHaveURL(new RegExp(data.globalBannerCtaLink), { timeout: 30000 });
      await newPage.close();
    });
  });

  test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL, context }) => {
    const { data, path } = features[2];
    await test.step('Go to the page', async () => {
      await page.goto(`${baseURL}${path}`);
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Partner compliance expiry in the next 90 days', async () => {
      const complianceExpiryDate = bannersPage.generateDateWithDaysOffset(data.partnerData.daysToComplianceExpiry);
      await signInPage.addCookie(
        data.partnerData.partnerPortal,
        data.partnerData.partnerLevel,
        `${baseURL}${path}`,
        context,
        { ...data.partnerData, complianceExpiryDate: complianceExpiryDate.getTime().toString() },
      );
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Verify global banner is displayed under the BCTQ banner', async () => {
      await expect(bannersPage.bctqBannerSection).toBeVisible({ timeout: 30000 });
      await expect(bannersPage.globalBannerSection).toBeVisible({ timeout: 30000 });
      await expect(bannersPage.globalBannerSection).toContainText(data.globalBannerText);

      await expect.poll(async () => {
        const bctqSectionNumber = await bannersPage.getDaaLhSectionNumber(bannersPage.bctqBannerSection);
        const globalSectionNumber = await bannersPage.getDaaLhSectionNumber(bannersPage.globalBannerSection);
        return bctqSectionNumber !== null
          && globalSectionNumber !== null
          && globalSectionNumber > bctqSectionNumber;
      }, { timeout: 30000 }).toBe(true);
    });
  });

  test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
    const { data } = features[3];
    await mockProgress(page, 'solution');

    await test.step('Go to public home page', async () => {
      await page.goto(`${features[3].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
    });

    await test.step('Sign in as Silver user', async () => {
      await signInPage.signIn(page, `${features[3].data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Verify uplevel banner', async () => {
      await expect(bannersPage.uplevelBanner('silver')).toBeVisible();
      await expect(bannersPage.uplevelBanner('silver')).toContainText(data.uplevelBannerText);
      await expect(bannersPage.upgradeButton('silver')).toBeVisible();
      const href = await bannersPage.upgradeButton('silver').getAttribute('href');
      expect(new URL(href, baseURL).pathname).toBe(data.ctaLink);
    });

    await test.step('Verify banner after close and reload', async () => {
      await expect(bannersPage.closeBannerButton('silver')).toBeVisible();
      await bannersPage.closeBannerButton('silver').click();
      await page.reload();
      await expect(bannersPage.uplevelBanner('silver')).toBeVisible({ timeout: 30000 });
    });
  });

  test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
    const { data } = features[4];
    await mockProgress(page, 'technology');

    await test.step('Go to public home page', async () => {
      await page.goto(`${features[4].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
    });

    await test.step('Sign in as Gold user', async () => {
      await signInPage.signIn(page, `${features[4].data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Verify uplevel banner', async () => {
      await expect(bannersPage.uplevelBanner('gold')).toBeVisible({ timeout: 30000 });
      await expect(bannersPage.uplevelBanner('gold')).toContainText(data.uplevelBannerText);
      await expect(bannersPage.upgradeButton('gold')).toBeVisible();
      const href = await (bannersPage.upgradeButton('gold')).getAttribute('href');
      expect(new URL(href, baseURL).pathname).toBe(data.ctaLink);
    });
  });

  test(`${features[5].name},${features[5].tags}`, async ({ page }) => {
    await test.step('Go to public home page', async () => {
      await page.goto(`${features[5].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
    });

    await test.step('Sign in as Silver user', async () => {
      await signInPage.signIn(page, `${features[5].data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
      await expect(bannersPage.partnershipProgressBar).toBeVisible({ timeout: 30000 });
    });

    await test.step('Verify uplevel banner not visible on the page', async () => {
      await expect(bannersPage.uplevelBanner('silver')).not.toBeVisible();
      await page.reload();
      await expect(bannersPage.uplevelBanner('silver')).not.toBeVisible();
    });

    await test.step('Verify uplevel banner not visible when App Assured is under 100%', async () => {
      await expect(bannersPage.uplevelBanner('silver')).not.toBeVisible();
    });
  });

  test(`${features[6].name},${features[6].tags}`, async ({ page }) => {
    await test.step('Go to public home page', async () => {
      await page.goto(`${features[6].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
    });

    await test.step('Sign in as Gold user', async () => {
      await signInPage.signIn(page, `${features[6].data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
      await expect(bannersPage.partnershipProgressBar).toBeVisible({ timeout: 30000 });
      await expect(bannersPage.solutionHeading).toBeVisible();
      await expect(bannersPage.technologyHeading).toBeVisible();
    });

    await test.step('Verify uplevel banner not visible on the page', async () => {
      await expect(bannersPage.uplevelBanner('gold')).not.toBeVisible();
    });
  });

  test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
    const { data } = features[7];
    await mockProgress(page, 'solution');

    await test.step('Go to public home page', async () => {
      await page.goto(`${features[7].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
    });

    await test.step('Sign in as Silver user', async () => {
      await signInPage.signIn(page, `${features[7].data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
      await expect(bannersPage.partnershipProgressBar).toBeVisible({ timeout: 30000 });
      await expect(bannersPage.solutionHeading).toBeVisible();
      await expect(bannersPage.technologyHeading).toBeVisible();
    });

    await test.step('Verify uplevel banner on the page', async () => {
      await expect(bannersPage.uplevelBanner('silver')).toBeVisible({ timeout: 30000 });
      await expect(bannersPage.upgradeButton('silver')).toBeVisible();
      const href = await bannersPage.upgradeButton('silver').getAttribute('href');
      expect(new URL(href, baseURL).pathname).toBe(data.ctaLink);
    });
  });

  test(`${features[8].name},${features[6].tags}`, async ({ page }) => {
    await mockProgress(page, 'technology', 50);

    await test.step('Go to public home page', async () => {
      await page.goto(`${features[6].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
    });

    await test.step('Sign in as Gold user', async () => {
      await signInPage.signIn(page, `${features[6].data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
      await expect(bannersPage.partnershipProgressBar).toBeVisible({ timeout: 30000 });
      await expect(bannersPage.solutionHeading).toBeVisible();
      await expect(bannersPage.technologyHeading).toBeVisible();
    });

    await test.step('Verify uplevel banner not visible on the page', async () => {
      await expect(bannersPage.uplevelBanner('gold')).not.toBeVisible();
    });
  });
});
