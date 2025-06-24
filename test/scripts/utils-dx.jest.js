/* eslint-disable */

/**
 * @jest-environment jsdom
 */
import {
  formatDate,
  getProgramType,
  updateFooter,
  updateNavigation,
  getProgramHomePage,
  getCurrentProgramType,
  getCookieValue,
  getPartnerDataCookieObject,
  isMember,
  getPartnerDataCookieValue,
  partnerIsSignedIn,
  signedInNonMember,
  getMetadata,
  getMetadataContent,
  hasSalesCenterAccess,
  isAdminUser,
  isPartnerNewlyRegistered,
} from '../../eds/scripts/utils.js';

describe('Test DX utils.js', () => {
  beforeEach(() => {
    window = Object.create(window);
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/digitalexperience/',
        assign: (pathname) => window.location.pathname = pathname,
        origin: 'https://partners.stage.adobe.com',
        href: 'https://partners.stage.adobe.com/digitalexperience',
      },
      writable: true,
    });
  });
  
  afterEach(() => {
    document.getElementsByTagName('html')[0].innerHTML = '';
    document.cookie = '';
  });

  describe('getProgramType', () => {
    test('returns dx for digitalexperience path', () => {
      expect(getProgramType('/digitalexperience/')).toBe('dx');
      expect(getProgramType('/en/digitalexperience/test')).toBe('dx');
    });

    test('returns empty string for unknown paths', () => {
      expect(getProgramType('/unknown/')).toBe('');
    });
  });

  describe('getCurrentProgramType', () => {
    test('returns dx for current DX path', () => {
      window.location.pathname = '/digitalexperience/';
      expect(getCurrentProgramType()).toBe('dx');
    });
  });

  describe('getProgramHomePage', () => {
    test('returns dx home page', () => {
      expect(getProgramHomePage('/digitalexperience/')).toBe('/digitalexperience/');
    });
  });

  describe('Cookie functions', () => {
    beforeEach(() => {
      document.cookie = 'partner_data={"DX":{"status":"MEMBER","level":"platinum","salesCenterAccess":true,"isAdmin":false,"primaryContact":true,"createddate":"2024-01-01"}}';
    });

    test('getCookieValue returns partner data', () => {
      const partnerData = getCookieValue('partner_data');
      expect(partnerData).toContain('DX');
    });

    test('getPartnerDataCookieObject returns DX data', () => {
      const dxData = getPartnerDataCookieObject('dx');
      expect(dxData.status).toBe('MEMBER');
      expect(dxData.level).toBe('platinum');
    });

    test('getPartnerDataCookieValue returns specific DX values', () => {
      expect(getPartnerDataCookieValue('dx', 'level')).toBe('platinum');
      expect(getPartnerDataCookieValue('dx', 'status')).toBe('MEMBER');
    });

    test('isMember returns true for DX member', () => {
      window.location.pathname = '/digitalexperience/';
      expect(isMember()).toBe(true);
    });

    test('partnerIsSignedIn returns true when partner_data cookie exists', () => {
      expect(partnerIsSignedIn()).toBeTruthy();
    });

    test('hasSalesCenterAccess returns correct value', () => {
      window.location.pathname = '/digitalexperience/';
      expect(hasSalesCenterAccess()).toBe(true);
    });

    test('isAdminUser returns correct value', () => {
      window.location.pathname = '/digitalexperience/';
      expect(isAdminUser()).toBe(false);
    });

    test('isPartnerNewlyRegistered returns false for old registration', () => {
      window.location.pathname = '/digitalexperience/';
      expect(isPartnerNewlyRegistered()).toBe(false);
    });
  });

  describe('Navigation and Footer updates', () => {
    beforeEach(() => {
      document.cookie = 'partner_data={"DX":{"status":"MEMBER"}}';
      window.location.pathname = '/digitalexperience/';
      
      // Mock meta tags
      const gnavMeta = document.createElement('meta');
      gnavMeta.name = 'gnav-source';
      gnavMeta.content = '/default-gnav';
      document.head.appendChild(gnavMeta);

      const footerMeta = document.createElement('meta');
      footerMeta.name = 'footer-source';
      footerMeta.content = '/default-footer';
      document.head.appendChild(footerMeta);
    });

    test('updateNavigation updates gnav for DX members', () => {
      updateNavigation();
      const gnavMeta = getMetadata('gnav-source');
      expect(gnavMeta.content).toBe('/eds/partners-shared/dx-loggedin-gnav');
    });

    test('updateFooter updates footer for DX members', () => {
      updateFooter();
      const footerMeta = getMetadata('footer-source');
      expect(footerMeta.content).toBe('/eds/partners-shared/dx-loggedin-footer');
    });
  });
});
