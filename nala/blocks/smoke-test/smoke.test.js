import { expect, test } from '@playwright/test';
import SmokeTest from './smoke.page.js';
import SmokeSpec from './smoke.spec.js';

let smokeTest;
const { features } = SmokeSpec;
const errorFlowCases = features.slice(10, 13);

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
      await smokeTest.gnav.waitFor({ state: 'visible', timeout: 30000 });
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
  test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL, context }) => {
    const { data, path } = features[3];

    await test.step('Go to Partner Directory Join page and verify the links', async () => {
      await page.goto(`${baseURL}${path}`);
      await smokeTest.signInButton.waitFor({ state: 'visible', timeout: 30000 });
    });
    await test.step('Check Becom a Partner button', async () => {
      await smokeTest.becomeAPartnerButton.waitFor({ state: 'visible', timeout: 30000 });
      expect(smokeTest.becomeAPartnerButton).toBeVisible();
      expect(smokeTest.becomeAPartnerButton).toBeEnabled();
      
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        smokeTest.becomeAPartnerButton.click()
      ]);

      await newPage.waitForLoadState('domcontentloaded');
      const newPageUrl = newPage.url();
      expect(newPageUrl).toContain(data.becomAPartnerUrl);
      await newPage.close();
    });
  });
  test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL, context }) => {
    const { data, path } = features[4];

    await test.step('Go to Partner Directory Join page and verify the links', async () => {
      await page.goto(`${baseURL}${path}`);
      await smokeTest.signInButton.waitFor({ state: 'visible', timeout: 30000 });
    });
    await test.step('Check Becom a Partner button', async () => {
      await smokeTest.findAPartnerButton.waitFor({ state: 'visible', timeout: 30000 });
      expect(smokeTest.findAPartnerButton).toBeVisible();
      expect(smokeTest.findAPartnerButton).toBeEnabled();
      
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        smokeTest.findAPartnerButton.click()
      ]);

      await newPage.waitForLoadState('domcontentloaded');
      const newPageUrl = newPage.url();
      expect(newPageUrl).toContain(data.findAPartnerUrl);
      await newPage.close();
    });
  }); 
  test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL, context }) => {
    const { data, path } = features[5];

    await test.step('Go to Analytics page and log in', async () => {
      await page.goto(`${baseURL}${path}`);
      await smokeTest.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await smokeTest.signInButton.click();
      await smokeTest.smokeSignIn(page, baseURL, data.partnerLevel);
      await smokeTest.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });
    await test.step('Check Analytics Card Collection', async () => {
      await smokeTest.collectionBlock.waitFor({ state: 'visible', timeout: 30000 });
      await expect(smokeTest.collectionBlock).toBeVisible();

      const result = await smokeTest.cardsResults.textContent();
      const firstResultNumber = parseInt(result.match(/\d+/)[0], 10);
      await expect(firstResultNumber).toBeGreaterThan(0);

      await smokeTest.firstFilterButton.waitFor({ state: 'visible', timeout: 30000 });
      await smokeTest.firstFilterButton.click();
      await smokeTest.firstFilterList.waitFor({ state: 'visible', timeout: 30000 });
      await smokeTest.firstFilterCheckbox.waitFor({ state: 'visible', timeout: 30000 });
      await smokeTest.firstFilterCheckbox.click();
      await smokeTest.loader.waitFor({ state: 'hidden', timeout: 30000 });
      const resultAfterFilter = await smokeTest.cardsResults.textContent();
      const secondResultNumber = parseInt(resultAfterFilter.match(/\d+/)[0], 10);
      await expect(secondResultNumber).toBeLessThan(firstResultNumber);
    });
  });
  test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL, context }) => {
    const { data, path } = features[6];

    await test.step('Go to Sale Center page and log in', async () => {
      await page.goto(`${baseURL}${path}`);
      await smokeTest.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await smokeTest.signInButton.click();
      await smokeTest.smokeSignIn(page, baseURL, data.partnerLevel);
      await smokeTest.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });
    await test.step('Check home and sale center buttons', async () => {
      await smokeTest.saleCenterButton.waitFor({ state: 'visible', timeout: 30000 });
      expect(smokeTest.saleCenterButton).toBeVisible();
      expect(smokeTest.saleCenterButton).toBeEnabled();

      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        smokeTest.saleCenterButton.click()
      ]);

      await newPage.waitForLoadState('domcontentloaded');
      const newPageUrl = newPage.url();
      expect(newPageUrl).toContain(data.expectedSaleCenterUrl);
      const newPageSmokeTest = new SmokeTest(newPage);
      await newPageSmokeTest.homeButton.waitFor({ state: 'visible', timeout: 30000 });
      await Promise.all([
        newPage.waitForLoadState('domcontentloaded'),
        newPageSmokeTest.homeButton.click()
      ]);
      const homePageUrl = newPage.url();
      expect(homePageUrl).toContain(data.homeUrl);
    });
  });
  test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL, context }) => {
    const { data, path } = features[7];

    await test.step('Go to Sale Center page and log in', async () => {
      await page.goto(`${baseURL}${path}`);
      await smokeTest.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await smokeTest.signInButton.click();
      await smokeTest.smokeSignIn(page, baseURL, data.partnerLevel);
      await smokeTest.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });
    await test.step('Check contact not found page', async () => {
      await page.waitForLoadState('domcontentloaded');
      const currentPageUrl = page.url();
      expect(currentPageUrl).toContain(data.contactNotFoundUrl);

      await smokeTest.becomeAPartnerButton.waitFor({ state: 'visible', timeout: 30000 });
    });
  });
  test(`${features[8].name},${features[8].tags}`, async ({ page, baseURL, context }) => {
    const { data, path } = features[8];

    await test.step('Go to Search page and log in', async () => {
      await page.goto(`${baseURL}${path}`);
      await smokeTest.smokeSignIn(page, baseURL, data.partnerLevel);
      await smokeTest.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
      await smokeTest.searchField.waitFor({ state: 'visible', timeout: 30000 });
    });
    await test.step('Search for keyword', async () => {
      const numberResultsBeforeSearch = await smokeTest.searchAllResults.textContent();
      const matchBeforeSearch = numberResultsBeforeSearch.match(/\((\d+)\)/);
      const numberResultsBeforeSearchValue = Number(matchBeforeSearch[1]);

      await smokeTest.searchField.fill(data.searchKeyword);
      await smokeTest.searchField.press('Enter');
      await page.waitForTimeout(5000);
      await smokeTest.searchAllResults.waitFor({ state: 'visible', timeout: 30000 });
      const textAfterSearch = await smokeTest.searchAllResults.textContent();
      const matchAfterSearch = textAfterSearch.match(/\((\d+)\)/);
      const numberResultsAfterSearch = Number(matchAfterSearch[1]);
      await expect(numberResultsBeforeSearchValue).toBeGreaterThanOrEqual(numberResultsAfterSearch);

      await smokeTest.productFilter.click();
      await smokeTest.productFilterPanel.waitFor({ state: 'visible', timeout: 30000 });
      await smokeTest.productFilterCheckbox.click();
      await smokeTest.loader.waitFor({ state: 'hidden', timeout: 30000 });
      await page.waitForTimeout(5000);
      const textAfterFilter = await smokeTest.searchAllResults.textContent();
      const matchAfterFilter = textAfterFilter.match(/\((\d+)\)/);
      const numberResultsAfterFilter = Number(matchAfterFilter[1]);
      await expect(numberResultsAfterFilter).toBeLessThan(numberResultsAfterSearch);
    });
  });
  test(`${features[9].name},${features[9].tags}`, async ({ page, baseURL, context }) => {
    const { data, path } = features[9];

    await test.step('Go to Feedback', async () => {
      await page.goto(`${baseURL}${path}`);
      await smokeTest.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await smokeTest.feedbackButton.waitFor({ state: 'visible', timeout: 30000 });
      expect(smokeTest.feedbackButton).toBeVisible();
      expect(smokeTest.feedbackButton).toBeEnabled();
      await smokeTest.feedbackButton.click();
    });
    await test.step('Check Feedback Dialog', async () => {
      await smokeTest.feedbackTitle.waitFor({ state: 'visible', timeout: 30000 });
      await expect(smokeTest.feedbackTitle).toBeVisible();
      await expect(smokeTest.feedbackTitle).toHaveText(data.feedbackTitle);

      await smokeTest.feedbackTextArea.waitFor({ state: 'visible', timeout: 30000 });

      await smokeTest.feedbackTextArea.fill(data.feedbackTextArea);
      await smokeTest.feedbackTextArea.press('Enter');

      await expect(smokeTest.feedbackSendButton).toBeVisible();
      await expect(smokeTest.feedbackSendButton).toBeDisabled();

      await smokeTest.feedBackStars3.waitFor({ state: 'visible', timeout: 30000 });
      await smokeTest.feedBackStars3.click();
      await expect(smokeTest.feedbackSendButton).toBeEnabled();
    });
  });
  errorFlowCases.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page, baseURL }) => {
      await test.step('Go to public home page', async () => {
        await page.goto(`${feature.path}`);
        await page.waitForLoadState('domcontentloaded');

        await smokeTest.signInButton.waitFor({ state: 'visible', timeout: 30000 });
        await smokeTest.signInButton.click();
        await smokeTest.smokeSignIn(page, baseURL, feature.data.partnerLevel);
        await smokeTest.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
      });
      await test.step('Verify error message', async () => {
        await smokeTest.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
        const pages = await page.context().pages();
        await expect(pages[0].url())
          .toContain(`${feature.data.expectedToSeeInURL}`);
      });
    });
  });
  test(`${features[14].name},${features[14].tags}`, async ({ page, baseURL }) => {
    const { path } = features[14];

    await test.step('Go to public home page', async () => {
      await page.goto(`${baseURL}${path}`);
      await page.waitForLoadState('domcontentloaded');
      await smokeTest.signInButton.waitFor({ state: 'visible', timeout: 30000 });
    });
    await test.step('Verify Jarvis Chat', async () => {
      await smokeTest.jarvisChatButton.waitFor({ state: 'visible', timeout: 30000 });
      await smokeTest.jarvisChatButton.click();
      await smokeTest.jarvisChatPanel.waitFor({ state: 'visible', timeout: 30000 });
    });
  });
});
