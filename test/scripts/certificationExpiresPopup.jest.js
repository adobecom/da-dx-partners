/**
 * @jest-environment jsdom
 */

// Milo dynamic import mocks
const mockGetModal = jest.fn();
const mockLoadArea = jest.fn();

jest.mock('https://test-milo-libs.com/blocks/modal/modal.js', () => ({ getModal: (...args) => mockGetModal(...args) }), { virtual: true });

jest.mock('https://test-milo-libs.com/utils/utils.js', () => ({ loadArea: (...args) => mockLoadArea(...args) }), { virtual: true });

// Mock dependencies
jest.mock('../../eds/scripts/utils.js', () => ({
  getCurrentProgramType: jest.fn(() => 'dxp'),
  getMetadataContent: jest.fn(),
  isMember: jest.fn(),
  invokeAfterImsIsReady: jest.fn(async (callback) => await callback()), // Immediately invoke callback and await result
}));

jest.mock('../../eds/scripts/portalMessaging.js', () => ({ loadPopupFragment: jest.fn() }));

jest.mock('../../eds/blocks/utils/utils.js', () => ({ isProd: jest.fn(() => false) }));

jest.mock('../../eds/scripts/rewriteLinks.js', () => ({ rewriteLinks: jest.fn() }));

jest.mock('../../eds/scripts/personalization.js', () => ({
  personalizePage: jest.fn(),
  personalizePlaceholders: jest.fn(),
}));

jest.mock('../../eds/scripts/personalizationConfigDX.js', () => ({ PERSONALIZATION_PLACEHOLDERS: {} }));

// Global mocks
global.fetch = jest.fn();
window.dxpImsReady = 'eventhappend';

// Mock localStorage
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: mockGetItem,
    setItem: mockSetItem,
  },
  writable: true,
});

global.window = Object.create(window);
global.window.adobeIMS = { getAccessToken: jest.fn(() => ({ token: 'test-token' })) };

describe('Test certificationExpiresPopup.js', () => {
  let getCurrentProgramType;
  let getMetadataContent;
  let isMember;
  let invokeAfterImsIsReady;
  let loadPopupFragment;
  let isProd;
  let rewriteLinks;
  let personalizePage;
  let personalizePlaceholders;

  // Helper function to normalize dates to local midnight (start of day)
  const normalizeDate = (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  // Helper function to create a date X days from today at local midnight
  const daysFromToday = (days) => {
    const today = normalizeDate(new Date());
    return new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  };

  // Helper function to get today's date at local midnight
  const getToday = () => normalizeDate(new Date());

  // Helper function to format date as DD/MM/YYYY (matching API format)
  const toDDMMYYYY = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    // Reset global mocks
    if (global.fetch && global.fetch.mockReset) global.fetch.mockReset();
    mockGetItem.mockReset();
    mockSetItem.mockReset();

    document.head.innerHTML = '';
    document.body.innerHTML = '';

    // Set default mock implementations
    mockGetModal.mockImplementation((hash, options) => {
      const modal = document.createElement('div');
      modal.id = options?.id || 'modal';
      modal.className = options?.class || '';
      if (options?.content) modal.appendChild(options.content);
      document.body.appendChild(modal);
      return Promise.resolve(modal);
    });

    mockLoadArea.mockResolvedValue(undefined);

    // Get mocked functions from modules
    const utilsModule = require('../../eds/scripts/utils.js');
    getCurrentProgramType = utilsModule.getCurrentProgramType;
    getMetadataContent = utilsModule.getMetadataContent;
    isMember = utilsModule.isMember;
    invokeAfterImsIsReady = utilsModule.invokeAfterImsIsReady;

    const portalMessagingModule = require('../../eds/scripts/portalMessaging.js');
    loadPopupFragment = portalMessagingModule.loadPopupFragment;

    const blockUtilsModule = require('../../eds/blocks/utils/utils.js');
    isProd = blockUtilsModule.isProd;

    const rewriteLinksModule = require('../../eds/scripts/rewriteLinks.js');
    rewriteLinks = rewriteLinksModule.rewriteLinks;

    const personalizationModule = require('../../eds/scripts/personalization.js');
    personalizePage = personalizationModule.personalizePage;
    personalizePlaceholders = personalizationModule.personalizePlaceholders;
    
    // Set default return values
    getCurrentProgramType.mockReturnValue('dxp');
    isProd.mockReturnValue(false);
    isMember.mockReturnValue(true);
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });
  describe('early exits', () => {
    it('should exit early if partnerAgreementDisplayed is true', async () => {
      const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');

      await certificationExpiresPopup('https://test-milo-libs.com', false, true, 'test-client-id');

      // Should not make API calls or show modal when partnerAgreement was displayed
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockGetModal).not.toHaveBeenCalled();
    });

    it('should exit early if portalMessagingOpen is true', async () => {
      const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');

      await certificationExpiresPopup('https://test-milo-libs.com', true, false, 'test-client-id');

      // Should not make API calls or show modal when portal messaging is open
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockGetModal).not.toHaveBeenCalled();
    });

    it('should exit early if both partnerAgreementDisplayed and portalMessagingOpen are true', async () => {
      const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');

      await certificationExpiresPopup('https://test-milo-libs.com', true, true, 'test-client-id');

      // Should not make API calls or show modal when both flags are true
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockGetModal).not.toHaveBeenCalled();
    });

    it('should exit if popup was already shown today', async () => {
      const todayUTC = normalizeDate(new Date()); // Today at UTC midnight
      mockGetItem.mockReturnValue(todayUTC.toISOString());

      const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');

      await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockGetModal).not.toHaveBeenCalled();
    });
  });

  describe('API calls', () => {
    beforeEach(() => {
      // Last shown more than 24 hours ago (yesterday)
      mockGetItem.mockReturnValue(daysFromToday(-2).toISOString());
    });

    it('should use production URL when isProd returns true', async () => {
      // Must reset modules to re-evaluate the partnerDirectoryUrl constant
      jest.resetModules();
      
      // Re-setup mocks after reset
      const utilsModule = require('../../eds/scripts/utils.js');
      const blockUtilsModule = require('../../eds/blocks/utils/utils.js');
      utilsModule.getCurrentProgramType.mockReturnValue('dxp');
      utilsModule.isMember.mockReturnValue(true);
      blockUtilsModule.isProd.mockReturnValue(true);
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ credentials: []}),
      });

      const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
      await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://partner-directory.adobe.io/v1/dxp/contact/credentials',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-token',
            'x-api-key': 'test-client-id',
          },
        }),
      );
    });

    it('should use stage URL when isProd returns false', async () => {
      // Must reset modules to re-evaluate the partnerDirectoryUrl constant
      jest.resetModules();
      
      // Re-setup mocks after reset
      const utilsModule = require('../../eds/scripts/utils.js');
      const blockUtilsModule = require('../../eds/blocks/utils/utils.js');
      utilsModule.getCurrentProgramType.mockReturnValue('dxp');
      utilsModule.isMember.mockReturnValue(true);
      blockUtilsModule.isProd.mockReturnValue(false);
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ credentials: []}),
      });

      const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
      await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://partner-directory-stage.adobe.io/v1/dxp/contact/credentials',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-token',
            'x-api-key': 'test-client-id',
          },
        }),
      );
    });

    it('should handle API error gracefully', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
      await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');
      expect(mockGetModal).not.toHaveBeenCalled();
    });

    it('should handle fetch exception gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
      await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

      expect(errorSpy).toHaveBeenCalledWith('Network error');
      expect(mockGetModal).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('milestone calculation', () => {
    beforeEach(() => {
      // Last shown 2 days ago (more than 24 hours)
      mockGetItem.mockReturnValue(daysFromToday(-2).toISOString());
      getMetadataContent.mockReturnValue('/digitalexperience/fragments/modals/certification-modal');
      loadPopupFragment.mockResolvedValue(document.createElement('div'));
    });

    it('should not display modal if no certifications reach milestone', async () => {
      const futureDate = daysFromToday(200); // 200 days from now (beyond 180-day threshold)
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
            credentials: [
              { expirationDate: toDDMMYYYY(futureDate) },
           ],
        }),
      });

      const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
      await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

      expect(mockGetModal).not.toHaveBeenCalled();
    });

    it('should not display modal if certification already expired', async () => {
      const pastDate = daysFromToday(-10); // 10 days ago
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
            credentials: [
              { expirationDate: toDDMMYYYY(pastDate) },
            ],
        }),
      });

      const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
      await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

      expect(mockGetModal).not.toHaveBeenCalled();
    });

    describe('180-90 days range (every 30 days)', () => {
      it('should display modal at 180-day milestone', async () => {
        const expirationDate = daysFromToday(180);
        mockGetItem.mockReturnValue(daysFromToday(-2).toISOString());

        global.fetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            credentials: [{ expirationDate: toDDMMYYYY(expirationDate) }],
          }),
        });

        const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
        await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

        expect(mockGetModal).toHaveBeenCalled();
      });

      it('should display modal at 90-day milestone', async () => {
        const expirationDate = daysFromToday(90);
        mockGetItem.mockReturnValue(daysFromToday(-2).toISOString());

        global.fetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            credentials: [{ expirationDate: toDDMMYYYY(expirationDate) }],
          }),
        });

        const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
        await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

        expect(mockGetModal).toHaveBeenCalled();
      });

      it('should not display modal between milestones (e.g., 140 days)', async () => {
        const expirationDate = daysFromToday(140);
        const lastShown = daysFromToday(-5); // 5 days ago
        mockGetItem.mockReturnValue(lastShown.toISOString());

        global.fetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            credentials: [{ expirationDate: toDDMMYYYY(expirationDate) }],}),
        });

        const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
        await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

        expect(mockGetModal).not.toHaveBeenCalled();
      });
    });

    describe('90-60 days range (every 15 days)', () => {
      it('should display modal at 75-day milestone', async () => {
        const expirationDate = daysFromToday(75);
        mockGetItem.mockReturnValue(daysFromToday(-2).toISOString());

        global.fetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            credentials: [{ expirationDate: toDDMMYYYY(expirationDate) }],
          }),
        });

        const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
        await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

        expect(mockGetModal).toHaveBeenCalled();
      });
    });

    describe('60-30 days range (every 10 days)', () => {
      it('should display modal at 50-day milestone', async () => {
        const expirationDate = daysFromToday(50);
        mockGetItem.mockReturnValue(daysFromToday(-2).toISOString());

        global.fetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({credentials: [{ expirationDate: toDDMMYYYY(expirationDate) }] }),
        });

        const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
        await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

        expect(mockGetModal).toHaveBeenCalled();
      });
    });

    describe('30-15 days range (every 2 days)', () => {
      it('should display modal at 28-day milestone', async () => {
        const expirationDate = daysFromToday(28);
        mockGetItem.mockReturnValue(daysFromToday(-2).toISOString());

        global.fetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            credentials: [{ expirationDate: toDDMMYYYY(expirationDate) }],
          }),
        });

        const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
        await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

        expect(mockGetModal).toHaveBeenCalled();
      });
    });

    describe('15-1 days range (every day)', () => {
      it('should display modal at 1-day milestone', async () => {
        const expirationDate = daysFromToday(1);
        mockGetItem.mockReturnValue(daysFromToday(-2).toISOString());

        global.fetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            credentials: [{ expirationDate: toDDMMYYYY(expirationDate) }],
          }),
        });

        const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
        await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

        expect(mockGetModal).toHaveBeenCalled();
      });
    });

    describe('multiple expiring certifications', () => {
      it('should show popup if any certification reaches milestone', async () => {
        const expiration1 = daysFromToday(200); // No milestone
        const expiration2 = daysFromToday(90); // At 90-day milestone
        const expiration3 = daysFromToday(50); // At 50-day milestone
        mockGetItem.mockReturnValue(daysFromToday(-2).toISOString());

        global.fetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
              credentials: [
                { expirationDate: toDDMMYYYY(expiration1) },
                { expirationDate: toDDMMYYYY(expiration2) },
                { expirationDate: toDDMMYYYY(expiration3) },
              ],
          }),
        });

        const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
        await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

        // Should show popup (only once, even though multiple certs at milestones)
        expect(mockGetModal).toHaveBeenCalledTimes(1);
      });

      it('should not show multiple popups for multiple certifications', async () => {
        const expiration1 = daysFromToday(90);
        const expiration2 = daysFromToday(60);
        const expiration3 = daysFromToday(30);
        mockGetItem.mockReturnValue(daysFromToday(-2).toISOString());

        global.fetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
              credentials: [
                { expirationDate: toDDMMYYYY(expiration1) },
                { expirationDate: toDDMMYYYY(expiration2) },
                { expirationDate: toDDMMYYYY(expiration3) },
              ],
          }),
        });

        const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
        await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

        // Only one popup shown per day
        expect(mockGetModal).toHaveBeenCalledTimes(1);
      });

      it('should not show popup if all certifications already shown today', async () => {
        const expiration1 = daysFromToday(90);
        const expiration2 = daysFromToday(30);
        const lastShown = getToday(); // Today (UTC midnight)
        mockGetItem.mockReturnValue(lastShown.toISOString());

        global.fetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
              credentials: [
                { expirationDate: toDDMMYYYY(expiration1) },
                { expirationDate: toDDMMYYYY(expiration2) },
              ],
          }),
        });

        const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
        await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

        expect(mockGetModal).not.toHaveBeenCalled();
      });
    });
  });

  describe('modal creation', () => {
    beforeEach(() => {
      mockGetItem.mockReturnValue(daysFromToday(-2).toISOString());
      const expirationDate = daysFromToday(90);
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
            credentials: [
              { expirationDate: toDDMMYYYY(expirationDate) },
            ],
        }),
      });
    });

    it('should warn if certification-modal metadata is missing', async () => {
      getMetadataContent.mockReturnValue(null);

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
      await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

      expect(warnSpy).toHaveBeenCalledWith('certification-modal should be displayed but popup fragment path is not found');
      expect(mockGetModal).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should warn if popup fragment is not found', async () => {
      getMetadataContent.mockReturnValue('/digitalexperience/fragments/modals/certification-modal');
      loadPopupFragment.mockResolvedValue(null);

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
      await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

      expect(warnSpy).toHaveBeenCalledWith('Popup fragment for /digitalexperience/fragments/modals/certification-modal not found');
      expect(mockGetModal).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should create modal with correct options', async () => {
      const popupContent = document.createElement('div');
      popupContent.textContent = 'Certification Modal Content';

      getMetadataContent.mockReturnValue('/digitalexperience/fragments/modals/certification-modal');
      loadPopupFragment.mockResolvedValue(popupContent);

      const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
      await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

      expect(mockGetModal).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          id: 'certification-popup-modal',
          class: 's-size',
          content: popupContent,
          closeCallback: expect.any(Function),
        }),
      );
    });

    it('should call personalization and rewrite functions', async () => {
      const popupContent = document.createElement('div');
      getMetadataContent.mockReturnValue('/digitalexperience/fragments/modals/certification-modal');
      loadPopupFragment.mockResolvedValue(popupContent);

      const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
      await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

      const modal = document.querySelector('#certification-popup-modal');
      expect(mockLoadArea).toHaveBeenCalledWith(modal);
      expect(personalizePlaceholders).toHaveBeenCalled();
      expect(personalizePage).toHaveBeenCalledWith(modal);
      expect(rewriteLinks).toHaveBeenCalledWith(modal);
    });

    it('should set session storage on modal close', async () => {
      const popupContent = document.createElement('div');
      getMetadataContent.mockReturnValue('/digitalexperience/fragments/modals/certification-modal');
      loadPopupFragment.mockResolvedValue(popupContent);

      const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
      await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

      // Get the closeCallback that was passed to getModal
      const { closeCallback } = mockGetModal.mock.calls[0][1];
      closeCallback();

      expect(mockSetItem).toHaveBeenCalledWith(
        'last-certification-popup-shown',
        expect.any(String),
      );
    });

    it('should not create modal if getModal returns null', async () => {
      getMetadataContent.mockReturnValue('/digitalexperience/fragments/modals/certification-modal');
      loadPopupFragment.mockResolvedValue(document.createElement('div'));
      mockGetModal.mockResolvedValue(null);

      const { certificationExpiresPopup } = require('../../eds/scripts/certificationExpiresPopup.js');
      await certificationExpiresPopup('https://test-milo-libs.com', false, false, 'test-client-id');

      expect(mockLoadArea).not.toHaveBeenCalled();
      expect(personalizePage).not.toHaveBeenCalled();
    });
  });
});
