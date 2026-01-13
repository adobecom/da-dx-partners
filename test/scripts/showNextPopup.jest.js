/**
 * @jest-environment jsdom
 */

// Mock portalMessaging module
const mockPortalMessaging = jest.fn();
const mockBctqBanner = jest.fn();
const mockLoadPopupFragment = jest.fn();

jest.mock('../../eds/scripts/portalMessaging.js', () => ({
  portalMessaging: mockPortalMessaging,
  bctqBanner: mockBctqBanner,
  loadPopupFragment: mockLoadPopupFragment,
  PORTAL_MESSAGING_DONE: 'dxp:portalMessagingDone',
}));

// Mock utils.js
jest.mock('../../eds/scripts/utils.js', () => ({
  isMember: jest.fn(),
  PARTNER_AGREEMENT_POPUP: 'dxp:partnerAgreement',
  PORTAL_MESSAGING_POPUP: 'dxp:portalMessaging',
  CERTIFICATION_POPUP: 'dxp:certificationExpires',
}));

// Mock partnerAgreement.js
jest.mock('../../eds/scripts/partnerAgreement.js', () => ({
  partnerAgreement: jest.fn(),
  AGREEMENT_POPUP_DONE: 'dxp:agreementPopupDone',
}));

// Mock certificationExpiresPopup.js
const mockCertificationExpiresPopup = jest.fn();
jest.mock('../../eds/scripts/certificationExpiresPopup.js', () => ({
  certificationExpiresPopup: mockCertificationExpiresPopup,
}));

describe('setPopups', () => {
  let isMember;
  let partnerAgreement;
  let setPopups;
  let PARTNER_AGREEMENT_POPUP;
  let PORTAL_MESSAGING_POPUP;
  let CERTIFICATION_POPUP;

  beforeEach(() => {
    // Reset modules FIRST to ensure fresh imports
    jest.resetModules();
    
    // Clear all mock call history
    jest.clearAllMocks();
    
    // Reset mock implementations to default
    mockPortalMessaging.mockResolvedValue(undefined);
    mockCertificationExpiresPopup.mockResolvedValue(undefined);
    
    // Import mocked modules (fresh after resetModules)
    const utilsModule = require('../../eds/scripts/utils.js');
    const partnerAgreementModule = require('../../eds/scripts/partnerAgreement.js');
    const setPopupsModule = require('../../eds/scripts/showNextPopup.js');
    
    isMember = utilsModule.isMember;
    partnerAgreement = partnerAgreementModule.partnerAgreement;
    setPopups = setPopupsModule.showNextPopup;
    PARTNER_AGREEMENT_POPUP = utilsModule.PARTNER_AGREEMENT_POPUP;
    PORTAL_MESSAGING_POPUP = utilsModule.PORTAL_MESSAGING_POPUP;
    CERTIFICATION_POPUP = utilsModule.CERTIFICATION_POPUP;
  });

  describe('when user is not a member', () => {
    it('should not call any functions', async () => {
      // Setup: User is NOT a member
      isMember.mockReturnValue(false);
      
      // Call setPopups
      await setPopups('https://test-milo-libs.com', 'test-client-id');
      
      // Verify partnerAgreement was NOT called
      expect(partnerAgreement).not.toHaveBeenCalled();
      expect(mockPortalMessaging).not.toHaveBeenCalled();
    });


  });

  describe('when user is a member', () => {
    beforeEach(() => {
      isMember.mockReturnValue(true);
      partnerAgreement.mockResolvedValue(false);
      mockPortalMessaging.mockResolvedValue(false);
      mockCertificationExpiresPopup.mockResolvedValue(false);
    });

    it('should call partnerAgreement immediately', async () => {
      // partnerAgreement should NOT be called yet
      expect(partnerAgreement).not.toHaveBeenCalled();
      
      // Call setPopups
      await setPopups('https://test-milo-libs.com', 'test-client-id');
      
      // Verify partnerAgreement was called immediately
      expect(partnerAgreement).toHaveBeenCalledTimes(1);
      expect(partnerAgreement).toHaveBeenCalledWith('https://test-milo-libs.com');
    });

    it('should call all popups in sequence', async () => {
      // Call setPopups
      await setPopups('https://test-milo-libs.com', 'test-client-id');
      
      // Verify all three functions were called in sequence
      expect(partnerAgreement).toHaveBeenCalledTimes(1);
      expect(mockPortalMessaging).toHaveBeenCalledTimes(1);
      expect(mockCertificationExpiresPopup).toHaveBeenCalledTimes(1);
    });

    it('should pass correct parameters to all functions', async () => {
      const customMiloLibs = 'https://custom-milo.com';
      const customClientId = 'custom-client-id-123';
      
      // Setup with custom values
      await setPopups(customMiloLibs, customClientId);
      
      // Verify partnerAgreement got customMiloLibs
      expect(partnerAgreement).toHaveBeenCalledWith(customMiloLibs);
      
      // Verify portalMessaging got customMiloLibs and partnerAgreementDisplayed (false)
      expect(mockPortalMessaging).toHaveBeenCalledWith(customMiloLibs, false);
      
      // Verify certificationExpiresPopup got all required parameters
      expect(mockCertificationExpiresPopup).toHaveBeenCalledWith(
        customMiloLibs,
        false, // portalMessagingOpen
        false, // partnerAgreementDisplayed
        customClientId
      );
    });

    it('should pass partnerAgreementDisplayed status to portalMessaging', async () => {
      // Mock partnerAgreement to return true (displayed)
      partnerAgreement.mockResolvedValue(true);
      
      await setPopups('https://test-milo-libs.com', 'test-client-id');
      
      // Verify portalMessaging received true for partnerAgreementDisplayed
      expect(mockPortalMessaging).toHaveBeenCalledWith('https://test-milo-libs.com', true);
    });

    it('should pass portalMessagingOpen status to certificationExpiresPopup', async () => {
      // Mock portalMessaging to return true (open)
      mockPortalMessaging.mockResolvedValue(true);
      
      await setPopups('https://test-milo-libs.com', 'test-client-id');
      
      // Verify certificationExpiresPopup received true for portalMessagingOpen
      expect(mockCertificationExpiresPopup).toHaveBeenCalledWith(
        'https://test-milo-libs.com',
        true, // portalMessagingOpen
        false, // partnerAgreementDisplayed
        'test-client-id'
      );
    });
  });

  describe('nextPopup parameter handling', () => {
    beforeEach(() => {
      isMember.mockReturnValue(true);
      partnerAgreement.mockResolvedValue(false);
      mockPortalMessaging.mockResolvedValue(false);
      mockCertificationExpiresPopup.mockResolvedValue(false);
    });

    it('should only call partner agreement when nextPopup is PARTNER_AGREEMENT_POPUP', async () => {
      await setPopups('https://test-milo-libs.com', 'test-client-id', PARTNER_AGREEMENT_POPUP);
      
      // Should call partnerAgreement
      expect(partnerAgreement).toHaveBeenCalledTimes(1);
      
      // Should NOT call other popups
      expect(mockPortalMessaging).not.toHaveBeenCalled();
      expect(mockCertificationExpiresPopup).not.toHaveBeenCalled();
    });

    it('should only call portal messaging when nextPopup is PORTAL_MESSAGING_POPUP', async () => {
      await setPopups('https://test-milo-libs.com', 'test-client-id', PORTAL_MESSAGING_POPUP);
      
      // Should call portalMessaging
      expect(mockPortalMessaging).toHaveBeenCalledTimes(1);
      
      // Should NOT call other popups
      expect(partnerAgreement).not.toHaveBeenCalled();
      expect(mockCertificationExpiresPopup).not.toHaveBeenCalled();
    });

    it('should  call certification popup when nextPopup is CERTIFICATION_POPUP', async () => {
      await setPopups('https://test-milo-libs.com', 'test-client-id', CERTIFICATION_POPUP);
      
      // Should  call  certification  when nextPopup equals CERTIFICATION_POPUP)
      expect(partnerAgreement).not.toHaveBeenCalled();
      expect(mockPortalMessaging).not.toHaveBeenCalled();
      expect(mockCertificationExpiresPopup).toHaveBeenCalled();
    });
  });

  describe('full popup chain', () => {
    beforeEach(() => {
      isMember.mockReturnValue(true);
    });

    it('should handle the complete sequence: agreement → portal messaging → certification', async () => {
      // Clear and setup fresh mocks
      jest.clearAllMocks();
      partnerAgreement.mockResolvedValue(false);
      mockPortalMessaging.mockResolvedValue(false);
      mockCertificationExpiresPopup.mockResolvedValue(false);
      
      // Call setPopups - all popups should be called in sequence
      await setPopups('https://test-milo-libs.com', 'test-client-id');
      
      // Verify all three were called
      expect(partnerAgreement).toHaveBeenCalledTimes(1);
      expect(mockPortalMessaging).toHaveBeenCalledTimes(1);
      expect(mockCertificationExpiresPopup).toHaveBeenCalledTimes(1);
      
      // Verify they were called with correct parameters
      expect(partnerAgreement).toHaveBeenCalledWith('https://test-milo-libs.com');
      expect(mockPortalMessaging).toHaveBeenCalledWith('https://test-milo-libs.com', false);
      expect(mockCertificationExpiresPopup).toHaveBeenCalledWith(
        'https://test-milo-libs.com',
        false,
        false,
        'test-client-id'
      );
    });

    it('should propagate return values through the chain', async () => {
      // Setup: partnerAgreement returns true, portalMessaging returns true
      partnerAgreement.mockResolvedValue(true);
      mockPortalMessaging.mockResolvedValue(true);
      mockCertificationExpiresPopup.mockResolvedValue(false);
      
      await setPopups('https://test-milo-libs.com', 'test-client-id');
      
      // Verify portalMessaging received true from partnerAgreement
      expect(mockPortalMessaging).toHaveBeenCalledWith('https://test-milo-libs.com', true);
      
      // Verify certificationExpiresPopup received true from both
      expect(mockCertificationExpiresPopup).toHaveBeenCalledWith(
        'https://test-milo-libs.com',
        true, // portalMessagingOpen
        true, // partnerAgreementDisplayed
        'test-client-id'
      );
    });
  });

});
