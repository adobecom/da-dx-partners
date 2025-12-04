/**
 * @jest-environment jsdom
 */

const mockGetModal = jest.fn();
jest.mock('https://test-milo-libs.com/blocks/modal/modal.js', () => ({
  getModal: (...args) => mockGetModal(...args),
}), { virtual: true });

jest.mock('../../eds/scripts/personalizationConfigDX.js', () => ({
  PERSONALIZATION_PLACEHOLDERS: {},
  PERSONALIZATION_CONDITIONS: {
    'partner-submitted-in-review': () => true,
    'partner-locked-compliance-past': () => true,
    'partner-locked-payment-future': () => true,
  },
}));
jest.mock('../../eds/scripts/personalization.js', () => ({
  personalizePage: jest.fn(() => {}),
  personalizePlaceholders: jest.fn(() => {}),
}));

jest.mock('../../eds/scripts/utils.js', () => ({
  getCurrentProgramType: jest.fn(() => 'dxp'),
  getMetadataContent: jest.fn(),
  getPartnerDataCookieValue: jest.fn(),
  isMember: jest.fn(),
}));

global.fetch = jest.fn();

describe('Test portalMessaging.js', () => {
  let getCurrentProgramType;
  let getMetadataContent;
  let getPartnerDataCookieValue;
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
    getPartnerDataCookieValue = utils.getPartnerDataCookieValue;
    isMember = utils.isMember;
    isMember.mockReturnValue(true);
    getPartnerDataCookieValue.mockReturnValue('has-specialstate');

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
    getPartnerDataCookieValue.mockReturnValue('');
    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    await portalMessaging(miloLibs, false);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockGetModal).not.toHaveBeenCalled();
  });

  it('warns and returns when fragment path missing', async () => {
    // ensure condition resolves and flow advances
    getPartnerDataCookieValue.mockReturnValue('submitted-in-review');
    getMetadataContent.mockReturnValue(null);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    await portalMessaging(miloLibs, false);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('should be displayed but popup fragment path is not found'));
    expect(mockGetModal).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('logs error and warns when fragment fetch fails', async () => {
    getPartnerDataCookieValue.mockReturnValue('submitted-in-review');
    getMetadataContent.mockReturnValue('/fragments/test-popup');
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('') });
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
    getPartnerDataCookieValue.mockReturnValue('submitted-in-review');
    getMetadataContent.mockReturnValue('/fragments/submitted-in-review-popup');

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
    getPartnerDataCookieValue.mockReturnValue('locked-compliance-past');
    getMetadataContent.mockReturnValue('/fragments/locked-compliance-popup');

    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    await portalMessaging(miloLibs, false);
    expect(mockGetModal).toHaveBeenCalled();
  });

  it('renders locked-payment popup when applicable', async () => {
    getPartnerDataCookieValue.mockReturnValue('locked-payment-future');
    getMetadataContent.mockReturnValue('/fragments/locked-payment-popup');

    const { portalMessaging } = require('../../eds/scripts/portalMessaging.js');
    await portalMessaging(miloLibs, false);
    expect(mockGetModal).toHaveBeenCalled();
  });
});


