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
  let AGREEMENT_POPUP_DONE;
  let PORTAL_MESSAGING_DONE;

  beforeEach(() => {
    // Clear all mock call history
    jest.clearAllMocks();
    
    // Reset mock implementations to default
    mockPortalMessaging.mockResolvedValue(undefined);
    mockCertificationExpiresPopup.mockResolvedValue(undefined);
    
    // Import mocked modules
    const utilsModule = require('../../eds/scripts/utils.js');
    const partnerAgreementModule = require('../../eds/scripts/partnerAgreement.js');
    const portalMessagingModule = require('../../eds/scripts/portalMessaging.js');
    const setPopupsModule = require('../../eds/scripts/setPopups.js');
    
    isMember = utilsModule.isMember;
    partnerAgreement = partnerAgreementModule.partnerAgreement;
    setPopups = setPopupsModule.setPopups;
    AGREEMENT_POPUP_DONE = partnerAgreementModule.PARTNER_AGREEMENT_POPUP;
    PORTAL_MESSAGING_DONE = portalMessagingModule.PORTAL_MESSAGING_DONE;
  });

  afterEach(() => {
    // Clear module cache to prevent mock interference with other test files
    jest.resetModules();
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

    it('should not register event listeners', async () => {
      // Setup: User is NOT a member
      isMember.mockReturnValue(false);
      
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      // Call setPopups
      await setPopups('https://test-milo-libs.com', 'test-client-id');
      
      // Verify NO event listeners were registered
      expect(addEventListenerSpy).not.toHaveBeenCalled();
      
      addEventListenerSpy.mockRestore();
    });

    it('should not respond to events even if dispatched', async () => {
      // Setup: User is NOT a member
      isMember.mockReturnValue(false);
      
      // Call setPopups
      await setPopups('https://test-milo-libs.com', 'test-client-id');
      
      // Dispatch events - nothing should happen
      window.dispatchEvent(new Event(AGREEMENT_POPUP_DONE));
      window.dispatchEvent(new Event(PORTAL_MESSAGING_DONE));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockPortalMessaging).not.toHaveBeenCalled();
      expect(mockCertificationExpiresPopup).not.toHaveBeenCalled();
    });
  });

  describe('when user is a member', () => {
    beforeEach(() => {
      isMember.mockReturnValue(true);
      partnerAgreement.mockResolvedValue();
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

    it('should register both event listeners', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      // Call setPopups
      await setPopups('https://test-milo-libs.com', 'test-client-id');
      
      // Verify both event listeners were registered
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        AGREEMENT_POPUP_DONE,
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        PORTAL_MESSAGING_DONE,
        expect.any(Function)
      );
      
      // Should be called exactly 2 times (one for each event)
      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
      
      addEventListenerSpy.mockRestore();
    });

    it('should pass correct parameters to all functions', async () => {
      const customMiloLibs = 'https://custom-milo.com';
      const customClientId = 'custom-client-id-123';
      
      // Setup with custom values
      await setPopups(customMiloLibs, customClientId);
      
      // Verify partnerAgreement got customMiloLibs
      expect(partnerAgreement).toHaveBeenCalledWith(customMiloLibs);
      
      // Clear previous calls to track new ones
      jest.clearAllMocks();
      mockPortalMessaging.mockResolvedValue();
      mockCertificationExpiresPopup.mockResolvedValue();
      
      // Trigger portal messaging
      window.dispatchEvent(new Event(AGREEMENT_POPUP_DONE));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify portalMessaging got customMiloLibs
      expect(mockPortalMessaging).toHaveBeenCalledWith(customMiloLibs, false);
      
      // Clear again
      jest.clearAllMocks();
      mockCertificationExpiresPopup.mockResolvedValue();
      
      // Trigger certification popup
      window.dispatchEvent(new Event(PORTAL_MESSAGING_DONE));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify certificationExpiresPopup got both custom values
      expect(mockCertificationExpiresPopup).toHaveBeenCalledWith(
        customMiloLibs,
        customClientId
      );
    });
  });

  describe('AGREEMENT_POPUP_DONE event handling', () => {
    beforeEach(() => {
      isMember.mockReturnValue(true);
      partnerAgreement.mockResolvedValue();
    });

    it('should verify the actual event listener function is registered and works', async () => {
      mockPortalMessaging.mockResolvedValue();
      
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      // Clear previous mocks
      jest.clearAllMocks();
      mockPortalMessaging.mockResolvedValue();
      partnerAgreement.mockResolvedValue();
      
      // Setup event listeners
      await setPopups('https://test-milo-libs.com', 'test-client-id');
      
      // Get the actual event listener function
      const eventListenerCalls = addEventListenerSpy.mock.calls;
      const agreementDoneListener = eventListenerCalls.find(
        call => call[0] === AGREEMENT_POPUP_DONE
      );
      expect(agreementDoneListener).toBeDefined();
      
      // portalMessaging should NOT be called before invoking listener
      expect(mockPortalMessaging).not.toHaveBeenCalled();
      
      // Directly call the registered event listener
      const listenerFunction = agreementDoneListener[1];
      await listenerFunction();
      
      // Now portalMessaging SHOULD be called
      expect(mockPortalMessaging).toHaveBeenCalledTimes(1);
      expect(mockPortalMessaging).toHaveBeenCalledWith('https://test-milo-libs.com', false);
      
      addEventListenerSpy.mockRestore();
    });

    it('should call portalMessaging with correct arguments when event fires', async () => {
      // Clear and setup fresh mocks
      jest.clearAllMocks();
      mockPortalMessaging.mockResolvedValue();
      partnerAgreement.mockResolvedValue();
      
      await setPopups('https://test-milo-libs.com', 'test-client-id');
      
      // Dispatch event
      window.dispatchEvent(new Event(AGREEMENT_POPUP_DONE));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify it was called with correct arguments (just check last call)
      expect(mockPortalMessaging).toHaveBeenLastCalledWith('https://test-milo-libs.com', false);
    });
  });

  describe('PORTAL_MESSAGING_DONE event handling', () => {
    beforeEach(() => {
      isMember.mockReturnValue(true);
      partnerAgreement.mockResolvedValue();
    });

    it('should call certificationExpiresPopup with correct arguments when event fires', async () => {
      // Clear and setup fresh mocks
      jest.clearAllMocks();
      mockCertificationExpiresPopup.mockResolvedValue();
      partnerAgreement.mockResolvedValue();
      
      await setPopups('https://test-milo-libs.com', 'test-client-id');
      
      // Dispatch PORTAL_MESSAGING_DONE event
      window.dispatchEvent(new Event(PORTAL_MESSAGING_DONE));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify it was called with correct arguments (just check last call)
      expect(mockCertificationExpiresPopup).toHaveBeenLastCalledWith(
        'https://test-milo-libs.com',
        'test-client-id'
      );
    });
  });

  describe('full popup chain', () => {
    it('should handle the complete sequence: agreement → portal messaging → certification', async () => {
      // Clear and setup fresh mocks
      jest.clearAllMocks();
      isMember.mockReturnValue(true);
      partnerAgreement.mockResolvedValue();
      mockPortalMessaging.mockResolvedValue();
      mockCertificationExpiresPopup.mockResolvedValue();
      
      // Setup event listeners
      await setPopups('https://test-milo-libs.com', 'test-client-id');
      
      // Verify partnerAgreement was called
      expect(partnerAgreement).toHaveBeenCalledTimes(1);
      
      // Step 1: User closes agreement popup
      window.dispatchEvent(new Event(AGREEMENT_POPUP_DONE));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify portalMessaging was called
      expect(mockPortalMessaging).toHaveBeenLastCalledWith('https://test-milo-libs.com', false);
      
      // Step 2: Portal messaging done
      window.dispatchEvent(new Event(PORTAL_MESSAGING_DONE));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify certificationExpiresPopup was called
      expect(mockCertificationExpiresPopup).toHaveBeenLastCalledWith(
        'https://test-milo-libs.com',
        'test-client-id'
      );
    });
  });

});
