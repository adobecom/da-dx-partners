import { expect } from '@esm-bundle/chai';
import {
  deleteCookieValue,
  formatDate,
  getCookieValue,
  getLocale,
  getMetadataContent,
  getNodesByXPath,
  getPartnerCookieObject,
  getPartnerCookieValue,
  getPartnerStateCookieObject,
  getProgramHomePage,
  getProgramType,
  getUserRegionParams,
  isMember,
  setLibs,
} from '../../eds/scripts/utils.js';

describe('Libs', () => {
  it('Default Libs', () => {
    const libs = setLibs('/libs');
    expect(libs).to.equal('https://stage--milo--adobecom.aem.live/libs');
  });
  it('Main Libs', () => {
    const location = {
      hostname: 'main--dme-partners.aem.page',
      origin: 'https://main--dme-partners.aem.page',
    };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('https://main--milo--adobecom.aem.live/libs');
  });
  it('Returns prod milo for prod', () => {
    const location = { origin: 'https://partners.adobe.com' };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('https://partners.adobe.com/libs');
  });
  it('Returns stage milo for stage', () => {
    const location = { origin: 'https://partners.stage.adobe.com' };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('https://partners.stage.adobe.com/libs');
  });
  it('Does not support milolibs query param on prod', () => {
    const location = {
      origin: 'https://partners.adobe.com',
      search: '?milolibs=foo',
    };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('https://partners.adobe.com/libs');
  });

  it('Supports milolibs query param', () => {
    const location = {
      hostname: 'localhost',
      origin: 'http://localhost:3000',
      search: '?milolibs=foo',
    };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('https://foo--milo--adobecom.aem.live/libs');
  });

  it('Supports local milolibs query param', () => {
    const location = {
      hostname: 'localhost',
      origin: 'http://localhost:3000',
      search: '?milolibs=local',
    };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('http://localhost:6456/libs');
  });

  it('Supports forked milolibs query param', () => {
    const location = {
      hostname: 'localhost',
      origin: 'http://localhost:3000',
      search: '?milolibs=awesome--milo--forkedowner',
    };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('https://awesome--milo--forkedowner.aem.live/libs');
  });
});

describe('utils browser coverage', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.cookie = 'partner_data=; Path=/; Max-Age=0;';
    document.cookie = 'partner_info=; Path=/; Max-Age=0;';
    document.cookie = 'test=; Path=/; Max-Age=0;';
  });

  it('formats regular and event dates', () => {
    expect(formatDate('2024-07-09T12:35:03.000Z')).to.contain('Jul 9, 2024');
    expect(formatDate('2024-07-09T12:35:03.000Z', 'en-US', true)).to.contain('Jul 9, 2024 |');
    expect(formatDate()).to.equal(undefined);
  });

  it('resolves locales and program routes', () => {
    expect(getLocale()).to.deep.equal({ ietf: 'en-US', tk: 'hah7vzn.css', prefix: '' });
    expect(getLocale({ '': { ietf: 'en-US' }, de: { ietf: 'de-DE' } }, '/de/page').prefix).to.equal('/de');
    expect(getProgramType('/digitalexperience/page')).to.equal('dxp');
    expect(getProgramType('/channelpartners/page')).to.equal('cpp');
    expect(getProgramHomePage('/channelpartners/page')).to.equal('/channelpartners/');
  });

  it('reads and combines partner cookies case-insensitively', () => {
    document.cookie = `partner_data=${encodeURIComponent(JSON.stringify({ DXP: { status: 'MEMBER', region: 'europe' } }))}; Path=/`;
    document.cookie = `partner_info=${encodeURIComponent(JSON.stringify({ company: 'Adobe' }))}; Path=/`;

    expect(getCookieValue('partner_data')).to.exist;
    expect(getPartnerCookieObject('dxp').company).to.equal('Adobe');
    expect(getPartnerCookieValue('status')).to.equal('member');
    expect(getUserRegionParams('dxp')).to.contain('region/europe');
    expect(isMember()).to.equal(true);
  });

  it('handles state cookies, metadata, XPath, and deletion', () => {
    window.history.replaceState({}, '', '/digitalexperience/');
    document.cookie = `partner_user_state=${encodeURIComponent(JSON.stringify({ DXP: { role: 'admin' } }))}; Path=/`;
    document.cookie = 'test=value; Path=/';
    const meta = document.createElement('meta');
    meta.name = 'test-meta';
    meta.content = 'content';
    document.head.appendChild(meta);
    document.body.innerHTML = '<div id="xpath">Found</div>';

    expect(getPartnerStateCookieObject('partner_user_state').role).to.equal('admin');
    expect(getMetadataContent('test-meta')).to.equal('content');
    expect(getNodesByXPath('//*[contains(text(), "Found")]')[0].id).to.equal('xpath');
    deleteCookieValue('test');
    expect(getCookieValue('test')).to.equal(undefined);
  });
});
