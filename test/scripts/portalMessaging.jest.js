/**
 * @jest-environment jsdom
 */
import {PORTAL_MESSAGING_POPUP, SHOW_NEXT_POPUP} from "../../eds/scripts/utils.js";

const mockGetModal = jest.fn();
const mockLoadArea = jest.fn();

jest.mock('https://test-milo-libs.com/blocks/modal/modal.js', () => ({
  getModal: (...args) => mockGetModal(...args),
}), { virtual: true });

jest.mock('https://test-milo-libs.com/utils/utils.js', () => ({
  loadArea: (...args) => mockLoadArea(...args),
}), { virtual: true });

jest.mock('../../eds/scripts/personalizationConfigDX.js', () => ({
  PERSONALIZATION_PLACEHOLDERS: {},
  PERSONALIZATION_CONDITIONS: {
    'partner-submitted-in-review': false,
    'partner-locked-compliance-past': false,
    'partner-locked-payment-future': false,
  },
}));
jest.mock('../../eds/scripts/personalization.js', () => ({
  personalizePage: jest.fn(() => {}),
  personalizePlaceholders: jest.fn(() => {}),
}));

jest.mock('../../eds/scripts/rewriteLinks.js', () => ({
  rewriteLinks: jest.fn(() => {}),
}));

jest.mock('../../eds/scripts/utils.js', () => ({
  getCurrentProgramType: jest.fn(() => 'dxp'),
  getMetadataContent: jest.fn(),
  getPartnerCookieValue: jest.fn(),
  isMember: jest.fn(),
  PARTNER_AGREEMENT_POPUP: 'dxp:partnerAgreement',
  PORTAL_MESSAGING_POPUP: 'dxp:portalMessaging',
  CERTIFICATION_POPUP: 'dxp:certificationExpires',
  SHOW_NEXT_POPUP: 'dxp:showNextPopup',
}));

global.fetch = jest.fn();

describe('Test portalMessaging.js', () => {
  let getCurrentProgramType;
  let getMetadataContent;
  let getPartnerCookieValue;
  let isMember;
  const miloLibs = 'https://test-milo-libs.com';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    if (global.fetch && global.fetch.mockReset) global.fetch.mockReset();

    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.cookie = '';
    sessionStorage.clear();

    const utils = require('../../eds/scripts/utils.js');
    getCurrentProgramType = utils.getCurrentProgramType;
    getMetadataContent = utils.getMetadataContent;
    getPartnerCookieValue = utils.getPartnerCookieValue;
    isMember = utils.isMember;
    isMember.mockReturnValue(true);
    getPartnerCookieValue.mockReturnValue('has-specialstate');

    const fragmentHtml = `
      <html><body>
        <main><div id="popup-content">Hello</div></main>
      </body></html>`;
    global.fetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(fragmentHtml),
    });

    mockGetModal.mockImplementation((hash, options) => {
      const modal = document.createElement('div');
      modal.id = options?.id || 'portal-messaging-modal';
      if (options?.content) modal.appendChild(options.content);
      document.body.appendChild(modal);
      return Promise.resolve(modal);
    });

    mockLoadArea.mockResolvedValue();
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('returns early when partnerAgreementDisplayed is true', async () => {
    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    await portalMessaging(miloLibs, true);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockGetModal).not.toHaveBeenCalled();
  });

  it('returns early when user is not a member', async () => {
    isMember.mockReturnValue(false);
    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    await portalMessaging(miloLibs, false);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockGetModal).not.toHaveBeenCalled();
  });

  it('returns early when popup already closed (sessionStorage flag)', async () => {
    sessionStorage.setItem('portal-messaging-popup-closed', 'true');
    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    await portalMessaging(miloLibs, false);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockGetModal).not.toHaveBeenCalled();
  });

  it('returns early when specialstate cookie not present', async () => {
    getPartnerCookieValue.mockReturnValue('');
    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    await portalMessaging(miloLibs, false);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockGetModal).not.toHaveBeenCalled();
  });

  it('warns and returns when fragment path missing', async () => {
    // ensure condition resolves and flow advances
    getPartnerCookieValue.mockReturnValue('submitted-in-review');
    getMetadataContent.mockReturnValue(null);

    const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
    PERSONALIZATION_CONDITIONS['partner-submitted-in-review'] = true;
    PERSONALIZATION_CONDITIONS['partner-locked-compliance-past'] = false;
    PERSONALIZATION_CONDITIONS['partner-locked-payment-future'] = false;

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    await portalMessaging(miloLibs, false);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('should be displayed but popup fragment path is not found'));
    expect(mockGetModal).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('logs error and warns when fragment fetch fails', async () => {
    getPartnerCookieValue.mockReturnValue('submitted-in-review');
    getMetadataContent.mockReturnValue('/fragments/test-popup');
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('') });

    const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
    PERSONALIZATION_CONDITIONS['partner-submitted-in-review'] = true;
    PERSONALIZATION_CONDITIONS['partner-locked-compliance-past'] = false;
    PERSONALIZATION_CONDITIONS['partner-locked-payment-future'] = false;

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    await portalMessaging(miloLibs, false);
    expect(errorSpy).toHaveBeenCalledWith('Fetching partner agreement metadata failed, status 500');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Popup fragment for /fragments/test-popup not found'));
    expect(mockGetModal).not.toHaveBeenCalled();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('renders submitted-in-review popup', async () => {
    getPartnerCookieValue.mockReturnValue('submitted-in-review');
    getMetadataContent.mockReturnValue('/fragments/submitted-in-review-popup');

    const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
    PERSONALIZATION_CONDITIONS['partner-submitted-in-review'] = true;
    PERSONALIZATION_CONDITIONS['partner-locked-compliance-past'] = false;
    PERSONALIZATION_CONDITIONS['partner-locked-payment-future'] = false;

    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    await portalMessaging(miloLibs, false);
    expect(mockGetModal).toHaveBeenCalled();
    const modal = document.querySelector('#portal-messaging-modal');
    expect(modal).toBeTruthy();

    const lastCallArgs = mockGetModal.mock.calls.pop();
    const options = lastCallArgs?.[1];
    expect(typeof options?.closeCallback).toBe('function');
    options.closeCallback();
    expect(sessionStorage.getItem('portal-messaging-popup-closed')).toBe('true');
  });

  it('renders locked-compliance popup when applicable', async () => {
    getPartnerCookieValue.mockReturnValue('locked-compliance-past');
    getMetadataContent.mockReturnValue('/fragments/locked-compliance-popup');

    const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
    PERSONALIZATION_CONDITIONS['partner-submitted-in-review'] = false;
    PERSONALIZATION_CONDITIONS['partner-locked-compliance-past'] = true;
    PERSONALIZATION_CONDITIONS['partner-locked-payment-future'] = false;

    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    await portalMessaging(miloLibs, false);
    expect(mockGetModal).toHaveBeenCalled();
  });

  it('renders locked-payment popup when applicable', async () => {
    getPartnerCookieValue.mockReturnValue('locked-payment-future');
    getMetadataContent.mockReturnValue('/fragments/locked-payment-popup');

    const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
    PERSONALIZATION_CONDITIONS['partner-submitted-in-review'] = false;
    PERSONALIZATION_CONDITIONS['partner-locked-compliance-past'] = false;
    PERSONALIZATION_CONDITIONS['partner-locked-payment-future'] = true;

    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    await portalMessaging(miloLibs, false);
    expect(mockGetModal).toHaveBeenCalled();
  });

  it('dispatches SHOW_NEXT_POPUP with skip CERTIFICATION_POPUP when getModal returns null', async () => {
    // Setup conditions for popup to be shown
    getPartnerCookieValue.mockReturnValue('submitted-in-review');
    getMetadataContent.mockReturnValue('/fragments/submitted-popup');
    global.fetch.mockResolvedValue({
      ok: true,
      text: async () => '<main><div>Test content</div></main>',
    });

    const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
    PERSONALIZATION_CONDITIONS['partner-submitted-in-review'] = true;

    // Mock getModal to return null
    mockGetModal.mockResolvedValue(null);

    // Spy on dispatchEvent
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    const { CERTIFICATION_POPUP } = require('../../eds/scripts/utils.js');
    await portalMessaging(miloLibs, false);

    // Verify event was dispatched with skip: CERTIFICATION_POPUP
    expect(dispatchEventSpy).toHaveBeenCalled();
    const dispatchedEvent = dispatchEventSpy.mock.calls[0][0];
    expect(dispatchedEvent.type).toBe(SHOW_NEXT_POPUP);
    expect(dispatchedEvent.detail).toEqual({ next: CERTIFICATION_POPUP });

    dispatchEventSpy.mockRestore();
  });

  describe('bctqBanner', () => {
    it('should return early when user is not a member', async () => {
      isMember.mockReturnValue(false);

      const { bctqBanner } = require('../../eds/scripts/portalMessaging.js');
      await bctqBanner(miloLibs);

      // getMetadataContent should not be called
      expect(getMetadataContent).not.toHaveBeenCalled();
    });

    it('should return early when banner condition is not met', async () => {
      isMember.mockReturnValue(true);

      const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
      PERSONALIZATION_CONDITIONS['partner-bctq-expiring-90d'] = false;

      const { bctqBanner } = require('../../eds/scripts/portalMessaging.js');
      await bctqBanner(miloLibs);

      // getMetadataContent should not be called
      expect(getMetadataContent).not.toHaveBeenCalled();
    });

    it('should warn and return when fragment path is missing', async () => {
      isMember.mockReturnValue(true);

      const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
      PERSONALIZATION_CONDITIONS['partner-bctq-expiring-90d'] = true;

      getMetadataContent.mockReturnValue(null);

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const { bctqBanner } = require('../../eds/scripts/portalMessaging.js');
      await bctqBanner(miloLibs);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('bctq-banner should be displayed but popup fragment path is not found')
      );
      expect(global.fetch).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should warn and return when fragment content is not found', async () => {
      isMember.mockReturnValue(true);

      const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
      PERSONALIZATION_CONDITIONS['partner-bctq-expiring-90d'] = true;

      getMetadataContent.mockReturnValue('/fragments/bctq-banner');
      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => '<main></main>', // Empty main
      });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const { bctqBanner } = require('../../eds/scripts/portalMessaging.js');
      await bctqBanner(miloLibs);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Popup fragment for /fragments/bctq-banner not found')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should return when main element is not found', async () => {
      isMember.mockReturnValue(true);

      const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
      PERSONALIZATION_CONDITIONS['partner-bctq-expiring-90d'] = true;

      getMetadataContent.mockReturnValue('/fragments/bctq-banner');
      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => '<main><div>Banner content</div></main>',
      });

      // Remove main element from document
      const originalMain = document.querySelector('main');
      if (originalMain) originalMain.remove();

      const { bctqBanner } = require('../../eds/scripts/portalMessaging.js');
      await bctqBanner(miloLibs);

      // Should return early, prepend not called
      // No error should be thrown
    });

    it('should prepend banner content to main when all conditions are met', async () => {
      isMember.mockReturnValue(true);

      const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
      PERSONALIZATION_CONDITIONS['partner-bctq-expiring-90d'] = true;

      getMetadataContent.mockReturnValue('/fragments/bctq-banner');
      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => '<main><div class="bctq-banner">Banner content</div></main>',
      });

      // Ensure main element exists
      if (!document.querySelector('main')) {
        document.body.innerHTML = '<main></main>';
      }
      const mainElement = document.querySelector('main');
      const prependSpy = jest.spyOn(mainElement, 'prepend');

      const { bctqBanner } = require('../../eds/scripts/portalMessaging.js');
      await bctqBanner(miloLibs);

      expect(prependSpy).toHaveBeenCalled();
      expect(prependSpy.mock.calls[0][0].className).toBe('bctq-banner');

      prependSpy.mockRestore();
    });
  });
});


