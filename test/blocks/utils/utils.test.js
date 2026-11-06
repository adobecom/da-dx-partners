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
  sidekickListener,
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

  describe('Sidekick CaaS unpublishing', () => {
    let clock;
    let fetchStub;
    let errorStub;
    let sidekick;
    let listenerSpy;
    let originalIMS;
    let originalUrl;
    let originalHosts;

    before(async () => {
      await Promise.all([
        import(`${miloLibs}/features/spectrum-web-components/dist/toast.js`),
        import(`${miloLibs}/features/spectrum-web-components/dist/theme.js`),
      ]);
    });

    beforeEach(async () => {
      originalIMS = window.adobeIMS;
      originalUrl = window.location.href;
      originalHosts = [...prodHosts];
      prodHosts.length = 0;
      window.adobeIMS = {
        isSignedInUser: sinon.stub().returns(true),
        getAccessToken: sinon.stub().returns({ token: 'test-token' }),
        adobeIdData: {},
        signIn: sinon.spy(),
      };
      document.body.innerHTML = '<header></header><aem-sidekick></aem-sidekick>';
      sidekick = document.querySelector('aem-sidekick');
      listenerSpy = sinon.spy(sidekick, 'addEventListener');
      fetchStub = sinon.stub(window, 'fetch').resolves({
        ok: true,
        json: async () => ({ successfulIds: ['https://example.com/card: card-id'], errors: [] }),
      });
      errorStub = sinon.stub(console, 'error');
      clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
      await sidekickListener();
    });

    afterEach(() => {
      sinon.restore();
      window.adobeIMS = originalIMS;
      prodHosts.length = 0;
      prodHosts.push(...originalHosts);
      window.history.replaceState({}, '', originalUrl);
      document.body.innerHTML = '';
    });

    const runAction = async () => {
      sidekick.dispatchEvent(new Event('custom:unpublishfromcaas'));
      await clock.tickAsync(16);
      const toasts = document.querySelectorAll('sp-toast');
      expect(toasts.length).to.equal(2);
      const result = toasts[toasts.length - 1];
      return result;
    };

    const startPolling = async () => {
      const querySelector = document.querySelector.bind(document);
      let querySpy;
      const queried = new Promise((resolve) => {
        querySpy = sinon.stub(document, 'querySelector').callsFake((selector) => {
          const element = querySelector(selector);
          if (selector === 'aem-sidekick, helix-sidekick') resolve();
          return element;
        });
      });
      const pending = sidekickListener();
      await queried;
      return { pending, querySpy };
    };

    it('registers a one-shot handler on the Sidekick', () => {
      expect(listenerSpy.calledOnce).to.equal(true);
      expect(listenerSpy.firstCall.args[0]).to.equal('custom:unpublishfromcaas');
      expect(listenerSpy.firstCall.args[2]).to.deep.equal({ once: true });
    });

    it('supports the legacy helix-sidekick element', async () => {
      sidekick.remove();
      const legacySidekick = document.createElement('helix-sidekick');
      const legacySpy = sinon.spy(legacySidekick, 'addEventListener');
      document.body.appendChild(legacySidekick);

      await sidekickListener();

      expect(legacySpy.calledOnce).to.equal(true);
      legacySidekick.dispatchEvent(new Event('custom:unpublishfromcaas'));
      await clock.tickAsync(16);
      expect(fetchStub.calledOnce).to.equal(true);
    });

    it('waits for a Sidekick that appears after initialization', async () => {
      sidekick.remove();
      const { pending, querySpy } = await startPolling();
      await clock.tickAsync(0);
      expect(listenerSpy.callCount).to.equal(1);
      expect(querySpy.withArgs('aem-sidekick, helix-sidekick').callCount).to.equal(1);
      document.body.appendChild(sidekick);

      await clock.tickAsync(500);
      await pending;

      expect(listenerSpy.callCount).to.equal(2);
      expect(errorStub.called).to.equal(false);
    });

    it('logs a timeout when the Sidekick never appears', async () => {
      sidekick.remove();
      const { pending, querySpy } = await startPolling();

      await clock.tickAsync(0);
      await clock.tickAsync(9499);
      expect(errorStub.called).to.equal(false);
      await clock.tickAsync(1);
      await pending;

      expect(querySpy.withArgs('aem-sidekick, helix-sidekick').callCount).to.equal(20);
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.equal('Sidekick not found within timeout.');
      expect(errorStub.firstCall.args[1].message).to.include('(20) attempts');
      expect(fetchStub.called).to.equal(false);
    });

    it('renders card URLs as safe links and styles long toast content', async () => {
      const result = await runAction();
      const link = result.querySelector('a');

      expect(link.href).to.equal('https://example.com/card');
      expect(link.textContent).to.equal('https://example.com/card: card-id');
      expect(link.target).to.equal('_blank');
      expect(link.rel).to.equal('noopener noreferrer');
      const content = result.shadowRoot.querySelector('.content');
      expect(content.style.getPropertyValue('word-break')).to.equal('break-word');
      expect(content.style.getPropertyValue('max-height')).to.equal('500px');
    });

    it('removes the dismissed result and allows another action', async () => {
      const result = await runAction();
      const theme = result.parentElement;

      sidekick.dispatchEvent(new Event('custom:unpublishfromcaas'));
      await clock.tickAsync(0);
      expect(fetchStub.callCount).to.equal(1);

      result.dispatchEvent(new Event('close'));
      await clock.tickAsync(0);
      expect(theme.isConnected).to.equal(false);
      expect(listenerSpy.callCount).to.equal(2);

      sidekick.dispatchEvent(new Event('custom:unpublishfromcaas'));
      await clock.tickAsync(16);
      expect(fetchStub.callCount).to.equal(2);
    });

    it('surfaces HTTP failures in a negative toast', async () => {
      fetchStub.resolves({ ok: false, status: 403, text: async () => 'Forbidden' });

      const result = await runAction();

      expect(result.variant).to.equal('negative');
      expect(result.textContent).to.include('CaaS unpublishing failed: Forbidden');
      expect(errorStub.calledWith('CaaS Unpublish Failed:', 403, 'Forbidden')).to.equal(true);
    });

    [
      { successfulIds: [], variant: 'negative' },
      { successfulIds: ['card-id'], variant: 'info' },
    ].forEach(({ successfulIds, variant }) => {
      it(`reports runtime errors with the ${variant} variant`, async () => {
        fetchStub.resolves({
          ok: true,
          json: async () => ({ successfulIds, errors: ['Unable to remove card'] }),
        });

        const result = await runAction();

        expect(result.variant).to.equal(variant);
        expect(result.textContent).to.include('Unable to remove card');
        successfulIds.forEach((id) => expect(result.textContent).to.include(id));
      });
    });

    it('surfaces network failures in a negative toast', async () => {
      fetchStub.rejects(new Error('Network unavailable'));

      const result = await runAction();

      expect(result.variant).to.equal('negative');
      expect(result.textContent).to.include('Unexpected error: Network unavailable');
      expect(errorStub.firstCall.args[0]).to.equal('Unexpected Error:');
    });

    it('redirects signed-out users to login without calling the runtime', async () => {
      window.adobeIMS.isSignedInUser.returns(false);
      sidekick.dispatchEvent(new Event('custom:unpublishfromcaas'));
      await clock.tickAsync(16);

      expect(fetchStub.called).to.equal(false);
      expect(window.adobeIMS.getAccessToken.called).to.equal(false);
      expect(document.querySelector('sp-toast').textContent).to.include('not logged in');
      expect(document.querySelector('sp-toast').variant).to.equal('info');
      expect(window.adobeIMS.signIn.called).to.equal(false);

      await clock.tickAsync(984);

      expect(window.adobeIMS.adobeIdData.redirect_uri).to.equal(window.location.href);
      expect(window.adobeIMS.signIn.calledOnce).to.equal(true);
    });
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
    expect(getRuntimeActionUrl('/action').toString()).to.equal('https://partners.stage.adobe.com/action');
    prodHosts.push(window.location.host);
    expect(getRuntimeActionUrl('/action').toString()).to.equal('https://partners.adobe.com/action');
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
