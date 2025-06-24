import { test, expect } from '@playwright/test';
import NewsPage from './news.page.js';
import SignInPage from '../signin/signin.page.js';

let newsPage;
let signInPage;
import News from './news.spec.js';

const { features } = News;

// test.describe('Validate news block', () => {
//   test.beforeEach(async ({ page, browserName, baseURL, context }) => {
//     newsPage = new NewsPage(page);
//     signInPage = new SignInPage(page);
//     if (!baseURL.includes('partners.stage.adobe.com')) {
//           await context.setExtraHTTPHeaders({ authorization: `token ${process.env.MILO_AEM_API_KEY}` });
//         }
//         if (browserName === 'chromium' && !baseURL.includes('partners.stage.adobe.com')) {
//           await page.route('https://www.adobe.com/chimera-api/**', async (route, request) => {
//             const newUrl = request.url().replace(
//               'https://www.adobe.com/chimera-api',
//               'https://14257-chimera.adobeioruntime.net/api/v1/web/chimera-0.0.1',
//             );
//             route.continue({ url: newUrl });
//           });
//         }
//   });


//   async function findCardsForPartnerLevel(page, path, data, context) {
//     await test.step('Click Sign In', async () => {
//       await page.goto(path);
//       const result = await newsPage.resultNumber.textContent();
//       await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
//       await newsPage.searchField.fill(data.cardPartnerLevel);
//       const resultCardPartnerLevel = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultCardPartnerLevel.split(' ')[0], 10)).toBe(0);
//       await signInPage.addCookie(data.partnerPortal, data.partnerLevel, path, context);
//       await newsPage.clearSearchSelector.click();
//       await page.reload();
//     });

//     await test.step('Find automation regression cards for current partner level', async () => {
//       const resultAll = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultAll.split(' ')[0], 10)).toBe(data.resultTotal);
//       await newsPage.searchField.fill(data.cardPartnerLevel);
//       const resultCardPartnerLevel = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultCardPartnerLevel.split(' ')[0], 10)).toBe(data.partnerLevelCard);
//       await newsPage.searchField.fill(data.cardLevelAbove);
//       const resultCardPartnerLevelAbove = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultCardPartnerLevelAbove.split(' ')[0], 10)).toBe(data.noCards);
//     });
//   }

//   test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
//     const { data, path } = features[0];
//     await test.step('Go to News page', async () => {
//       console.log('url: ', baseURL + features[0].path);
//       await page.goto(`${baseURL}${path}`);
//       const result = await newsPage.resultNumber.textContent();
//       await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
//     });

//     await test.step('Enter Automation regression news card DX Public no1 in search field', async () => {
//       await newsPage.searchField.fill(data.publicCard1);
//       const result = await newsPage.resultNumber.textContent();
//       await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfMatchingTitleCards);
//     });

//     await test.step('Clear search field on X', async () => {
//       await newsPage.clearSearchSelector.click();
//       const result = await newsPage.resultNumber.textContent();
//       await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
//     });

//     await test.step('Enter Automation regression news card DX Public no2 in search field', async () => {
//       await newsPage.searchField.fill(data.publicCard2);
//       const result = await newsPage.resultNumber.textContent();
//       await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfMatchingTitleCards);
//     });

//     await test.step('Clear all', async () => {
//       await newsPage.clearAllSelector.click();
//       const result = await newsPage.resultNumber.textContent();
//       await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
//     });

//     await test.step('Enter This is automation in search field', async () => {
//       await newsPage.searchField.fill(data.cardDescription);
//       const result = await newsPage.resultNumber.textContent();
//       await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfMatchingDescCards);
//     });
//   });

//   test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
//     const { data, path } = features[1];
//     await test.step('Go to News page', async () => {
//       await page.goto(`${baseURL}${path}`);
//       await newsPage.firstCardDate.waitFor({ state: 'visible', timeout: 20000 });
//       const result = await newsPage.resultNumber.textContent();
//       await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
//     });

//     await test.step('Select Oldest sort option', async () => {
//       await newsPage.searchField.fill(data.cardTitle);
//       const result = await newsPage.resultNumber.textContent();
//       await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfCardsWithTitle);
//       await newsPage.sortBtn.click();
//       await newsPage.oldestOption.click();
//       const paginationText = await newsPage.paginationText.textContent();
//       await expect(paginationText.toLowerCase()).toBe(data.firstLoadResult);
//     });

//     await test.step('Load more cards', async () => {
//       await newsPage.loadMore.click();
//       let paginationText = await newsPage.paginationText.textContent();
//       await expect(paginationText.toLowerCase()).toBe(data.secondLoadResult);
//       await newsPage.loadMore.click();
//       paginationText = await newsPage.paginationText.textContent();
//       await expect(paginationText.toLowerCase()).toBe(data.thirdLoadResult);
//       await expect(await newsPage.loadMore).not.toBeVisible();
//       const firstCardDate = new Date(await newsPage.firstCardDate.textContent()).getTime();
//       const lastCardDate = new Date(await newsPage.lastCardDate.textContent()).getTime();
//       await expect(firstCardDate).toBeLessThan(lastCardDate);
//       await expect(await newsPage.cardCount.count()).toBe(data.numberOfCardsWithTitle);
//     });
//   });

//   test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
//     const { data, path } = features[2];
//     await test.step('Go to News page', async () => {
//       await page.goto(`${baseURL}${path}`);
//       await newsPage.firstCardDate.waitFor({ state: 'visible', timeout: 15000 });
//       const result = await newsPage.resultNumber.textContent();
//       await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
//       await newsPage.searchField.fill(data.searchCards);
//       const filteredCards = await newsPage.resultNumber.textContent();
//       await expect(parseInt(filteredCards.split(' ')[0], 10)).toBe(data.numberOfCardsWithTitle);
//     });

//     await test.step('Verify pagination buttons', async () => {
//       let paginationText = await newsPage.paginationText.textContent();
//       await expect(paginationText.toLowerCase()).toBe(data.firstPageResult);
//       const paginationPrevButton = await newsPage.paginationPrevButton;
//       await expect(paginationPrevButton).toHaveClass(/disabled/);
//       const paginationNextButton = await newsPage.paginationNextButton;
//       await expect(paginationNextButton).not.toHaveClass(/disabled/);
//       await expect(await newsPage.pageCount.count()).toBe(data.totalPageCount);
//       await newsPage.clickPageNumButton(data.pageButtonNumber);
//       paginationText = await newsPage.paginationText.textContent();
//       await expect(paginationText.toLowerCase()).toBe(data.secondPageResult);
//       await expect(paginationPrevButton).not.toHaveClass(/disabled/);
//       await expect(paginationNextButton).not.toHaveClass(/disabled/);
//       await paginationNextButton.click();
//       paginationText = await newsPage.paginationText.textContent();
//       await expect(paginationText.toLowerCase()).toBe(data.thirdPageResult);
//       await expect(paginationPrevButton).not.toHaveClass(/disabled/);
//       await expect(paginationNextButton).toHaveClass(/disabled/);
//     });
//   });

//     test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
//       const { data, path } = features[3];
//       await test.step('Go to News page', async () => {
//       await page.goto(`${baseURL}${path}`);
//       await newsPage.firstCardDate.waitFor({ state: 'visible', timeout: 20000 });
//       const result = await newsPage.resultNumber.textContent();
//       await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
//     });

//     await test.step('Test applications filter', async () => {
//       await newsPage.expandFilterOptions(data.filterApplication);
//       await newsPage.clickFilterOptions(data.filterCampaign);
//       const resultAfterCampaignFilterApplied = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultAfterCampaignFilterApplied.split(' ')[0], 10)).toBe(data.cardsWithCampaign);
//       await newsPage.clickFilterOptions(data.filterAnalytics);
//       const resultAfterAnalyticsFilterApplied = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultAfterAnalyticsFilterApplied.split(' ')[0], 10)).toBe(data.cardsWithCampaignAndAnalytics);
//       await newsPage.clearFilter(data.filterApplication, '2');
//       const resultAfterClearingApplicationsFilter = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultAfterClearingApplicationsFilter.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
//       await newsPage.expandFilterOptions(data.filterApplication);
//     });

//     await test.step('Test audience filter', async () => {
//       await newsPage.expandFilterOptions(data.filterAudience);
//       await newsPage.clickFilterOptions(data.filterTechnical);
//       const resultAfterTechnical = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultAfterTechnical.split(' ')[0], 10)).toBe(data.cardsWithTechnical);
//       await newsPage.clearSideBarFilterButton(data.filterTechnical);
//       const resultAfterClearingFilter = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultAfterClearingFilter.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
//       await newsPage.expandFilterOptions(data.filterAudience);
//     });

//     await test.step('Test region filter', async () => {
//       await newsPage.expandFilterOptions(data.filterRegion);
//       await newsPage.clickFilterOptions(data.filterAmericas);
//       await newsPage.clickFilterOptions(data.filterJapan);
//       const resultAfterRegionFilters = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultAfterRegionFilters.split(' ')[0], 10)).toBe(data.cardsWithAmericasAndJapan);
//       await newsPage.clickFilterOptions(data.filterAmericas);
//       const resultAfterUncheckingAmericas = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultAfterUncheckingAmericas.split(' ')[0], 10)).toBe(data.cardsWithJapan);
//     });

//     await test.step('Test topic filter', async () => {
//       await newsPage.expandFilterOptions(data.filterTopic);
//       await newsPage.clickFilterOptions(data.filterSolutions);
//       const resultAfterTopicFilter = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultAfterTopicFilter.split(' ')[0], 10)).toBe(data.cardsWithSolutions);
//       await newsPage.clearAllSelector.click();
//       const resultAfterClearingAllFilters = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultAfterClearingAllFilters.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
//     });
//   });

//   test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
//     const { data, path } = features[4];
//     await test.step('Go to News page', async () => {
//       await page.goto(`${baseURL}${path}`);
//       await page.waitForLoadState('domcontentloaded');
//       await newsPage.searchField.fill(data.cardTitle);
//       await newsPage.firstCardTitle.waitFor({ state: 'visible', timeout: 10000 });
//       const resultAfterSearch = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultAfterSearch.split(' ')[0], 10)).toBe(data.cardsWithTitle);
//     });

//     await test.step('Read now', async () => {
//       await newsPage.readCard.click();
//       const pages = await page.context().pages();
//       await expect(pages[0].url())
//         .toContain(`${data.expectedToSeeInURL}`);
//     });
//   });

//   test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
//     const { data, path } = features[5];
//     await test.step('Go to News page', async () => {
//       await page.goto(`${baseURL}${path}`);
//       const result = await newsPage.resultNumber.textContent();
//       await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
//     });

//     await test.step('Edge cases search bar', async () => {
//       await newsPage.searchField.fill(data.dateInPast);
//       const resultDateInPastCard = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultDateInPastCard.split(' ')[0], 10)).toBe(data.oneCard);
//       await newsPage.searchField.fill(data.publicCard6);
//       const resultDxPublicCardNo6 = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultDxPublicCardNo6.split(' ')[0], 10)).toBe(data.oneCard);
//       await newsPage.searchField.fill(data.cardWithSpecialChars);
//       const resultSpecialCharsCard = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultSpecialCharsCard.split(' ')[0], 10)).toBe(data.oneCard);
//       await newsPage.searchField.fill(data.cardWithoutNewsCollection);
//       const resultWithoutNewsTagCard = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultWithoutNewsTagCard.split(' ')[0], 10)).toBe(data.noCards);
//       await newsPage.clearAllSelector.click();
//       const firstCardTitle = await newsPage.firstCardTitle;
//       await expect(firstCardTitle).toBeEmpty();
//       await newsPage.searchField.fill(data.cardWithoutTitle);
//       const resultWithoutTitleCard = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultWithoutTitleCard.split(' ')[0], 10)).toBe(data.noCards);
//     });
//   });

//   test(`${features[6].name},${features[6].tags}`, async ({ page, context, baseURL, browserName}) => {
//     if (browserName === 'firefox') {
//       test.slow();
//     }
//     const { data, path } = features[6];
//     await test.step('Click Sign In', async () => {
//       await page.goto(`${baseURL}${path}`);
//       await page.waitForLoadState('domcontentloaded');
//       const result = await newsPage.resultNumber.textContent();
//       await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
//       await newsPage.searchField.fill(data.platinumCard);
//       const resultPlatinum = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultPlatinum.split(' ')[0], 10)).toBe(data.noCards);
//       await signInPage.addCookie(data.partnerPortal, data.partnerLevel, baseURL + path, context);

//       await newsPage.clearSearchSelector.click();
//       await page.reload();
//       await page.waitForSelector('.partner-cards-cards-results', { state: 'visible' });
//     });

//     await test.step('Find platinum automation regression cards', async () => {
//       const resultAll = await newsPage.resultNumber.textContent();
//       await expect(parseInt(resultAll.split(' ')[0], 10)).toBe(data.numberOfAllCards);
//       await newsPage.searchField.fill(data.platinumCard);
//       const result = await newsPage.resultNumber.textContent();
//       await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfPlatinumCards);
//     });

//     await test.step('Read now', async () => {
//       await newsPage.readCard.click();
//       const pages = await page.context().pages();
//       await expect(pages[0].url())
//         .toContain(`${data.expectedToSeeInURL}`);
//     });
//   });

//   test(`${features[7].name},${features[7].tags}`, async ({ page, context, baseURL, browserName }) => {
//     if (browserName === 'firefox') {
//       test.slow();
//     }
//     const { data, path } = features[7];
//     await findCardsForPartnerLevel(
//       page,
//       baseURL + path,
//       data,
//       context,
//     );
//   });

//   test(`${features[8].name},${features[8].tags}`, async ({ page, context, baseURL, browserName }) => {
//     if (browserName === 'firefox') {
//       test.slow();
//     }
//     const { data, path } = features[8];
//     await findCardsForPartnerLevel(
//       page,
//       baseURL + path,
//       data,
//       context,
//     );
//   });

//   test(`${features[9].name},${features[9].tags}`, async ({ page, context, baseURL, browserName }) => {
//     if (browserName === 'firefox') {
//       test.slow();
//     }
//     const { data, path } = features[9];
//     await findCardsForPartnerLevel(
//       page,
//       baseURL + path,
//       data,
//       context,
//     );
//   });

//   test(`${features[10].name},${features[10].tags}`, async ({ page, context, baseURL, browserName }) => {
//     if (browserName === 'firefox') {
//       test.slow();
//     }
//     const { data, path } = features[10];
//     await test.step('Click Sign In', async () => {
//       await findCardsForPartnerLevel(
//         page,
//         baseURL + path,
//         data,
//         context,
//       );
//     });
//   });

//   test(`${features[11].name},${features[11].tags}`, async ({ page, context, baseURL, browserName }) => {
//     if (browserName === 'firefox') {
//       test.slow();
//     }
//     const { data, path } = features[11];
//     await test.step('Go to stage.adobe.com', async () => {
//       await page.goto(`${baseURL}${path}`);
//       await signInPage.addCookie(data.partnerPortal, data.partnerLevel, baseURL + path, context);
//       await page.reload();
//       await page.waitForSelector('.partner-cards-cards-results', { state: 'visible' });
//     });

//     await test.step(`Compare results`, async () => {
//       await expect(newsPage.resultCardNumber).toBeVisible();

//       const resultCards = await newsPage.resultCardNumber.textContent();
//       await expect(parseInt(resultCards)).toBe(data.numberOfPublicCards);
//     });
//   });
// });
