import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../eds/scripts/utils.js';

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
