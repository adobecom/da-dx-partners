/**
 * @jest-environment jsdom
 */
import { getUpdatedHref, rewriteLinks } from '../../eds/scripts/rewriteLinks.js';
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
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        pathname: '/cn/test-path',
        href: 'http://example.com/cn/test-path',
        assign: jest.fn(),
        reload: jest.fn(),
      },
    });
  });
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  test('should  update partners prod link when on non prod', () => {
    rewriteLinks(document);
    const links = document.querySelectorAll('a');
    expect(links[0].href).toBe('https://partners.stage.adobe.com/');
  });

  test(
    'should update partners prod domain when not logged in when on stage,',
    () => {
      partnerIsSignedIn.mockReturnValue(null);

      rewriteLinks(document);
      const links = document.querySelectorAll('a');
      expect(links[0].href).toBe('https://partners.stage.adobe.com/');
    },
  );

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
});
