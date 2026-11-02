import { test, expect } from '@playwright/test';
import CalendlyPage from './calendly.page';
import calendlySpec from './calendly.spec';
import SignInPage from '../signin/signin.page.js';

let calendlyPage;
let signInPage;
const { features } = calendlySpec;

async function setAuxSid(context, value) {
  await context.clearCookies({ name: 'aux_sid' });
  await context.addCookies([{
    name: 'aux_sid',
    value,
    domain: '.adobe.com',
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'None',
  }]);
}

test.describe('Calendly Feature', () => {
  test.beforeEach(async ({ page, baseURL, context, browserName }) => {
    calendlyPage = new CalendlyPage(page);
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

  // @calendly-ui-validation
  test(`${features[0].name},${features[0].tags}`, async ({ page }) => {
    test.setTimeout(50000);
    const { data } = features[0];

    await test.step('Log in with calendly user', async () => {
      await page.goto(`${features[0].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signInButton.click();
      await signInPage.signIn(page, `${features[0].data.partnerLevel}`);
      await calendlyPage.profile.waitFor({ state: 'visible', timeout: 50000 });
    });

    await test.step('Validate UI', async () => {
      await expect(calendlyPage.calendlyComponent).toBeVisible({ timeout: 30000 });
      await expect(calendlyPage.availableDate).toBeVisible({ timeout: 50000 });
      await calendlyPage.availableDate.click();

      await expect(calendlyPage.spotList).toBeVisible({ timeout: 15000 });
      await expect(calendlyPage.timeSlots.first()).toBeVisible();
      const startTime = await calendlyPage.firstTimeSlot.getAttribute('data-start-time');
      await calendlyPage.firstTimeSlot.click();

      const nextButton = calendlyPage.calendlyFrame.getByRole('button', { name: `Next ${startTime}` });
      await expect(nextButton).toBeVisible();
      await nextButton.click();
    });

    await test.step('Validate prefilled invitee details', async () => {
      await expect(calendlyPage.firstNameInput).toHaveValue(data.firstName, { timeout: 15000 });
      await expect(calendlyPage.lastNameInput).toHaveValue(data.lastName);
      await expect(calendlyPage.emailInput).toHaveValue(data.email);
      await expect(calendlyPage.scheduleEventButton).toBeEnabled();
    });
  });

  // @calendly-expty-account-state-calls-state-management
  test(`${features[1].name},${features[1].tags}`, async ({ page, context, baseURL }) => {
    const auxSid = process.env.DX_CALENDLY_AUX_SID;
    test.skip(!auxSid, 'DX_CALENDLY_AUX_SID is not set');

    const {
      partnerData,
      partner_account_state: partnerAccountState,
      stateManagementUrl,
    } = features[1].data;

    await test.step('Set mocked cookies and aux_sid token', async () => {
      const {
        partnerPortal: _partnerPortal,
        partnerLevel: _partnerLevel,
        ...dxpPartnerData
      } = partnerData;

      await context.addCookies([
        {
          name: 'partner_data',
          value: JSON.stringify({ DXP: dxpPartnerData }),
          url: baseURL,
        },
        {
          name: 'partner_account_state',
          value: JSON.stringify(partnerAccountState),
          url: baseURL,
        },
      ]);

      await setAuxSid(context, auxSid);
    });

    await test.step('Open Calendly page and validate POST state management', async () => {
      await page.goto(features[1].path, { waitUntil: 'domcontentloaded' });
      await setAuxSid(context, auxSid);

      const isStateManagementPost = (request) => request.method() === 'POST'
        && request.url().startsWith(stateManagementUrl);

      const [request] = await Promise.all([
        page.waitForRequest(isStateManagementPost, { timeout: 30000 }),
        page.reload(),
      ]);

      expect(request.method()).toBe('POST');
      expect(request.postDataJSON()).toEqual({
        programType: 'DXP',
        action: 'refreshPartnerAccountState',
        email: partnerData.email,
      });
    });
  });

  // @calendly-existing-account-does-not-call-state-management
  test(`${features[2].name},${features[2].tags}`, async ({ page, context, baseURL }) => {
    const {
      partnerData,
      partner_account_state: partnerAccountState,
      stateManagementUrl,
    } = features[2].data;

    const stateManagementRequests = [];

    await test.step('Set mocked cookies with existing calendly booking', async () => {
      const {
        partnerPortal: _partnerPortal,
        partnerLevel: _partnerLevel,
        ...dxpPartnerData
      } = partnerData;

      await context.addCookies([
        {
          name: 'partner_data',
          value: JSON.stringify({ DXP: dxpPartnerData }),
          url: baseURL,
        },
        {
          name: 'partner_account_state',
          value: JSON.stringify(partnerAccountState),
          url: baseURL,
        },
      ]);
    });

    await test.step('Open Calendly page and record state-management calls', async () => {
      page.on('request', (request) => {
        if (request.url().startsWith(stateManagementUrl)) {
          stateManagementRequests.push(`${request.method()} ${request.url()}`);
        }
      });

      await page.goto(features[2].path);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Validate already booked state and no state-management call', async () => {
      await expect(calendlyPage.alreadyBookedFragment).toBeVisible({ timeout: 30000 });
      await expect(calendlyPage.calendlyEmbed).toHaveCount(0);

      await page.waitForLoadState('networkidle');
      expect(stateManagementRequests).toEqual([]);
    });
  });
});
