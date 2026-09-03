/**
 * @jest-environment jsdom
 */
import { SHOW_NEXT_POPUP } from '../../eds/scripts/utils.js';

const mockGetModal = jest.fn();
const mockLoadArea = jest.fn();

jest.mock('https://test-milo-libs.com/blocks/modal/modal.js', () => ({ getModal: (...args) => mockGetModal(...args) }), { virtual: true });

jest.mock('https://test-milo-libs.com/utils/utils.js', () => ({ loadArea: (...args) => mockLoadArea(...args) }), { virtual: true });

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

jest.mock('../../eds/scripts/rewriteLinks.js', () => ({ rewriteLinks: jest.fn(() => {}) }));

jest.mock('../../eds/scripts/utils.js', () => ({
  getCurrentProgramType: jest.fn(() => 'dxp'),
  getMetadataContent: jest.fn(),
  getPartnerCookieValue: jest.fn(),
  isMember: jest.fn(),
  PARTNER_AGREEMENT_POPUP: 'dxp:partnerAgreement',
  PORTAL_MESSAGING_POPUP: 'dxp:portalMessaging',
  CERTIFICATION_POPUP: 'dxp:certificationExpires',
  SHOW_NEXT_POPUP: 'dxp:showNextPopup',
  preventModalClose: jest.fn(),
}));

global.fetch = jest.fn();

describe('Test portalMessaging.js', () => {
  let getMetadataContent;
  let getPartnerCookieValue;
  let preventModalClose;
  let personalizePage;
  let personalizePlaceholders;
  let rewriteLinks;
  let personalizationConditions;
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
    getMetadataContent = utils.getMetadataContent;
    getPartnerCookieValue = utils.getPartnerCookieValue;
    preventModalClose = utils.preventModalClose;
    personalizePage = require('../../eds/scripts/personalization.js').personalizePage;
    personalizePlaceholders = require('../../eds/scripts/personalization.js').personalizePlaceholders;
    rewriteLinks = require('../../eds/scripts/rewriteLinks.js').rewriteLinks;
    personalizationConditions = require('../../eds/scripts/personalizationConfigDX.js').PERSONALIZATION_CONDITIONS;
    personalizationConditions['partner-submitted-in-review'] = false;
    personalizationConditions['partner-locked-compliance-past'] = false;
    personalizationConditions['partner-locked-payment-future'] = false;
    personalizationConditions['partner-bctq-expiring-90d'] = false;
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
    const result = await portalMessaging(miloLibs, true);
    expect(result).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockGetModal).not.toHaveBeenCalled();
  });

  it('returns early when no popup condition matches', async () => {
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    const { CERTIFICATION_POPUP } = require('../../eds/scripts/utils.js');
    const result = await portalMessaging(miloLibs, false);

    expect(result).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockGetModal).not.toHaveBeenCalled();
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: SHOW_NEXT_POPUP,
      detail: { next: CERTIFICATION_POPUP },
    }));

    dispatchEventSpy.mockRestore();
  });

  it('returns early when popup already closed (sessionStorage flag)', async () => {
    sessionStorage.setItem('portal-messaging-popup-closed', 'true');
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    const { CERTIFICATION_POPUP } = require('../../eds/scripts/utils.js');
    const result = await portalMessaging(miloLibs, false);
    expect(result).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockGetModal).not.toHaveBeenCalled();

    // Verify SHOW_NEXT_POPUP event was dispatched
    expect(dispatchEventSpy).toHaveBeenCalled();
    const dispatchedEvent = dispatchEventSpy.mock.calls[0][0];
    expect(dispatchedEvent.type).toBe(SHOW_NEXT_POPUP);
    expect(dispatchedEvent.detail).toEqual({ next: CERTIFICATION_POPUP });

    dispatchEventSpy.mockRestore();
  });

  it('returns early when specialstate cookie not present', async () => {
    getPartnerCookieValue.mockReturnValue('');
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    const { CERTIFICATION_POPUP } = require('../../eds/scripts/utils.js');
    const result = await portalMessaging(miloLibs, false);
    expect(result).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockGetModal).not.toHaveBeenCalled();

    // Verify SHOW_NEXT_POPUP event was dispatched
    expect(dispatchEventSpy).toHaveBeenCalled();
    const dispatchedEvent = dispatchEventSpy.mock.calls[0][0];
    expect(dispatchedEvent.type).toBe(SHOW_NEXT_POPUP);
    expect(dispatchedEvent.detail).toEqual({ next: CERTIFICATION_POPUP });

    dispatchEventSpy.mockRestore();
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
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    const { CERTIFICATION_POPUP } = require('../../eds/scripts/utils.js');
    const result = await portalMessaging(miloLibs, false);
    expect(result).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('should be displayed but popup fragment path is not found'));
    expect(mockGetModal).not.toHaveBeenCalled();

    // Verify SHOW_NEXT_POPUP event was dispatched
    expect(dispatchEventSpy).toHaveBeenCalled();
    const dispatchedEvent = dispatchEventSpy.mock.calls[0][0];
    expect(dispatchedEvent.type).toBe(SHOW_NEXT_POPUP);
    expect(dispatchedEvent.detail).toEqual({ next: CERTIFICATION_POPUP });

    warnSpy.mockRestore();
    dispatchEventSpy.mockRestore();
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
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    const { CERTIFICATION_POPUP } = require('../../eds/scripts/utils.js');
    const result = await portalMessaging(miloLibs, false);
    expect(result).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith('Fetching partner agreement metadata failed, status 500');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Popup fragment for /fragments/test-popup not found'));
    expect(mockGetModal).not.toHaveBeenCalled();

    // Verify SHOW_NEXT_POPUP event was dispatched
    expect(dispatchEventSpy).toHaveBeenCalled();
    const dispatchedEvent = dispatchEventSpy.mock.calls[0][0];
    expect(dispatchedEvent.type).toBe(SHOW_NEXT_POPUP);
    expect(dispatchedEvent.detail).toEqual({ next: CERTIFICATION_POPUP });

    errorSpy.mockRestore();
    warnSpy.mockRestore();
    dispatchEventSpy.mockRestore();
  });

  it('renders submitted-in-review popup', async () => {
    getPartnerCookieValue.mockReturnValue('submitted-in-review');
    getMetadataContent.mockReturnValue('/fragments/submitted-in-review-popup');

    const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
    PERSONALIZATION_CONDITIONS['partner-submitted-in-review'] = true;
    PERSONALIZATION_CONDITIONS['partner-locked-compliance-past'] = false;
    PERSONALIZATION_CONDITIONS['partner-locked-payment-future'] = false;

    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    const result = await portalMessaging(miloLibs, false);
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/fragments/submitted-in-review-popup');
    expect(mockGetModal).toHaveBeenCalled();
    const modal = document.querySelector('#portal-messaging-modal');
    expect(modal).toBeTruthy();
    expect(preventModalClose).toHaveBeenCalledWith(modal);
    expect(mockLoadArea).toHaveBeenCalledWith(modal);
    expect(personalizePlaceholders).toHaveBeenCalledWith({}, modal, 'dxp');
    expect(personalizePage).toHaveBeenCalledWith(modal);
    expect(rewriteLinks).toHaveBeenCalledWith(modal);

    const lastCallArgs = mockGetModal.mock.calls.pop();
    const options = lastCallArgs?.[1];
    expect(options).toMatchObject({
      id: 'portal-messaging-modal',
      class: 's-size',
    });
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
    const result = await portalMessaging(miloLibs, false);
    expect(result).toBe(true);
    expect(getMetadataContent).toHaveBeenCalledWith('locked-compliance-past-modal');
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
    const result = await portalMessaging(miloLibs, false);
    expect(result).toBe(true);
    expect(getMetadataContent).toHaveBeenCalledWith('locked-payment-future-modal');
    expect(mockGetModal).toHaveBeenCalled();
  });

  it('uses locked-payment popup when multiple popup conditions are true', async () => {
    getMetadataContent.mockReturnValue('/fragments/locked-payment-popup');

    const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
    PERSONALIZATION_CONDITIONS['partner-submitted-in-review'] = true;
    PERSONALIZATION_CONDITIONS['partner-locked-compliance-past'] = true;
    PERSONALIZATION_CONDITIONS['partner-locked-payment-future'] = true;

    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    const result = await portalMessaging(miloLibs, false);

    expect(result).toBe(true);
    expect(getMetadataContent).toHaveBeenCalledWith('locked-payment-future-modal');
    expect(global.fetch).toHaveBeenCalledWith('/fragments/locked-payment-popup');
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
    const result = await portalMessaging(miloLibs, false);
    expect(result).toBe(false);

    // Verify event was dispatched with skip: CERTIFICATION_POPUP
    expect(dispatchEventSpy).toHaveBeenCalled();
    const dispatchedEvent = dispatchEventSpy.mock.calls[0][0];
    expect(dispatchedEvent.type).toBe(SHOW_NEXT_POPUP);
    expect(dispatchedEvent.detail).toEqual({ next: CERTIFICATION_POPUP });

    dispatchEventSpy.mockRestore();
  });

  it('loadPopupFragment returns the first element in the fragment main', async () => {
    const { loadPopupFragment } = require('../../eds/scripts/portalMessaging.js');

    const fragment = await loadPopupFragment('/fragments/test-popup', 'portal messaging');

    expect(global.fetch).toHaveBeenCalledWith('/fragments/test-popup');
    expect(fragment.id).toBe('popup-content');
    expect(fragment.textContent).toBe('Hello');
  });

  it('getBctqBanner only loads content when the bctq condition is true', async () => {
    const { getBctqBanner } = require('../../eds/scripts/portalMessaging.js');

    expect(await getBctqBanner()).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();

    personalizationConditions['partner-bctq-expiring-90d'] = true;
    getMetadataContent.mockReturnValue('/fragments/bctq-banner');

    const banner = await getBctqBanner();

    expect(getMetadataContent).toHaveBeenCalledWith('bctq-banner');
    expect(global.fetch).toHaveBeenCalledWith('/fragments/bctq-banner');
    expect(banner.id).toBe('popup-content');
  });

  it('getGlobalBanner returns nothing when metadata is NONE', async () => {
    getMetadataContent.mockReturnValue(' none ');

    const { getGlobalBanner } = require('../../eds/scripts/portalMessaging.js');
    const banner = await getGlobalBanner();

    expect(banner).toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('getGlobalBanner warns and skips invalid relative paths', async () => {
    getMetadataContent.mockReturnValue('fragments/global-banner');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { getGlobalBanner } = require('../../eds/scripts/portalMessaging.js');
    const banner = await getGlobalBanner();

    expect(banner).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith('Invalid global-banner path: fragments/global-banner');
    expect(global.fetch).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('prependContent prepends notification ribbon, bctq banner, and global banner before existing main content', async () => {
    document.body.innerHTML = '<main><p id="existing">Existing</p></main>';
    personalizationConditions['partner-bctq-expiring-90d'] = true;
    getMetadataContent.mockImplementation((type) => ({
      'bctq-banner': '/fragments/bctq-banner',
      'global-banner': '/fragments/global-banner',
    }[type]));
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html><body><main><div id="bctq-banner">BCTQ</div></main></body></html>'),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html><body><main><div id="global-banner">Global</div></main></body></html>'),
      });

    const { prependContent } = require('../../eds/scripts/portalMessaging.js');
    await prependContent();

    const children = [...document.querySelector('main').children].map((child) => child.id);
    expect(children).toEqual(['notificationRibbon', 'bctq-banner', 'global-banner', 'existing']);
  });

  it('prependContent exits when the page has no main element', async () => {
    document.body.innerHTML = '<section>No main</section>';

    const { prependContent } = require('../../eds/scripts/portalMessaging.js');
    await prependContent();

    expect(getMetadataContent).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
