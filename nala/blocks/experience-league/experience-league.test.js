import { test } from '@playwright/test';
import ExperienceLeaguePage from './experience-league.page.js';
import experienceLeagueCardCollectionSpec from './experience-league.spec.js';
import SignInPage from '../signin/signin.page.js';

const { features } = experienceLeagueCardCollectionSpec;

let experienceLeagueCardCollectionPage;
let signInPage;

test.describe('Experience League Page', () => {
  test.beforeEach(async ({ page, browserName, baseURL, context }) => {
    experienceLeagueCardCollectionPage = new ExperienceLeaguePage(page);
    signInPage = new SignInPage(page);

    if (baseURL && !baseURL.includes('partners.stage.adobe.com')) {
      const token = process.env.MILO_AEM_API_KEY;
      if (token) {
        await context.setExtraHTTPHeaders({ authorization: `token ${token}` });
      }
    }

    if (browserName === 'chromium' && baseURL && !baseURL.includes('partners.stage.adobe.com')) {
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
    const { previewUrl } = data;

    await test.step('Go to experience league card collection page', async () => {
      await page.goto(`${baseURL}${path}`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Search for automation regression card', async () => {
      await experienceLeagueCardCollectionPage.searchCardCollection(data.searchKeyword);
    });

    await test.step('Verify first card metadata after search', async () => {
      await experienceLeagueCardCollectionPage.verifyCardMetadata(data, previewUrl);
    });

    await test.step('Apply Industry filter, click View now, and verify Experience League page', async () => {
      await experienceLeagueCardCollectionPage.applyIndustryFilter(
        data.industryFilter,
        data.industryCheckbox,
      );
      await experienceLeagueCardCollectionPage.verifyCardStillDisplayed(data);
      await experienceLeagueCardCollectionPage.clickViewNowLinkAndVerifyNewTab(previewUrl);
    });
  });

  test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
    const { data, path } = features[1];
    const { previewUrl } = data;
    let card;

    await test.step('Go to search page and sign in as Community user', async () => {
      await page.goto(`${baseURL}${path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
      await signInPage.signIn(page, data.partnerLevel);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('Search, open Pages tab, and verify expanded card metadata', async () => {
      await experienceLeagueCardCollectionPage.searchOnSearchPage(data.searchKeyword);
      await experienceLeagueCardCollectionPage.clickPagesTab();
      card = await experienceLeagueCardCollectionPage.expandAndVerifySearchPageCard(data, previewUrl);
    });

    await test.step('Apply Industry filter and verify same card stays on top', async () => {
      await experienceLeagueCardCollectionPage.applyIndustryFilter(
        data.industryFilter,
        data.industryCheckbox,
      );
      await experienceLeagueCardCollectionPage.verifySearchPageTopCardTitle(data);
    });

    await test.step('Click preview button and verify Experience League page opens in new tab', async () => {
      await experienceLeagueCardCollectionPage.clickSearchPagePreviewButtonAndVerifyNewTab(
        card,
        previewUrl,
      );
    });
  });
});
