import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs, prodHosts } from '../../../eds/scripts/utils.js';

const miloLibs = setLibs('/libs');
const {
  shouldAllowKrTrial,
  shouldBlockFreeTrialLinks,
  populateLocalizedTextFromListItems,
  getRuntimeActionUrl,
  generateRequestForSearchAPI,
  transformCardUrl,
  isProd,
  keepInlineFragmentInDOM,
} = await import('../../../eds/blocks/utils/utils.js');
const { setConfig } = await import(`${miloLibs}/utils/utils.js`);

function makeButton({ href = '', text = '', modalPath = '', wcsOsi = false } = {}) {
  const button = document.createElement('a');
  button.href = href;
  button.textContent = text;
  if (modalPath) button.dataset.modalPath = modalPath;
  if (wcsOsi) button.dataset.wcsOsi = 'true';
  return button;
}

describe('block utility functions', () => {
  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
  });

  describe('Korean trial links', () => {
    it('removes the allow-KR marker from the link and modal hash', () => {
      const button = makeButton({ href: 'https://example.com#_allow-kr-trial' });
      button.dataset.modalHash = 'modal#_allow-kr-trial';

      expect(shouldAllowKrTrial(button, '/kr')).to.equal(true);
      expect(button.href).to.equal('https://example.com/');
      expect(button.dataset.modalHash).to.equal('modal');
    });

    it('does not allow the marker outside the Korean locale', () => {
      const button = makeButton({ href: 'https://example.com#_allow-kr-trial' });

      expect(shouldAllowKrTrial(button, '/de')).to.equal(false);
      expect(button.href).to.equal('https://example.com/');
    });

    it('removes ordinary Korean free-trial links', () => {
      const button = makeButton({ text: 'Start free trial' });
      document.body.appendChild(button);

      expect(shouldBlockFreeTrialLinks({ button, localePrefix: '/kr' })).to.equal(true);
      expect(button.isConnected).to.equal(false);
    });

    it('hides OSI trial links without removing them', () => {
      const button = makeButton({ text: 'Free trial', wcsOsi: true });
      document.body.appendChild(button);

      expect(shouldBlockFreeTrialLinks({ button, localePrefix: '/kr' })).to.equal(false);
      expect(button.classList.contains('hidden-osi-trial-link')).to.equal(true);
    });

    it('removes the strong wrapper when it contains only the trial link', () => {
      const parent = document.createElement('strong');
      const button = makeButton({ modalPath: '/kr/cc-shared/fragments/trial-modals' });
      parent.appendChild(button);
      document.body.appendChild(parent);

      expect(shouldBlockFreeTrialLinks({ button, localePrefix: '/kr', parent })).to.equal(true);
      expect(parent.isConnected).to.equal(false);
    });
  });

  it('populates localized text from authored list items', () => {
    const block = document.createElement('div');
    block.innerHTML = '<ul><li>Clear all</li><li>most-relevant_default</li><li></li></ul>';
    const localizedText = { '{{existing}}': 'Existing' };

    populateLocalizedTextFromListItems(block, localizedText);

    expect(localizedText['{{clear-all}}']).to.equal('clear-all');
    expect(localizedText['{{most-relevant}}']).to.equal('most-relevant');
    expect(localizedText['{{existing}}']).to.equal('Existing');
  });

  it('builds stage and production runtime action URLs', () => {
    const originalHosts = [...prodHosts];
    prodHosts.length = 0;
    expect(getRuntimeActionUrl('/action').toString()).to.equal('https://io-partners-dx.stage.adobe.com/action');
    prodHosts.push(window.location.host);
    expect(getRuntimeActionUrl('/action').toString()).to.equal('https://io-partners-dx.adobe.com/action');
    prodHosts.length = 0;
    prodHosts.push(...originalHosts);
  });

  it('generates a search request with locale and page options', async () => {
    const fetchStub = sinon.stub(window, 'fetch').resolves({ ok: true });
    const originalHosts = [...prodHosts];
    prodHosts.length = 0;
    setConfig({ locales: { '': { ietf: 'en-US' } } });

    await generateRequestForSearchAPI({ query: 'analytics', limit: 10 }, { filters: [] });

    const [url, options] = fetchStub.firstCall.args;
    expect(url.toString()).to.contain('language=en-US');
    expect(url.toString()).to.contain('query=analytics');
    expect(url.toString()).to.contain('limit=10');
    expect(options.method).to.equal('POST');
    expect(options.credentials).to.equal('include');
    expect(options.body).to.equal(JSON.stringify({ filters: [] }));
    prodHosts.push(...originalHosts);
  });

  it('transforms relative and partner-host URLs for the current environment', () => {
    const originalHosts = [...prodHosts];
    prodHosts.length = 0;
    expect(transformCardUrl('/digitalexperience/asset').toString())
      .to.equal('http://partners.stage.adobe.com/digitalexperience/asset');
    prodHosts.push(window.location.host);
    expect(transformCardUrl('https://partners.stage.adobe.com/asset').host).to.equal('partners.adobe.com');
    prodHosts.length = 0;
    prodHosts.push(...originalHosts);
  });

  it('returns an empty card URL for missing input', () => {
    const errorStub = sinon.stub(console, 'error');

    expect(transformCardUrl()).to.equal('');
    expect(errorStub.calledOnce).to.equal(true);
  });

  it('detects production hosts and preserves inline fragments', () => {
    const originalHosts = [...prodHosts];
    prodHosts.push(window.location.host);
    expect(isProd()).to.equal(true);
    prodHosts.length = 0;
    prodHosts.push(...originalHosts);

    const row = document.createElement('div');
    row.innerHTML = '<div>fragment-link</div><div><span>Inline content</span></div>';
    const block = document.createElement('div');
    keepInlineFragmentInDOM([row], block, 'fragment-link', false);

    expect(block.querySelector('#fragment-link').style.display).to.equal('block');
    expect(block.querySelector('#fragment-link').textContent).to.equal('Inline content');
  });
});
