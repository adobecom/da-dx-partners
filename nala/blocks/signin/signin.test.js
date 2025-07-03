import { test, expect } from '@playwright/test';
import SignInPage from './signin.page.js';

let signInPage;
import signin from './signin.spec.js';

const { features } = signin;
const loggedInAdobe = features.slice(3, 6);

test.describe('MAPP sign in flow', () => {
  test.beforeEach(async ({ page, browserName, baseURL, context }) => {
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

  test(`${features[0].name},${features[0].tags}`, async ({ page }) => {
    await test.step('Go to public home page', async () => {
      await page.goto(`${features[0].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
    });

    await test.step('Sign in', async () => {
      await signInPage.signIn(page, `${features[0].data.partnerLevel}`);
      await signInPage.globalFooter.waitFor({ state: 'visible', timeout: 30000 })
      await signInPage.profileIconButton .waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Verify redirection to protected home page after successful login', async () => {
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
      const pages = await page.context().pages();
      await expect(pages[0].url())
        .toContain(`${features[0].data.expectedProtectedURL}`);
    });

    await test.step('Logout', async () => {
      await signInPage.profileIconButton.click();
      await signInPage.logoutButton.click();
    });

    await test.step('Verify redirection to public home page after logout', async () => {
      await signInPage.globalFooter.waitFor({ state: 'visible', timeout: 30000 })
      await signInPage.signInButton.waitFor({ state: 'visible', timeout: 10000 });
      const pages = await page.context().pages();
      await expect(pages[0].url())
        .toContain(`${features[0].data.expectedPublicURL}`);
    });
  });

  test(`${features[1].name},${features[1].tags}`, async ({ page }) => {
    await test.step('Go to public home page', async () => {
      await page.goto(`${features[1].path}`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Sign in', async () => {
      await signInPage.signIn(page, `${features[1].data.partnerLevel}`);
      await signInPage.globalFooter.waitFor({ state: 'visible', timeout: 30000 })
      await signInPage.profileIconButton .waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('Verify restricted news after successful login', async () => {
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
      const pages = await page.context().pages();
      await expect(pages[0].url())
        .toContain(`${features[1].data.expectedToSeeInURL}`);
    });

    await test.step('Logout', async () => {
      await signInPage.profileIconButton.click();
      await signInPage.logoutButton.click();
    });
  });

  test(`${features[2].name},${features[2].tags}`, async ({ page, context }) => {
    await test.step('Go to stage.adobe.com', async () => {
      const url = `${features[2].baseURL}`;
      await page.evaluate((navigationUrl) => {
        window.location.href = navigationUrl;
      }, url);

      await signInPage.signInButtonStageAdobe.click();
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Sign in with spp community user', async () => {
      await signInPage.signIn(page, `${features[2].data.partnerLevel}`);
      await page.waitForTimeout(5000);
    });

    await test.step('Open public page in a new tab', async () => {
      const newTab = await context.newPage();
      await newTab.goto(`${features[2].path}`);
      const newTabPage = new SignInPage(newTab);
      await newTabPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
      const pages = await page.context().pages();
      await expect(pages[1].url())
        .toContain(`${features[2].data.expectedProtectedURL}`);
    });
  });

  loggedInAdobe.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page, context }) => {
      await test.step('Go to stage.adobe.com', async () => {
        const url = `${feature.baseURL}`;
        await page.evaluate((navigationUrl) => {
          window.location.href = navigationUrl;
        }, url);

      await signInPage.signInButtonStageAdobe.click();
      await page.waitForLoadState('domcontentloaded');
    });

      await test.step('Sign in with spp platinum user', async () => {
        await signInPage.signIn(page, `${feature.data.partnerLevel}`);
        await page.waitForTimeout(5000);
    });

      await test.step('Open restricted page in a new tab', async () => {
        const newTab = await context.newPage();
        await newTab.goto(`${feature.path}`);
        const pages = await page.context().pages();
        await expect(pages[1].url())
          .toContain(`${feature.data.expectedProtectedURL}`);
      });
    });
  });

  test(`${features[6].name},${features[6].tags}`, async ({ page }) => {
    await test.step('Go to public home page', async () => {
      await page.goto(`${features[6].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
    });

    await test.step('Sign in', async () => {
      await signInPage.signIn(page, `${features[6].data.partnerLevel}`);
    });

    await test.step('Verify restricted news after successful login', async () => {
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
      const pages = await page.context().pages();
      await expect(pages[0].url())
        .toContain(`${features[6].data.expectedToSeeInURL}`);
    });
  });

    test(`${features[7].name},${features[7].tags}`, async ({ page, context }) => {
    await test.step('Go to stage.adobe.com', async () => {
      const url = `${features[7].path}`;
      await page.evaluate((navigationUrl) => {
        window.location.href = navigationUrl;
      }, url);

      await signInPage.signInButton.click();
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Sign in with spp community user', async () => {
      await signInPage.signIn(page, `${features[7].data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('Open public page in a new tab', async () => {
      const newTab = await context.newPage();
      await newTab.goto(`${features[7].protectedPageUrl}`);
      const pages = await page.context().pages();
      await expect(pages[1].url())
        .toContain(`${features[7].data.expectedToSeeInURL}`);
    });
  });
});
