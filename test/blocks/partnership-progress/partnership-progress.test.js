import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../eds/scripts/utils.js';
import { waitFor } from '../../helpers/waitfor.js';

const miloLibs = setLibs('/libs');
const { setConfig } = await import(`${miloLibs}/utils/utils.js`);
const { render } = await import(`${miloLibs}/deps/lit-all.min.js`);
setConfig({ locales: { '': { ietf: 'en-US' } }, miloLibs });
const { default: PartnershipProgress } = await import('../../../eds/blocks/partnership-progress/PartnershipProgress.js');
const { default: init } = await import('../../../eds/blocks/partnership-progress/partnership-progress.js');

function setPartnerLevelCookie(level) {
  document.cookie = `partner_data=${encodeURIComponent(JSON.stringify({ DXP: { level } }))}; Path=/`;
}

function clearPartnerCookies() {
  document.cookie = 'partner_data=; Max-Age=0; Path=/';
  document.cookie = 'partner_info=; Max-Age=0; Path=/';
}

function renderToNode(template) {
  const container = document.createElement('div');
  render(template, container);
  return container.firstElementChild;
}

describe('partnership-progress', () => {
  beforeEach(async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    clearPartnerCookies();
    delete window.dxpImsReady;
    window.adobeIMS = { getAccessToken: () => ({ token: 'test-token' }) };
  });

  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
    delete window.adobeIMS;
    delete window.dxpImsReady;
    clearPartnerCookies();
  });

  it('replaces the authored block with a partnership-progress element', async () => {
    const section = document.createElement('div');
    section.setAttribute('data-idx', '0');
    const block = document.createElement('div');
    block.className = 'partnership-progress';
    section.appendChild(block);
    document.body.appendChild(section);

    const app = await init(block);

    expect(app.tagName.toLowerCase()).to.equal('partnership-progress');
    expect(app.getAttribute('data-idx')).to.equal('0');
    expect(app.className).to.equal('partnership-progress-block');
  });

  it('initializes the block and sets blockData', async () => {
    const el = document.querySelector('.partnership-progress');
    expect(el).to.exist;

    el.parentNode.setAttribute('data-idx', '0');
    const app = await init(el);

    expect(app).to.exist;
    expect(app.blockData).to.exist;
    expect(app.className).to.equal('partnership-progress-block');
  });

  it('fetches data on imsReady and populates component state', async () => {
    const apiResponse = {
      solution: [{ level: 'gold', customerDeployments: { percentage: 50 }, credentials: { percentage: 20 }, specializations: { percentage: 75 } }],
      technology: [{ level: 'gold', customerDeployments: { percentage: 30 }, credentials: { percentage: 10 }, solutions: { percentage: 50 } }],
    };

    const fetchStub = sinon.stub(window, 'fetch').resolves({
      ok: true,
      json: async () => apiResponse,
    });

    const el = document.querySelector('.partnership-progress');
    el.parentNode.setAttribute('data-idx', '0');
    const app = await init(el);

    window.dispatchEvent(new Event('dxpImsReady'));
  await waitFor(() => app.data && app.loading === false, 1000, 10);
    await app.updateComplete;

    expect(fetchStub.calledOnce).to.equal(true);
    expect(app.data).to.deep.equal(apiResponse);
    expect(app.loading).to.equal(false);
  });

  it('getProgramData returns target level data based on partner level', async () => {
    const instance = new PartnershipProgress();
    instance.blockData = { localizedText: {} };
    instance.data = {
      solution: [
        { level: 'gold', credentials: { percentage: 10 } },
        { level: 'platinum', credentials: { percentage: 20 } },
      ],
    };

    setPartnerLevelCookie('Silver');
    const res = instance.getProgramData('solution');

    expect(res).to.exist;
    expect(res.level.toLowerCase()).to.equal('gold');
  });

  it('renderProgressBar clamps values between 0 and 100', async () => {
    const instance = new PartnershipProgress();

    const low = renderToNode(instance.renderProgressBar(-10, 'low'));
    expect(low.getAttribute('aria-valuenow')).to.equal('0');

    const high = renderToNode(instance.renderProgressBar(150, 'high'));
    expect(high.getAttribute('aria-valuenow')).to.equal('100');

    const mid = renderToNode(instance.renderProgressBar(42, 'mid'));
    expect(mid.getAttribute('aria-valuenow')).to.equal('42');
  });
});
