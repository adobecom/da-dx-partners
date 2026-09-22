import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../eds/scripts/utils.js';
import {
  getBctqBanner,
  getGlobalBanner,
  loadPopupFragment,
  portalMessaging,
  prependContent,
} from '../../eds/scripts/portalMessaging.js';
import { PERSONALIZATION_CONDITIONS } from '../../eds/scripts/personalizationConfigDX.js';

const miloLibs = setLibs('/libs');
const { setConfig } = await import(`${miloLibs}/utils/utils.js`);
setConfig({ codeRoot: '/eds', miloLibs, locales: { '': { ietf: 'en-US' } } });

describe('portalMessaging browser coverage', () => {
  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    sessionStorage.clear();
  });

  it('returns the first element from a popup fragment main', async () => {
    sinon.stub(window, 'fetch').resolves({
      ok: true,
      text: async () => '<html><body><main><div id="popup">Content</div></main></body></html>',
    });

    const result = await loadPopupFragment('/fragment.html', 'portal messaging');

    expect(result.id).to.equal('popup');
  });

  it('returns null when a fragment request fails', async () => {
    sinon.stub(window, 'fetch').resolves({ ok: false, status: 404 });

    expect(await loadPopupFragment('/missing.html')).to.equal(null);
  });

  it('returns null when BCTQ personalization is not enabled', async () => {
    expect(await getBctqBanner()).to.equal(null);
  });

  it('skips portal messaging when the agreement was displayed', async () => {
    expect(await portalMessaging('/libs', true)).to.equal(false);
  });

  it('skips portal messaging after it was closed', async () => {
    sessionStorage.setItem('portal-messaging-popup-closed', 'true');

    expect(await portalMessaging('/libs', false)).to.equal(false);
  });

  it('skips portal messaging when no special state is present', async () => {
    expect(await portalMessaging('/libs', false)).to.equal(false);
  });

  it('skips global banners with NONE metadata', async () => {
    const meta = document.createElement('meta');
    meta.name = 'global-banner';
    meta.content = ' none ';
    document.head.appendChild(meta);

    expect(await getGlobalBanner()).to.equal(undefined);
  });

  it('skips global banners with invalid paths', async () => {
    const meta = document.createElement('meta');
    meta.name = 'global-banner';
    meta.content = 'invalid/path';
    document.head.appendChild(meta);

    expect(await getGlobalBanner()).to.equal(undefined);
  });

  it('adds a notification ribbon when a main element exists', async () => {
    document.body.innerHTML = '<main><p>Content</p></main>';

    await prependContent();

    expect(document.querySelector('#notificationRibbon')).to.exist;
    expect(document.querySelector('main').firstElementChild.id).to.equal('notificationRibbon');
  });

  it('does nothing when no main element exists', async () => {
    document.body.innerHTML = '<section>Content</section>';

    await prependContent();

    expect(document.querySelector('#notificationRibbon')).to.equal(null);
  });

  it('skips a special-state popup when its metadata is missing', async () => {
    document.cookie = 'partner_data={"DXP":{"specialState":"submitted-in-review"}}; Path=/';
    PERSONALIZATION_CONDITIONS['partner-submitted-in-review'] = true;

    expect(await portalMessaging(miloLibs, false)).to.equal(false);

    PERSONALIZATION_CONDITIONS['partner-submitted-in-review'] = false;
  });

  it('renders a special-state popup and initializes its modal content', async () => {
    document.cookie = 'partner_data={"DXP":{"specialState":"submitted-in-review"}}; Path=/';
    PERSONALIZATION_CONDITIONS['partner-submitted-in-review'] = true;
    const meta = document.createElement('meta');
    meta.name = 'submitted-in-review-modal';
    meta.content = '/fragments/submitted-in-review';
    document.head.appendChild(meta);
    sinon.stub(window, 'fetch').resolves({
      ok: true,
      text: async () => '<html><body><main><div id="popup">Content</div></main></body></html>',
    });

    const result = await portalMessaging(miloLibs, false);

    expect(result).to.equal(true);
    expect(document.querySelector('#portal-messaging-modal')).to.exist;
    PERSONALIZATION_CONDITIONS['partner-submitted-in-review'] = false;
  });
});
