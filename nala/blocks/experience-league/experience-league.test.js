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

    await test.step('Search and verify the first card', async () => {
      await experienceLeagueCardCollectionPage.searchCardCollection(data.searchKeyword);
      await experienceLeagueCardCollectionPage.verifyCardMetadata(data, previewUrl);
    });

    await test.step('Apply Industry filter, click View now, and verify Experience League page', async () => {
      await experienceLeagueCardCollectionPage.applyFilter(data.industryFilter, data.industryCheckbox);
      await experienceLeagueCardCollectionPage.verifyCardStillDisplayed(data);
      await experienceLeagueCardCollectionPage.clickViewNowLinkAndVerifyNewTab(previewUrl);
      await experienceLeagueCardCollectionPage.applyFilter(data.contentTypeFilter, data.documentationCheckbox);
      await experienceLeagueCardCollectionPage.verifyCardStillDisplayed(data);
    });
  });

  test(`${features[1].name},${features[1].tags} + ${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
    const { data: data2, path } = features[1];
    const { data: data3 } = features[2];

    await test.step('Go to search page and sign in as Community user', async () => {
      await page.goto(`${baseURL}${path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await signInPage.signInButton.click();
      await signInPage.signIn(page, data2.partnerLevel);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('Search and open Pages tab', async () => {
      await experienceLeagueCardCollectionPage.searchOnSearchPage(data2.searchKeyword);
      await experienceLeagueCardCollectionPage.clickPagesTab();
    });

    await test.step('Verify expanded card and Industry filter', async () => {
      const { previewUrl } = data2;
      const card = await experienceLeagueCardCollectionPage.expandAndVerifySearchPageCard(
        data2,
        previewUrl,
      );
      await experienceLeagueCardCollectionPage.applyFilter(data2.industryFilter, data2.industryCheckbox);
      await experienceLeagueCardCollectionPage.verifySearchPageTopCardTitle(data2);
      await experienceLeagueCardCollectionPage.clickSearchPagePreviewButtonAndVerifyNewTab(
        card,
        previewUrl,
      );
    });

    await test.step('Verify content type filters', async () => {
      await experienceLeagueCardCollectionPage.applyFilter(data3.contentTypeFilter, data3.documentationCheckbox);
      await experienceLeagueCardCollectionPage.verifySearchPageTopCardTitle(data3);

      await experienceLeagueCardCollectionPage.applyFilter(data3.contentTypeFilter, data3.customerStoryCheckbox);
      await experienceLeagueCardCollectionPage.verifyPartnerCollectionCardNotPresent(data3);

      await experienceLeagueCardCollectionPage.uncheckFilter(data3.contentTypeFilter, data3.customerStoryCheckbox);
      await experienceLeagueCardCollectionPage.applyFilter(data3.industryFilter, data3.industryCheckbox);
      await experienceLeagueCardCollectionPage.verifySearchPageTopCardTitle(data3);
    });
  });
});
