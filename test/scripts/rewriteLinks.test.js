import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../eds/scripts/utils.js';

const miloLibs = setLibs('/libs');
const { setConfig } = await import(`${miloLibs}/utils/utils.js`);
setConfig({
  codeRoot: 'https://stage--da-dx-partners--adobecom.aem.page/eds',
  miloLibs,
  locales: { '': { ietf: 'en-US' } },
});
const blockUtils = await import('../../eds/blocks/utils/utils.js');
const configured = blockUtils.getConfig();
if (configured) configured.codeRoot = 'https://stage--da-dx-partners--adobecom.aem.page/eds';
const { getUpdatedHref, rewriteLinks } = await import('../../eds/scripts/rewriteLinks.js');

describe('rewriteLinks browser coverage', () => {
  it('rewrites a production partner URL on stage', () => {
    expect(getUpdatedHref('https://partners.adobe.com/path')).to.equal('https://partners.stage.adobe.com/path');
  });

  it('rewrites links in an element and returns the element', () => {
    const element = document.createElement('div');
    element.innerHTML = '<a href="https://partners.adobe.com/path">Link</a>';

    expect(rewriteLinks(element)).to.equal(element);
    expect(element.querySelector('a').href).to.equal('https://partners.stage.adobe.com/path');
  });
});
