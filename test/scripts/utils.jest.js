/* eslint-disable */

/**
 * @jest-environment jsdom
 */
import path from 'path';
import fs from 'fs';
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
  redirectLoggedinPartner,
  hasSalesCenterAccess,
  updateIMSConfig,
  getLocale,
  preloadResources,
  getCaasUrl,
  getNodesByXPath,
  isRenew,
  getRenewBanner,
  setLibs,
} from '../../eds/scripts/utils.js';

describe('Test utils.js', () => {
  beforeEach(() => {
    window = Object.create(window);
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/solutionpartners/',
        // eslint-disable-next-line no-return-assign
        assign: (pathname) => window.location.pathname = pathname,
        origin: 'https://partners.stage.adobe.com',
        href: 'https://partners.stage.adobe.com/solutionpartners',
      },
      writable: true,
    });
  });
  afterEach(() => {
    document.getElementsByTagName('html')[0].innerHTML = '';
  });
  it('Milo libs', () => {
    window.location.hostname = 'partners.stage.adobe.com';
    const libs = setLibs('/libs');
    expect(libs).toEqual('https://partners.stage.adobe.com/libs');
  });
  describe('Test update footer and gnav', () => {
    beforeEach(() => {
      document.head.innerHTML = fs.readFileSync(
        path.resolve(__dirname, './mocks/head.html'),
        'utf8',
      );
    });
    it('Public footer is shown for non member', async () => {
      const cookieObject = { CPP: { status: 'MEMBER' } };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const footerPath = document.querySelector('meta[name="footer-source"]')?.content;
      updateFooter();
      const footerPathModified = document.querySelector('meta[name="footer-source"]')?.content;
      expect(footerPath).toEqual(footerPathModified);
    });
    it('Protected footer is shown for members', async () => {
      const cookieObject = { SPP: { status: 'MEMBER' } };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const locales = {
        '': { ietf: 'en-US', tk: 'hah7vzn.css' },
        de: { ietf: 'de-DE', tk: 'hah7vzn.css' },
      };
      const footerPath = document.querySelector('meta[name="footer-source"]')?.content;
      updateFooter(locales);
      const footerPathModified = document.querySelector('meta[name="footer-source"]')?.content;
      expect(footerPath).not.toEqual(footerPathModified);
      const protectedFooterPath = document.querySelector('meta[name="footer-loggedin-source"]')?.content;
      expect(footerPathModified).toEqual(protectedFooterPath);
    });
    it('Public navigation is shown for non member', async () => {
      const cookieObject = { CPP: { status: 'MEMBER' } };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const locales = {
        '': { ietf: 'en-US', tk: 'hah7vzn.css' },
        de: { ietf: 'de-DE', tk: 'hah7vzn.css' },
      };
      const gnavPath = document.querySelector('meta[name="gnav-source"]')?.content;
      updateNavigation(locales);
      const gnavPathModified = document.querySelector('meta[name="gnav-source"]')?.content;
      expect(gnavPath).toEqual(gnavPathModified);
    });
    it('Protected navigation is shown for members', async () => {
      const cookieObject = { SPP: { status: 'MEMBER' } };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const locales = {
        '': { ietf: 'en-US', tk: 'hah7vzn.css' },
        de: { ietf: 'de-DE', tk: 'hah7vzn.css' },
      };
      const gnavPath = document.querySelector('meta[name="gnav-source"]')?.content;
      updateNavigation(locales);
      const gnavPathModified = document.querySelector('meta[name="gnav-source"]')?.content;
      expect(gnavPath).not.toEqual(gnavPathModified);
      const protectedGnavPath = document.querySelector('meta[name="gnav-loggedin-source"]')?.content;
      expect(gnavPathModified).toEqual(protectedGnavPath);
    });
  });
  it('formatDate should return correct locale date string', () => {
    const cardDate = '2024-07-09T12:35:03.000Z';
    expect(formatDate(cardDate)).toEqual('Jul 9, 2024');
  });
  it('Should get correct program based on url path', () => {
    const pathSpp = '/solutionpartners/test';
    expect(getProgramType(pathSpp)).toEqual('spp');
    const pathTpp = '/technologypartners/test';
    expect(getProgramType(pathTpp)).toEqual('tpp');
    const pathCpp = '/solutionpartners/test';
    expect(getProgramType(pathCpp)).toEqual('spp');
    const invalidPath = '/invalidpartners/test';
    expect(getProgramType(invalidPath)).toEqual('');
  });
  it('Should get correct program home page based on url path', () => {
    const pathSpp = '/solutionpartners/test';
    expect(getProgramHomePage(pathSpp)).toEqual('/solutionpartners/');
    const pathTpp = '/technologypartners/test';
    expect(getProgramHomePage(pathTpp)).toEqual('/technologypartners/');
    const pathCpp = '/solutionpartners/test';
    expect(getProgramHomePage(pathCpp)).toEqual('/solutionpartners/');
    const invalidPath = '/invalidpartners/test';
    expect(getProgramHomePage(invalidPath)).toEqual('');
  });
  it('Should get current program based on url path', () => {
    window.location.pathname = '/solutionpartners/';
    expect(getCurrentProgramType()).toEqual('spp');
  });
  it('Should get correct cookie value for given cookie name', () => {
    document.cookie = 'test_cookie=test_value';
    expect(getCookieValue('test_cookie')).toEqual('test_value');
  });
  it('Should get empty string if cookie JSON is not valid', () => {
    document.cookie = 'partner_data={spp: {test1:test, test2:test}}';
    expect(getPartnerDataCookieValue('spp', 'test_cookie')).toEqual('');
  });
  it('Should return partner data cookie object', () => {
    const cookieObject = { SPP: { status: 'MEMBER' } };
    document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
    expect(getPartnerDataCookieObject('spp')).toStrictEqual(cookieObject.SPP);
  });
  it('Check if user is a member', () => {
    const cookieObjectMember = { SPP: { status: 'MEMBER' } };
    document.cookie = `partner_data=${JSON.stringify(cookieObjectMember)}`;
    expect(isMember()).toEqual(true);
    const cookieObjectNotMember = { SPP: { status: 'NOT_PARTNER' } };
    document.cookie = `partner_data=${JSON.stringify(cookieObjectNotMember)}`;
    expect(isMember()).toEqual(false);
  });
  it('Check if partner is signed id', () => {
    document.cookie = 'partner_data=test';
    expect(partnerIsSignedIn()).toBeTruthy();
  });
  it('Check if signed in partner is non member', () => {
    const cookieObjectNotMember = { SPP: { status: 'NOT_PARTNER' } };
    document.cookie = `partner_data=${JSON.stringify(cookieObjectNotMember)}`;
    expect(signedInNonMember()).toBeTruthy();
  });
  it('Get meta tag content value', () => {
    const metaTag = document.createElement('meta');
    metaTag.name = 'test';
    metaTag.content = 'test-content';
    document.head.appendChild(metaTag);
    expect(getMetadataContent('test')).toEqual('test-content');
  });
  it('Get meta tag node', () => {
    const metaTag = document.createElement('meta');
    metaTag.name = 'test';
    metaTag.content = 'test-content';
    document.head.appendChild(metaTag);
    expect(getMetadata('test')).toStrictEqual(metaTag);
  });
  it('Don\'t redirect logged in partner to protected home if he is not a member', () => {
    const cookieObjectNotMember = { SPP: { status: 'NOT_MEMBER' } };
    document.cookie = `partner_data=${JSON.stringify(cookieObjectNotMember)}`;
    expect(redirectLoggedinPartner()).toBeFalsy();
  });
  it('Don\'t redirect logged in partner to protected home if metadata is not set', () => {
    const cookieObjectMember = { SPP: { status: 'MEMBER' } };
    document.cookie = `partner_data=${JSON.stringify(cookieObjectMember)}`;
    expect(redirectLoggedinPartner()).toBeFalsy();
  });
  it('Redirect logged in partner to protected home', () => {
    window.location.pathname = '/solutionpartners/';
    const cookieObjectMember = { SPP: { status: 'MEMBER' } };
    document.cookie = `partner_data=${JSON.stringify(cookieObjectMember)}`;
    const metaTag = document.createElement('meta');
    metaTag.name = 'adobe-target-after-login';
    metaTag.content = '/solutionpartners/home';
    document.head.appendChild(metaTag);
    redirectLoggedinPartner();
    expect(window.location.pathname).toEqual(metaTag.content);
  });
  it('Check if partners account is expired', () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() + 30);
    const cookieObject = {
      SPP: {
        primaryContact: true,
        status: 'MEMBER',
        level: 'gold',
        accountAnniversary: expiredDate,
      },
    };
    document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
    const { accountStatus, daysNum } = isRenew();
    expect(accountStatus).toEqual('expired');
    expect(daysNum).toBeLessThanOrEqual(30);
  });
  it('Check if partners account is suspended', () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 30);
    const cookieObject = {
      SPP: {
        primaryContact: true,
        status: 'MEMBER',
        level: 'gold',
        accountAnniversary: expiredDate,
      },
    };
    document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
    const { accountStatus, daysNum } = isRenew();
    expect(accountStatus).toEqual('suspended');
    expect(daysNum).toBeLessThanOrEqual(60);
  });
  it('Don\'t show renew banner if partner has valid account', async () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() + 40);
    const cookieObject = {
      SPP: {
        primaryContact: true,
        status: 'MEMBER',
        level: 'gold',
        accountAnniversary: expiredDate,
      },
    };
    document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
    expect(await getRenewBanner()).toBeFalsy();
  });
  it('Show renew banner', async () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() + 30);
    const cookieObject = {
      SPP: {
        primaryContact: true,
        status: 'MEMBER',
        level: 'gold',
        accountAnniversary: expiredDate,
      },
    };
    document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
    const getConfig = () => ({ locale: '' });
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      text: () => Promise.resolve('<div class="notification">Test</div>'),
    }));
    const main = document.createElement('main');
    document.body.appendChild(main);
    await getRenewBanner(getConfig);
    const banner = document.querySelector('.notification');
    expect(banner).toBeTruthy();
  });
  it('Don\'t show renew banner', async () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() + 80);
    const cookieObject = {
      SPP: {
        primaryContact: true,
        status: 'MEMBER',
        level: 'gold',
        accountAnniversary: expiredDate,
      },
    };
    document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
    const getConfig = () => ({ locale: '' });
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      text: () => Promise.resolve('<div class="notification">Test</div>'),
    }));

    const main = document.createElement('main');
    document.body.appendChild(main);
    await getRenewBanner(getConfig);
    const banner = document.querySelector('.notification');
    expect(banner).toBeFalsy();
  });
  it('Renew banner fetch error', async () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() + 30);
    const cookieObject = {
      SPP: {
        primaryContact: true,
        status: 'MEMBER',
        level: 'gold',
        accountAnniversary: expiredDate,
      },
    };
    document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
    const getConfig = () => ({ locale: '' });
    global.fetch = jest.fn(() => Promise.resolve({ ok: false }));
    const main = document.createElement('main');
    document.body.appendChild(main);
    expect(await getRenewBanner(getConfig)).toEqual(null);
  });
  it('Update ims config if user is signed in', () => {
    jest.useFakeTimers();
    window.adobeIMS = {
      isSignedInUser: () => true,
      adobeIdData: {},
    };
    // document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
    const metaTag = document.createElement('meta');
    metaTag.name = 'adobe-target-after-logout';
    metaTag.content = '/solutionpartners/home';
    document.head.appendChild(metaTag);
    updateIMSConfig();
    jest.advanceTimersByTime(1000);
    const redirectUrl = new URL(window.adobeIMS.adobeIdData.redirect_uri);
    expect(redirectUrl.pathname).toEqual(metaTag.content);
  });
  it('Update ims config if user is not signed in', () => {
    jest.useFakeTimers();
    window.adobeIMS = {
      isSignedInUser: () => false,
      adobeIdData: {},
    };
    document.cookie = 'partner_data=';
    const metaTag = document.createElement('meta');
    metaTag.name = 'adobe-target-after-login';
    metaTag.content = '/solutionpartners/home';
    document.head.appendChild(metaTag);
    updateIMSConfig();
    jest.advanceTimersByTime(1000);
    const redirectUrl = new URL(window.adobeIMS.adobeIdData.redirect_uri);
    expect(redirectUrl.pathname).toEqual(metaTag.content);
    expect(redirectUrl.searchParams.has('partnerLogin')).toEqual(true);
  });
  it('Get locale', () => {
    const locales = {
      '': { ietf: 'en-US', tk: 'hah7vzn.css' },
      de: { ietf: 'de-DE', tk: 'hah7vzn.css' },
    };
    window.location.pathname = '/de/solutionpartners';
    const locale = getLocale(locales);
    expect(locale).toStrictEqual({ ietf: 'de-DE', tk: 'hah7vzn.css', prefix: '/de', region: 'de' });
  });
  it('Return default locale', () => {
    const locale = getLocale();
    expect(locale).toStrictEqual({ ietf: 'en-US', tk: 'hah7vzn.css', prefix: '' });
  });
  it('Get caas url', () => {
    document.cookie = 'partner_data={"SPP":{"accountAnniversary":1890777600000%2C"company":"Yugo SPP Stage Platinum Spain"%2C"firstName":"SPP Stage"%2C"lastName":"Spain Platinum"%2C"level":"Platinum"%2C"permissionRegion":"Europe West"%2C"primaryContact":true%2C"salesCenterAccess":true%2C"status":"MEMBER"}}';
    const locales = {
      '': { ietf: 'en-US', tk: 'hah7vzn.css' },
      de: { ietf: 'de-DE', tk: 'hah7vzn.css' },
    };
    const locale = getLocale(locales);
    document.body.innerHTML = fs.readFileSync(
      path.resolve(__dirname, './mocks/dx-card-collection.html'),
      'utf8',
    );
    const el = document.querySelector('.dx-card-collection');

    const block = {
      el,
      name: 'dx-card-collection',
      // collectionTag: '"caas:adobe-partners/collections/news"',
      ietf: locale.ietf,
    };
    const caasUrl = getCaasUrl(block);
    expect(caasUrl).toEqual('https://www.adobe.com/chimera-api/collection?originSelection=dx-partners&draft=false&flatFile=false&expanded=true&complexQuery=%28%28%22caas%3Aadobe-partners%2Fqa-content%22%29%29%2BNOT%2B%22caas%3Aadobe-partners%2Fqa-content%22%2BAND%2B%28%22caas%3Aadobe-partners%2Fspp%2Fpartner-level%2Fplatinum%22%2BOR%2B%22caas%3Aadobe-partners%2Fspp%2Fpartner-level%2Fpublic%22%29&language=en&country=US');
  });
  it('Preload resources', async () => {
    const locales = {
      '': { ietf: 'en-US', tk: 'hah7vzn.css' },
      de: { ietf: 'de-DE', tk: 'hah7vzn.css' },
    };
    document.body.innerHTML = fs.readFileSync(
      path.resolve(__dirname, './mocks/dx-card-collection.html'),
      'utf8',
    );
    await preloadResources(locales, '/libs');
    const linkPreload = document.head.querySelectorAll('link[rel="preload"]');
    const linkModulepreload = document.head.querySelector('link[rel="modulepreload"]');
    expect(linkPreload[0].href).toContain('placeholders.json');
    expect(linkPreload[1].href).toContain('adobe.com/chimera-api');
    expect(linkModulepreload.href).toContain('lit-all.min.js');
  });
  it('Get nodes by XPath', () => {
    const testDiv = document.createElement('div');
    testDiv.textContent = 'Test123';
    testDiv.id = 'test-id';
    document.body.appendChild(testDiv);
    const query = '//*[contains(text(), "Test123")]';
    const elements = getNodesByXPath(query, document.body);
    expect(elements.length).toEqual(1);
    expect(elements[0].id).toEqual('test-id');
  });
  it('Should have access if sales center is present in partner data cookie', async () => {
    const cookieObject = { SPP: { salesCenterAccess: true } };
    document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
    expect(hasSalesCenterAccess()).toBe(true);
  });
  it('Should not have access if sales center is not present in partner data cookie', async () => {
    const cookieObject = { SPP: { salesCenterAccess: false } };
    document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
    expect(hasSalesCenterAccess()).toBe(false);
  });
});
