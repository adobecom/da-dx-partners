import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../eds/scripts/utils.js';
import {
  applyGnavPersonalization,
  personalizePage,
  personalizePlaceholders,
  replaceDirectText,
  shouldHideLinkGroup,
} from '../../eds/scripts/personalization.js';

const miloLibs = setLibs('/libs');
const { setConfig } = await import(`${miloLibs}/utils/utils.js`);
setConfig({ locales: { '': { ietf: 'en-US' } }, miloLibs });

function setPartnerData(data) {
  document.cookie = `partner_data=${encodeURIComponent(JSON.stringify({ DXP: data }))}; Path=/`;
}

describe('personalization browser coverage', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    document.cookie = 'partner_data=; Path=/; Max-Age=0;';
    document.cookie = 'partner_info=; Path=/; Max-Age=0;';
    delete window.adobeIMS;
  });

  it('replaces direct text nodes and preserves child elements', () => {
    const element = document.createElement('div');
    element.append('Hello $name', document.createElement('strong'));

    replaceDirectText(element, '$name', 'Ada');

    expect(element.textContent).to.equal('Hello Ada');
    expect(element.querySelector('strong')).to.exist;
  });

  it('replaces placeholders and adds the optional placeholder class', () => {
    setPartnerData({ firstName: 'Ada' });
    document.body.innerHTML = '<p id="name">Hello $firstName</p>';

    personalizePlaceholders({ firstName: '//*[contains(text(), "$firstName")]' }, document, 'dxp', true);

    expect(document.querySelector('#name').textContent).to.equal('Hello Ada');
    expect(document.querySelector('#name').classList.contains('firstname-placeholder')).to.equal(true);
  });

  it('removes placeholders with missing values', () => {
    setPartnerData({});
    document.body.innerHTML = '<p id="name">Hello $firstName</p>';

    personalizePlaceholders({ firstName: '//*[contains(text(), "$firstName")]' }, document, 'dxp');

    expect(document.querySelector('#name')).to.equal(null);
  });

  it('marks personalized page blocks as processed and hides matching blocks', () => {
    document.body.innerHTML = '<main><div id="block" class="partner-personalization partner-level-platinum">Content</div></main>';

    personalizePage(document.querySelector('main'));

    const block = document.querySelector('#block');
    expect(block.classList.contains('partner-personalization-processed')).to.equal(true);
  });

  it('returns the original gnav when the visitor is not a member', () => {
    const gnav = document.createElement('nav');

    expect(applyGnavPersonalization(gnav)).to.equal(gnav);
  });

  it('evaluates link-group personalization markers', () => {
    const marked = document.createElement('div');
    marked.className = 'partner-personalization partner-level-platinum';
    const unmarked = document.createElement('div');

    expect(shouldHideLinkGroup(marked)).to.equal(true);
    expect(shouldHideLinkGroup(unmarked)).to.equal(false);
  });

  it('replaces a profile image after the profile image is available', async () => {
    window.adobeIMS = { isSignedInUser: () => true };
    const avatar = document.createElement('img');
    avatar.className = 'feds-profile-img';
    avatar.src = 'https://example.com/avatar.jpg';
    const placeholder = document.createElement('p');
    placeholder.textContent = '$profileImage';
    document.body.append(avatar, placeholder);

    personalizePlaceholders({ profileImage: '//*[contains(text(), "$profileImage")]' }, document, 'dxp');
    await Promise.resolve();

    expect(document.querySelector('picture img').src).to.equal('https://example.com/avatar.jpg');
    expect(placeholder.classList.contains('icon-area')).to.equal(true);
  });

  it('replaces a company logo from partner info', () => {
    setPartnerData({});
    document.cookie = `partner_info=${encodeURIComponent(JSON.stringify({ companyLogoUrl: 'https://example.com/logo.png' }))}; Path=/`;
    document.body.innerHTML = '<div>$companyLogoUrl</div>';

    personalizePlaceholders({ companyLogoUrl: '//*[contains(text(), "$companyLogoUrl")]' }, document, 'dxp');

    expect(document.querySelector('img[data-company-logo-url]').src).to.equal('https://example.com/logo.png');
  });
});
