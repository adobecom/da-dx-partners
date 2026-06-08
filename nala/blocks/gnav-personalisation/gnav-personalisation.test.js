import { test, expect } from '@playwright/test';
import GnavPersonalisationPage from './gnav-personalisation.page';
import gnavPersonalisationSpec from './gnav-personalisation.spec';
import SignInPage from '../signin/signin.page';

const { features } = gnavPersonalisationSpec;
const newUserSegments = features.slice(7, 10);
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
      await gnavPersonalisationPage.gnav.waitFor({ state: 'visible' });
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
      await gnavPersonalisationPage.gnav.waitFor({ state: 'visible' });
    });
    await test.step('Set partner_data cookie', async () => {
      await signInPage.addCookie(
        data.partnerData.partnerPortal,
        data.partnerData.partnerLevel,
        `${baseURL}${path}`,
        context,
        data.partnerData,
      );
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Verify segments on page', async () => {
      await expect(gnavPersonalisationPage.getPartnerLevelSegment(data.partnerLevelSegmentText)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.segmentBussinessSolution)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.segemntBussinessTechnology)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.segmentBillngAdmin)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.segmentAdmin)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.segmentDesignationType)).toBeVisible();
    });
    await test.step('Verify segments present on Gnav', async () => {
      await gnavPersonalisationPage.personalisationButton.click();
      await expect(gnavPersonalisationPage.gnavDropdown).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentLevel)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentAdmin)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentDesignation)).toBeVisible();
    });
  });
  test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL, context }) => {
    const { data, path } = features[2];
    await test.step('Go to the page', async () => {
      await page.goto(`${baseURL}${path}`);
      await gnavPersonalisationPage.gnav.waitFor({ state: 'visible' });
    });
    await test.step('Set partner_data cookie', async () => {
      await signInPage.addCookie(
        data.partnerData.partnerPortal,
        data.partnerData.partnerLevel,
        `${baseURL}${path}`,
        context,
        data.partnerData,
      );
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Verify segments on page', async () => {
      await expect(gnavPersonalisationPage.getPartnerLevelSegment(data.partnerLevelSegmentText)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.accsesTypeSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.designationTypeSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.primaryBusinessSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.partnerTypeSegment)).toBeVisible();
    });
    await test.step('Verify segments present on Gnav', async () => {
      await gnavPersonalisationPage.personalisationButton.click();
      await expect(gnavPersonalisationPage.gnavDropdown).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentAdmin)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentLevel)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentDesignation)).toBeVisible();
    });
  });
  test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL, context }) => {
    const { data, path } = features[3];
    await test.step('Go to the page', async () => {
      await page.goto(`${baseURL}${path}`);
      await gnavPersonalisationPage.gnav.waitFor({ state: 'visible' });
    });
    await test.step('Set partner_data cookie', async () => {
      await signInPage.addCookie(
        data.partnerData.partnerPortal,
        data.partnerData.partnerLevel,
        `${baseURL}${path}`,
        context,
        data.partnerData,
      );
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Verify segments on page', async () => {
      await expect(gnavPersonalisationPage.getPartnerLevelSegment(data.partnerLevelSegmentText)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.primaryBusinessSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.primaryBusinessTechnologySegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.designationTypeSegment)).toBeVisible();
    });
    await test.step('Verify segments present on Gnav', async () => {
      await gnavPersonalisationPage.personalisationButton.click();
      await expect(gnavPersonalisationPage.gnavDropdown).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentLevel)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentBillingAdmin)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentDesignation)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentSalesAccess)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentAdmin)).toBeVisible();
    });
  });
  test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL, context }) => {
    const { data, path } = features[4];
    await test.step('Go to the page', async () => {
      await page.goto(`${baseURL}${path}`);
      await gnavPersonalisationPage.gnav.waitFor({ state: 'visible' });
    });
    await test.step('Set partner_data cookie', async () => {
      await signInPage.addCookie(
        data.partnerData.partnerPortal,
        data.partnerData.partnerLevel,
        `${baseURL}${path}`,
        context,
        data.partnerData,
      );
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Verify segments on page', async () => {
      await expect(gnavPersonalisationPage.getPartnerLevelSegment(data.partnerLevelSegmentText)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.accsesTypeSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.accsesTypeBuillingSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.primaryBusinessSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.designationTypeSegment)).toBeVisible();
    });
    await test.step('Verify segments present on Gnav', async () => {
      await gnavPersonalisationPage.personalisationButton.click();
      await expect(gnavPersonalisationPage.gnavDropdown).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentAdmin)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentLevel)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.designationTypeGnavSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.partnerCaseGnavSegment)).toBeVisible();
    });
  });
  test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL, context }) => {
    const { data, path } = features[5];
    await test.step('Go to the page', async () => {
      await page.goto(`${baseURL}${path}`);
      await gnavPersonalisationPage.gnav.waitFor({ state: 'visible' });
    });
    await test.step('Set partner_data cookie', async () => {
      await signInPage.addCookie(
        data.partnerData.partnerPortal,
        data.partnerData.partnerLevel,
        `${baseURL}${path}`,
        context,
        data.partnerData,
      );
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Verify segments on page', async () => {
      await expect(gnavPersonalisationPage.getPartnerLevelSegment(data.partnerLevelSegmentText)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.lockedCompliancePastSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.primaryBusinessSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.designationTypeSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.accsesTypeSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.accsesTypeBuillingSegment)).toBeVisible();
    });
    await test.step('Verify segments present on Gnav', async () => {
      await gnavPersonalisationPage.personalisationButton.click();
      await expect(gnavPersonalisationPage.gnavDropdown).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentAdmin)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentLevel)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.designationTypeGnavSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.partnerCaseGnavSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.partnerUserGnavSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentSalesAccess)).toBeVisible();
    });
  });
  test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL, context }) => {
    const { data, path } = features[6];
    await test.step('Go to the page', async () => {
      await page.goto(`${baseURL}${path}`);
      await gnavPersonalisationPage.gnav.waitFor({ state: 'visible' });
    });
    await test.step('Set partner_data cookie', async () => {
      await signInPage.addCookie(
        data.partnerData.partnerPortal,
        data.partnerData.partnerLevel,
        `${baseURL}${path}`,
        context,
        data.partnerData,
      );
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Verify segments on page', async () => {
      await expect(gnavPersonalisationPage.getPartnerLevelSegment(data.partnerLevelSegmentText)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.accsesTypeSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.designationTypeSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.lockedCompliancePastSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.primaryBusinessSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegments(data.lockedComplianceNotCompletedSegment)).toBeVisible();
    });
    await test.step('Verify segments present on Gnav', async () => {
      await gnavPersonalisationPage.personalisationButton.click();
      await expect(gnavPersonalisationPage.gnavDropdown).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentLevel)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentAdmin)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.gnavSegmentSalesAccess)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.designationTypeGnavSegment)).toBeVisible();
      await expect(gnavPersonalisationPage.getSegmentsGnav(data.partnerCaseGnavSegment)).toBeVisible();
    });
  });
  newUserSegments.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page, baseURL, context }) => {
      const { data, path } = feature;
      await test.step('Go to the page', async () => {
        await page.goto(`${baseURL}${path}`);
        await gnavPersonalisationPage.gnav.waitFor({ state: 'visible' });
      });
      await test.step('Set partner_data cookie', async () => {
        const createdDate = gnavPersonalisationPage
          .generateDateWithDaysOffset(data.partnerData.anyverseryDate)
          .getTime()
          .toString();
        await signInPage.addCookie(
          data.partnerData.partnerPortal,
          data.partnerData.partnerLevel,
          `${baseURL}${path}`,
          context,
          { ...data.partnerData, createdDate },
        );
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
      });
      await test.step('Verify segments on page', async () => {
        await expect(gnavPersonalisationPage.getSegments(data.partnerSegmentText)).toBeVisible();
      });
    });
  });
  test(`${features[10].name},${features[10].tags}`, async ({ page, baseURL, context }) => {
    const { data, path } = features[10];
    await test.step('Go to the page', async () => {
      await page.goto(`${baseURL}${path}`);
      await gnavPersonalisationPage.gnav.waitFor({ state: 'visible' });
    });
    await test.step('Set partner_data cookie', async () => {
      const createdDate = gnavPersonalisationPage
        .generateDateWithDaysOffset(data.partnerData.anyverseryDate)
        .getTime()
        .toString();
      await signInPage.addCookie(
        data.partnerData.partnerPortal,
        data.partnerData.partnerLevel,
        `${baseURL}${path}`,
        context,
        { ...data.partnerData, createdDate },
      );
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
    });
    await test.step('Verify segments present on Gnav', async () => {
      const handshakeHref = await gnavPersonalisationPage.handshakeIcon.getAttribute('href');
      expect(handshakeHref).toContain(data.handshakeIconLink);
      const globeHref = await gnavPersonalisationPage.globeIcon.getAttribute('href');
      expect(globeHref).toContain(data.globeIconLink);
      const searchHref = await gnavPersonalisationPage.searchIcon.getAttribute('href');
      expect(searchHref).toContain(data.searchIconLink);
      const menageUserHref = await gnavPersonalisationPage.menageUserIcon.getAttribute('href');
      expect(menageUserHref).toContain(data.menageUserIconLink);
      const homeHref = await gnavPersonalisationPage.homeIcon.getAttribute('href');
      expect(homeHref).toContain(data.homeIconLink);
    });
  });

  test(`${features[11].name},${features[11].tags}`, async ({ page, context, baseURL }) => {
    const { data, path, restrictedPath } = features[11];

    await test.step('Go to the page', async () => {
      await page.goto(`${baseURL}${path}`);
      await gnavPersonalisationPage.gnav.waitFor({ state: 'visible' });
    });

    await test.step('Sign in', async () => {
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
      await signInPage.signIn(page, data.partnerLevel);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Validate GNav status on restricted 404 page', async () => {
      const restrictedPage = await context.newPage();
      const gnavPage = new GnavPersonalisationPage(restrictedPage);
      try {
        const fragmentResponse = gnavPage.waitForLoggedInGnavFragment();
        await restrictedPage.goto(`${baseURL}${restrictedPath}`);
        await restrictedPage.waitForLoadState('domcontentloaded');
        const response = await fragmentResponse;
        expect(response.url()).toContain(data.gnavFragmentPath);
        expect(response.status()).toBe(200);
        await gnavPage.gnav.waitFor({ state: 'visible', timeout: 30000 });
        await gnavPage.verifyLogoVisible();
        await gnavPage.verifyPartnerCtasHidden(data.hiddenCtas);
        await gnavPage.verifyShortcutIconsVisible();
        await gnavPage.verifyShortcutIconHrefs(data);
      } finally {
        await restrictedPage.close();
      }
    });
  });
  test(`${features[12].name},${features[12].tags}`, async ({ page, context, baseURL }) => {
    const { data, path, restrictedPath } = features[12];

    await test.step('Go to the page', async () => {
      await page.goto(`${baseURL}${path}`);
      await gnavPersonalisationPage.gnav.waitFor({ state: 'visible' });
    });

    await test.step('Sign in', async () => {
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
      await signInPage.signIn(page, data.partnerLevel);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Validate About tab on restricted 404 page', async () => {
      const restrictedPage = await context.newPage();
      const gnavPage = new GnavPersonalisationPage(restrictedPage);
      try {
        await gnavPage.open404Page(baseURL, restrictedPath);
        await gnavPage.openAboutTab();
        await gnavPage.verifyMyPartnershipVisible(true);
        await gnavPage.verifyVisibleImagesNotBroken();
      } finally {
        await restrictedPage.close();
      }
    });
  });
  test(`${features[13].name},${features[13].tags}`, async ({ page, context, baseURL }) => {
    const { data, path, restrictedPath } = features[13];

    await test.step('Go to the page', async () => {
      await page.goto(`${baseURL}${path}`);
      await gnavPersonalisationPage.gnav.waitFor({ state: 'visible' });
    });

    await test.step('Sign in', async () => {
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
      await signInPage.signIn(page, data.partnerLevel);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Validate Promote&Sell tab part 1 on restricted 404 page', async () => {
      const restrictedPage = await context.newPage();
      const gnavPage = new GnavPersonalisationPage(restrictedPage);
      try {
        await gnavPage.open404Page(baseURL, restrictedPath);
        await gnavPage.verifyRestrictedPromoteSellPart1(data);
      } finally {
        await restrictedPage.close();
      }
    });
  });
  test(`${features[14].name},${features[14].tags}`, async ({ page, context, baseURL }) => {
    const { data, path, restrictedPath } = features[14];

    await test.step('Go to the page', async () => {
      await page.goto(`${baseURL}${path}`);
      await gnavPersonalisationPage.gnav.waitFor({ state: 'visible' });
    });

    await test.step('Sign in', async () => {
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
      await signInPage.signIn(page, data.partnerLevel);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Validate Promote&Sell tab part 2 on restricted 404 page', async () => {
      const restrictedPage = await context.newPage();
      const gnavPage = new GnavPersonalisationPage(restrictedPage);
      try {
        await gnavPage.open404Page(baseURL, restrictedPath);
        await gnavPage.verifyRestrictedPromoteSellPart2(data);
      } finally {
        await restrictedPage.close();
      }
    });
  });
  test(`${features[15].name},${features[15].tags}`, async ({ page, baseURL }) => {
    const { data, restrictedPath } = features[15];

    await test.step('Go to the page', async () => {
      const fragmentResponse = gnavPersonalisationPage.waitForPublicGnavFragment();
      await page.goto(`${baseURL}${restrictedPath}`);
      await page.waitForLoadState('domcontentloaded');
      const response = await fragmentResponse;
      expect(response.url()).toContain(data.gnavFragmentPath);
      expect(response.status()).toBe(200);
      await gnavPersonalisationPage.gnav.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('Validate public GNav on 404 page', async () => {
      await gnavPersonalisationPage.verifyLogoVisible();
      await gnavPersonalisationPage.verifyPartnerCtasVisible(data.visibleCtas);
      await gnavPersonalisationPage.verifyShortcutIconsNotVisible();
    });
  });
  test(`${features[16].name},${features[16].tags}`, async ({ baseURL }) => {
    const { data, restrictedPath } = features[16];

    await test.step('Go to the page', async () => {
      await gnavPersonalisationPage.open404Page(baseURL, restrictedPath);
    });

    await test.step('Validate About tab on public 404 page', async () => {
      await gnavPersonalisationPage.openAboutTab();
      await gnavPersonalisationPage.verifyMyPartnershipVisible(false);
      await gnavPersonalisationPage.verifyPromoLinksAbsent(data.hiddenPromoLinks);
      await gnavPersonalisationPage.verifyVisibleImagesNotBroken();
    });
  });
  test(`${features[17].name},${features[17].tags}`, async ({ baseURL }) => {
    const { data, restrictedPath } = features[17];

    await test.step('Go to the page', async () => {
      await gnavPersonalisationPage.open404Page(baseURL, restrictedPath);
    });

    await test.step('Validate Promote&Sell tab part 1 is not shown for public user', async () => {
      await gnavPersonalisationPage.verifyPublicPromoteSellPart1Absent(data);
    });
  });
  test(`${features[18].name},${features[18].tags}`, async ({ baseURL }) => {
    const { data, restrictedPath } = features[18];

    await test.step('Go to the page', async () => {
      await gnavPersonalisationPage.open404Page(baseURL, restrictedPath);
    });

    await test.step('Validate Promote&Sell tab part 2 is not shown for public user', async () => {
      await gnavPersonalisationPage.verifyPublicPromoteSellPart2Absent(data);
    });
  });
});
