/**
 * @jest-environment jsdom
 */

// Milo dynamic import mocks (wired to the miloLibs argument we pass in tests)
const mockCreateTag = jest.fn();
const mockLoadStyle = jest.fn();
const mockCloseModal = jest.fn();
const mockGetModal = jest.fn();

// partnerAgreement dynamically imports `${miloLibs}/...`, so we must mock these URLs.
jest.mock('https://test-milo-libs.com/utils/utils.js', () => ({
  createTag: (...args) => mockCreateTag(...args),
  loadStyle: (...args) => mockLoadStyle(...args),
}), { virtual: true });

jest.mock('https://test-milo-libs.com/blocks/modal/modal.js', () => ({
  closeModal: (...args) => mockCloseModal(...args),
  getModal: (...args) => mockGetModal(...args),
}), { virtual: true });

jest.mock('https://test-milo-libs.com/features/spectrum-web-components/dist/theme.js', () => ({}), { virtual: true });
jest.mock('https://test-milo-libs.com/features/spectrum-web-components/dist/progress-circle.js', () => ({}), { virtual: true });

// Mock dependencies consumed by partnerAgreement.js
jest.mock('../../eds/blocks/utils/utils.js', () => ({
  getConfig: jest.fn(() => ({ codeRoot: '/eds' })),
  getRuntimeActionUrl: jest.fn((path) => `https://runtime.com${path}`),
}));

jest.mock('../../eds/scripts/utils.js', () => ({
  getCookieValue: jest.fn(),
  getCurrentProgramType: jest.fn(() => 'dxp'),
  getMetadataContent: jest.fn(),
  getPartnerDataCookieValue: jest.fn(),
  isMember: jest.fn(),
}));

// Global fetch mock
global.fetch = jest.fn();

describe('Test partnerAgreement.js', () => {
  let getCookieValue;
  let getCurrentProgramType;
  let getMetadataContent;
  let getPartnerDataCookieValue;
  let isMember;
  let getConfig;
  let getRuntimeActionUrl;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    if (global.fetch && global.fetch.mockReset) global.fetch.mockReset();

    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.cookie = '';

    window = Object.create(window);
    Object.defineProperty(window, 'location', {
      value: { pathname: '/digitalexperience/', hostname: 'partners.adobe.com' },
      writable: true,
    });

    mockCreateTag.mockImplementation((tag, attributes, content) => {
      const el = document.createElement(tag);
      if (attributes) {
        Object.keys(attributes).forEach((key) => {
          if (key === 'class') el.className = attributes[key];
          else el.setAttribute(key, attributes[key]);
        });
      }
      if (content) {
        if (Array.isArray(content)) {
          content.forEach((child) => {
            if (typeof child === 'string') {
              const span = document.createElement('span');
              span.innerHTML = child;
              el.appendChild(span);
            } else if (child instanceof Node) {
              el.appendChild(child);
            }
          });
        } else if (typeof content === 'string') {
          el.innerHTML = content;
        } else if (content instanceof Node) {
          el.appendChild(content);
        }
      }
      return el;
    });

    mockLoadStyle.mockResolvedValue(undefined);

    mockGetModal.mockImplementation((hash, options) => {
      const modal = document.createElement('div');
      modal.id = options?.id || 'modal';
      modal.className = options?.class || '';

      const closeBtn = document.createElement('button');
      closeBtn.className = 'dialog-close';
      modal.appendChild(closeBtn);

      if (options?.content) modal.appendChild(options.content);

      const curtain = document.createElement('div');
      curtain.className = 'modal-curtain is-open';
      document.body.appendChild(curtain);

      document.body.appendChild(modal);
      return Promise.resolve(modal);
    });

    mockCloseModal.mockImplementation((modal) => { if (modal?.parentNode) modal.remove(); });

    const utilsModule = require('../../eds/scripts/utils.js');
    getCookieValue = utilsModule.getCookieValue;
    getCurrentProgramType = utilsModule.getCurrentProgramType;
    getMetadataContent = utilsModule.getMetadataContent;
    getPartnerDataCookieValue = utilsModule.getPartnerDataCookieValue;
    isMember = utilsModule.isMember;

    const blockUtilsModule = require('../../eds/blocks/utils/utils.js');
    getConfig = blockUtilsModule.getConfig;
    getRuntimeActionUrl = blockUtilsModule.getRuntimeActionUrl;
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('early exits and metadata', () => {
    it('does nothing when member and latest agreement accepted', async () => {
      isMember.mockReturnValue(true);
      getPartnerDataCookieValue.mockReturnValue('true');

      const { partnerAgreement } = require('../../eds/scripts/partnerAgreement.js');
      await partnerAgreement('https://test-milo-libs.com');

      expect(getMetadataContent).not.toHaveBeenCalled();
    });

    it('warns when partner agreement meta path is missing', async () => {
      isMember.mockReturnValue(false);
      getPartnerDataCookieValue.mockReturnValue(null);
      getMetadataContent.mockReturnValue(null);

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { partnerAgreement } = require('../../eds/scripts/partnerAgreement.js');
      await partnerAgreement('https://test-milo-libs.com');

      expect(warnSpy).toHaveBeenCalledWith('Partner agreement should be displayed but partner agreement meta path is not authored');
      warnSpy.mockRestore();
    });

    it('logs error if metadata fetch fails', async () => {
      isMember.mockReturnValue(false);
      getPartnerDataCookieValue.mockReturnValue(null);
      getMetadataContent.mockReturnValue('/path/to/meta.html');

      global.fetch.mockResolvedValueOnce({ ok: false, status: 404, text: () => Promise.resolve('') });

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { partnerAgreement } = require('../../eds/scripts/partnerAgreement.js');
      await partnerAgreement('https://test-milo-libs.com');

      expect(errorSpy).toHaveBeenCalledWith('Fetching partner agreement metadata failed, status 404');
      errorSpy.mockRestore();
    });
  });

  describe('agreement fetch handling', () => {
    const metaHtml = `
      <html>
        <head>
          <meta name="agreementtitle" content="Agreement" />
          <meta name="agreementdescription" content="Description" />
          <meta name="agreementctalabel" content="Accept" />
          <meta name="agreementsuccessmessage" content="Success!" />
          <meta name="agreementerrormessage" content="Error!" />
        </head>
      </html>
    `;

    it('logs when response is empty and stops before creating modal', async () => {
      isMember.mockReturnValue(false);
      getPartnerDataCookieValue.mockReturnValue(null);
      getMetadataContent.mockReturnValue('/path/meta.html');

      global.fetch.mockImplementation((url) => {
        if (url === '/path/meta.html') {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(metaHtml) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ terms: [] }) });
      });

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { partnerAgreement } = require('../../eds/scripts/partnerAgreement.js');
      await partnerAgreement('https://test-milo-libs.com');

      expect(errorSpy).toHaveBeenCalledWith('Partner Agreement response is empty');
      expect(mockGetModal).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('logs error when fetch response is not ok', async () => {
      isMember.mockReturnValue(false);
      getPartnerDataCookieValue.mockReturnValue(null);
      getMetadataContent.mockReturnValue('/path/meta.html');

      global.fetch.mockImplementation((url) => {
        if (url === '/path/meta.html') {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(metaHtml) });
        }
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
      });

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { partnerAgreement } = require('../../eds/scripts/partnerAgreement.js');
      await partnerAgreement('https://test-milo-libs.com');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('fetch Partner Agreement failed'));
      errorSpy.mockRestore();
    });

    it('uses getRuntimeActionUrl with correct path', async () => {
      isMember.mockReturnValue(false);
      getPartnerDataCookieValue.mockReturnValue(null);
      getMetadataContent.mockReturnValue('/digitalexperience/fragments/partner-agreement-meta');

      global.fetch.mockImplementation((url) => {
        if (url === '/digitalexperience/fragments/partner-agreement-meta') {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(metaHtml) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ terms: [] }) });
      });

      const { partnerAgreement } = require('../../eds/scripts/partnerAgreement.js');
      await partnerAgreement('https://test-milo-libs.com');

      expect(getRuntimeActionUrl).toHaveBeenCalledWith('/api/v1/web/dx-partners-runtime/partner-agreement');
    });
  });

  describe('modal creation and UI', () => {
    it('creates modal with expected UI structure', async () => {
      isMember.mockReturnValue(false);
      getPartnerDataCookieValue.mockReturnValue(null);
      getMetadataContent.mockReturnValue('/digitalexperience/fragments/partner-agreement-meta');

      const metaHtml = `
        <html>
          <head>
            <meta name="agreementtitle" content="Test Title" />
            <meta name="agreementdescription" content="Test Desc" />
            <meta name="agreementctalabel" content="I Accept" />
            <meta name="agreementsuccessmessage" content="Thanks" />
            <meta name="agreementerrormessage" content="Nope" />
          </head>
        </html>
      `;

      let call = 0;
      global.fetch.mockImplementation((url) => {
        call += 1;
        if (call === 1) return Promise.resolve({ ok: true, text: () => Promise.resolve(metaHtml) });
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ terms: ['<p>Partner Agreement Text</p>'] }) });
      });

      const { partnerAgreement } = require('../../eds/scripts/partnerAgreement.js');
      await partnerAgreement('https://test-milo-libs.com');

      expect(mockGetModal).toHaveBeenCalled();
      const modal = document.querySelector('#partner-agreement-modal');
      expect(modal).toBeTruthy();

      const wrapper = modal.querySelector('.agreement-wrapper');
      expect(wrapper).toBeTruthy();
      expect(wrapper.querySelector('.agreement-header')).toBeTruthy();
      expect(wrapper.querySelector('.agreement-hr')).toBeTruthy();
      expect(wrapper.querySelector('.agreement-body')).toBeTruthy();
      expect(wrapper.querySelector('.agreement-description')).toBeTruthy();
      expect(wrapper.querySelector('.agreement-text')).toBeTruthy();
      expect(wrapper.querySelector('.agreement-footer')).toBeTruthy();
      expect(wrapper.querySelector('.agreement-cta')).toBeTruthy();
    });
  });

  describe('accept flow', () => {
    const metaHtml = `
      <html>
        <head>
          <meta name="agreementtitle" content="Agreement" />
          <meta name="agreementdescription" content="Description" />
          <meta name="agreementctalabel" content="Accept" />
          <meta name="agreementsuccessmessage" content="Success!" />
          <meta name="agreementerrormessage" content="Error!" />
        </head>
      </html>
    `;

    it('accept success closes modal and sets regenerate cookie', async () => {
      jest.useFakeTimers();
      isMember.mockReturnValue(false);
      getPartnerDataCookieValue.mockReturnValue(null);
      getMetadataContent.mockReturnValue('/digitalexperience/fragments/partner-agreement-meta');
      getCurrentProgramType.mockReturnValue('dxp');
      getCookieValue.mockReturnValue(JSON.stringify({ DXP: { status: 'MEMBER' } }));

      let call = 0;
      global.fetch.mockImplementation(() => {
        call += 1;
        if (call === 1) return Promise.resolve({ ok: true, text: () => Promise.resolve(metaHtml) });
        if (call === 2) return Promise.resolve({ ok: true, json: () => Promise.resolve({ terms: ['<p>Terms</p>'] }) });
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
      });

      const { partnerAgreement } = require('../../eds/scripts/partnerAgreement.js');
      await partnerAgreement('https://test-milo-libs.com');

      const cta = document.querySelector('.agreement-cta');
      cta.click();

      // allow async click handler (promises) to run
      await Promise.resolve();
      await Promise.resolve();
      // advance timers to trigger closeModal timeout
      jest.advanceTimersByTime(2100);
      // let any post-timeout microtasks flush
      await Promise.resolve();

      const partnerCookie = document.cookie.split(';').find((c) => c.trim().startsWith('partner_data='))?.trim();
      expect(partnerCookie).toBeTruthy();
      const value = partnerCookie.split('partner_data=')[1]?.split(';')[0];
      const parsed = JSON.parse(decodeURIComponent(value));
      expect(parsed.DXP.regenerate).toBe('true');

      const spinner = document.querySelector('.agreement-spinner');
      expect(spinner).toBeTruthy();
      expect(spinner.innerHTML).toContain('Success!');
    });

    it('accept error logs and does not close modal', async () => {
      isMember.mockReturnValue(false);
      getPartnerDataCookieValue.mockReturnValue(null);
      getMetadataContent.mockReturnValue('/path/meta.html');
      getCookieValue.mockReturnValue(JSON.stringify({ DXP: { status: 'MEMBER' } }));

      let call = 0;
      global.fetch.mockImplementation(() => {
        call += 1;
        if (call === 1) return Promise.resolve({ ok: true, text: () => Promise.resolve(metaHtml) });
        if (call === 2) return Promise.resolve({ ok: true, json: () => Promise.resolve({ terms: ['<p>Terms</p>'] }) });
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ errorCode: 'ACCEPT_ERROR' }) });
      });

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { partnerAgreement } = require('../../eds/scripts/partnerAgreement.js');
      await partnerAgreement('https://test-milo-libs.com');
      document.querySelector('.agreement-cta').click();
      await Promise.resolve();
      await Promise.resolve();

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Accepting partner agreement failed'));
      expect(mockCloseModal).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('prevent modal close behavior', () => {
    it('removes Milo close button and keeps modal open on escape/click outside', async () => {
      isMember.mockReturnValue(false);
      getPartnerDataCookieValue.mockReturnValue(null);
      getMetadataContent.mockReturnValue('/digitalexperience/fragments/partner-agreement-meta');

      const metaHtml = `<html><head><meta name="agreementtitle" content="T" /></head></html>`;
      global.fetch.mockImplementation((url) => {
        if (url === '/digitalexperience/fragments/partner-agreement-meta') return Promise.resolve({ ok: true, text: () => Promise.resolve(metaHtml) });
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ terms: ['<p>Terms</p>'] }) });
      });

      const { partnerAgreement } = require('../../eds/scripts/partnerAgreement.js');
      await partnerAgreement('https://test-milo-libs.com');

      const modal = document.querySelector('#partner-agreement-modal');
      expect(modal).toBeTruthy();
      expect(modal.querySelector('.dialog-close')).toBeFalsy();

      const evt = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      modal.dispatchEvent(evt);

      const curtain = document.querySelector('.modal-curtain.is-open');
      const clickEvt = new MouseEvent('click', { bubbles: true });
      curtain.dispatchEvent(clickEvt);

      expect(document.querySelector('#partner-agreement-modal')).toBeTruthy();
    });
  });
});

