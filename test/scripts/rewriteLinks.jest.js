/**
 * @jest-environment jsdom
 */
import { getUpdatedHref, rewriteLinks, rewriteUrlOnNonProd } from '../../eds/scripts/rewriteLinks.js';
import { getConfig } from '../../eds/blocks/utils/utils.js';
import { partnerIsSignedIn } from '../../eds/scripts/utils.js';

jest.mock('../../eds/blocks/utils/utils.js', () => ({ getConfig: jest.fn() }));
jest.mock('../../eds/scripts/utils.js', () => ({
  partnerIsSignedIn: jest.fn(() => ({ 'partner name': { company: 'test' } })),
  prodHosts: [
    'main--da-dx-partners--adobecom.hlx.page',
    'main--da-dx-partners--adobecom.hlx.live',
    'main--da-dx-partners--adobecom.aem.page',
    'main--da-dx-partners--adobecom.aem.live',
    'partners.adobe.com',
  ],
}));

// Mock DOM
document.body.innerHTML = `
  <div>
    <a href="https://partners.adobe.com">Partner prod Link</a>
    <a id="spp-link" href="https://solutionpartners.adobe.com/solution-partners/contact.html">SPP prod Link</a>
    <a id="exchange-link" href="https://exchange.adobe.com/">Adobe Exchange prod Link</a>
    <a id="cbc-link" href="https://cbconnection.adobe.com/en/apc-helpdesk">CBC prod Link</a>
  </div>
`;

describe('Test rewrite links', () => {
  beforeEach(() => {
    getConfig.mockReturnValue({ env: { name: 'stage' }, codeRoot: 'https://stage--da-dx-partners--adobecom.aem.page/edsdme' });
    partnerIsSignedIn.mockReturnValue({ 'partner name': { company: 'test' } });
    window.history.pushState({}, '', '/cn/test-path');
  });
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  test('should update partners prod link when on non prod', () => {
    rewriteLinks(document);
    const links = document.querySelectorAll('a');
    expect(links[0].href).toBe('https://partners.stage.adobe.com/');
  });

  test('should update partners prod domain when not logged in when on stage,', () => {
    partnerIsSignedIn.mockReturnValue(null);

    rewriteLinks(document);
    const links = document.querySelectorAll('a');
    expect(links[0].href).toBe('https://partners.stage.adobe.com/');
  });

  test('should update SPP prod link when on non prod', () => {
    rewriteLinks(document);
    const link = document.querySelector('#spp-link');
    expect(link.href).toBe('https://solutionpartners.stage2.adobe.com/solution-partners/contact.html');
  });

  test('should update Adobe Exchange prod link when on non prod', () => {
    rewriteLinks(document);
    const link = document.querySelector('#exchange-link');
    expect(link.href).toBe('https://stage.exchange.adobe.com/');
  });

  test('should update CBC prod link when on non prod', () => {
    rewriteLinks(document);
    const link = document.querySelector('#cbc-link');
    expect(link.href).toBe('https://cbconnection-stage.adobe.com/en/apc-helpdesk');
  });

  test('should return prod link href unchanged in on aem.page', () => {
    getConfig.mockReturnValue({ env: { name: 'stage' }, codeRoot: 'https://main--da-dx-partners--adobecom.aem.page/edsdme' });

    const href = 'https://partners.adobe.com/';
    const result = getUpdatedHref(href);

    expect(result).toBe(href);
  });

  test('should return invalid href unchanged', () => {
    expect(getUpdatedHref('not a url')).toBe('not a url');
  });

  test('should leave links unchanged in production', () => {
    getConfig.mockReturnValue({ env: { name: 'prod' }, codeRoot: 'https://stage--da-dx-partners--adobecom.aem.page/edsdme' });

    const url = new URL('https://partners.adobe.com/path');
    rewriteUrlOnNonProd(url);

    expect(url.href).toBe('https://partners.adobe.com/path');
  });

  test('should leave unmapped domains unchanged', () => {
    const url = new URL('https://example.com/path');
    rewriteUrlOnNonProd(url);

    expect(url.href).toBe('https://example.com/path');
  });

  test('should rewrite partner benefits links on stage', () => {
    const url = new URL('https://partnerbenefitscenter.adobe.com/benefits');
    rewriteUrlOnNonProd(url);

    expect(url.hostname).toBe('pp-staging.adobe.com');
  });

  test('should return the element and ignore elements without hrefs', () => {
    const element = document.createElement('div');
    element.innerHTML = '<span>Not a link</span><a href="https://example.com/path">Unmapped</a>';

    const result = rewriteLinks(element);

    expect(result).toBe(element);
    expect(result.querySelector('span').textContent).toBe('Not a link');
    expect(result.querySelector('a').href).toBe('https://example.com/path');
  });
});
