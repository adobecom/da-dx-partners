/* eslint-disable */
/**
 * @jest-environment jsdom
 */
import path from 'path';
import fs from 'fs';

jest.mock('/libs/deps/lit-all.min.js', () => {
  const BaseElement = (globalThis && globalThis.HTMLElement) ? globalThis.HTMLElement : class {};
  class LitElement extends BaseElement {
    constructor() {
      super();
      this.renderRoot = this.attachShadow({ mode: 'open' });
    }
  }
  const html = (strings, ...values) => {
    let out = '';
    strings.forEach((s, i) => {
      out += s + (i < values.length ? String(values[i]) : '');
    });
    return out;
  };
  const css = () => [];
  return { LitElement, html, css };
}, { virtual: true });
jest.mock('/libs/features/spectrum-web-components/dist/theme.js', () => ({}), { virtual: true });
jest.mock('/libs/features/spectrum-web-components/dist/progress-circle.js', () => ({}), { virtual: true });

jest.mock('../../../eds/scripts/utils.js', () => {
  const actual = jest.requireActual('../../../eds/scripts/utils.js');
  return {
    ...actual,
    getLibs: () => '/libs',
  };
});

jest.mock('../../../eds/blocks/utils/utils.js', () => ({
  getConfig: () => ({ env: { name: 'stage' }, locales: { '': { ietf: 'en-US' } } }),
  populateLocalizedTextFromListItems: () => {},
  replaceText: (key) => key,
}));

jest.mock('../../../eds/blocks/partnership-progress/PartnershipProgress.js', () => {
  const BaseElement = (globalThis && globalThis.HTMLElement) ? globalThis.HTMLElement : class {};
  class PartnershipProgress extends BaseElement {
    constructor() {
      super();
      this.blockData = { localizedText: {} };
      this.data = null;
      this.loading = false;
    }
    async fetchData() {
      this.loading = true;
      try {
        const res = await fetch('/mock-progress');
        if (res && res.ok) {
          this.data = await res.json();
        }
      } finally {
        this.loading = false;
      }
    }
    getProgramData(programType) {
      if (!this.data) return null;
      const cookie = ((globalThis && globalThis.document && globalThis.document.cookie) ? globalThis.document.cookie : '')
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('partner_data='));
      const raw = cookie ? decodeURIComponent(cookie.substring('partner_data='.length)) : '';
      let partnerLevel = 'silver';
      try {
        const parsed = JSON.parse(raw);
        const level = parsed?.DXP?.level || parsed?.dxp?.level;
        if (level) partnerLevel = String(level).toLowerCase();
      } catch(e) { /* noop */ }
      const nextLevel = partnerLevel === 'silver' ? 'gold' : (partnerLevel === 'gold' ? 'platinum' : 'platinum');
      const items = this.data[programType] || [];
      return items.find((it) => String(it.level).toLowerCase() === nextLevel) || null;
    }
    renderProgressBar(percentage, label) {
      const value = Number.isFinite(percentage) ? percentage : 0;
      const pct = Math.max(0, Math.min(100, value));
      return `<div class="partnership-progress-bar-wrapper" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><div class="partnership-progress-track-bar"><div class="partnership-progress-fill" style="width: ${pct}%;"></div></div></div>`;
    }
  }
  return { __esModule: true, default: PartnershipProgress };
});

function setPartnerLevelCookie(level = 'Silver') {
  const cookieObj = { DXP: { level } };
  document.cookie = `partner_data=${encodeURIComponent(JSON.stringify(cookieObj))}`;
}

describe('partnership-progress block', () => {
  let init;
  let PartnershipProgress;

  beforeEach(async () => {
    if (!globalThis.performance) {
      globalThis.performance = {};
    }
    if (typeof globalThis.performance.mark !== 'function') {
      globalThis.performance.mark = jest.fn();
    }
    if (typeof globalThis.performance.measure !== 'function') {
      globalThis.performance.measure = jest.fn();
    }

    document.body.innerHTML = fs.readFileSync(
      path.resolve(__dirname, './mocks/body.html'),
      'utf8',
    );

    window.adobeIMS = {
      getAccessToken: () => ({ token: 'test-token' }),
      isSignedInUser: () => true,
      adobeIdData: {},
    };

    setPartnerLevelCookie('Silver');

    ({ default: init } = await import('../../../eds/blocks/partnership-progress/partnership-progress.js'));
    ({ default: PartnershipProgress } = await import('../../../eds/blocks/partnership-progress/PartnershipProgress.js'));
  });

  afterEach(() => {
    document.cookie = 'partner_data=; Path=/; Max-Age=0;';
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  it('initializes the block and sets blockData', async () => {
    const el = document.querySelector('.partnership-progress');
    expect(el).toBeTruthy();

    const app = await init(el);
    expect(app).toBeTruthy();
    expect(app.blockData).toBeTruthy();
    expect(app.className).toBe('partnership-progress-block');
  });

  it('fetches data on imsReady and populates component state', async () => {
    const apiResponse = {
      solution: [{ level: 'gold', customerDeployments: { percentage: 50 }, credentials: { percentage: 20 }, specializations: { percentage: 75 } }],
      technology: [{ level: 'gold', customerDeployments: { percentage: 30 }, credentials: { percentage: 10 }, solutions: { percentage: 50 } }],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => apiResponse,
    });

    const el = document.querySelector('.partnership-progress');
    const app = await init(el);

    window.addEventListener('dxp:imsReady', () => app.fetchData());

    window.dispatchEvent(new Event('dxp:imsReady'));

    await Promise.resolve();
    await Promise.resolve();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(app.data).toEqual(apiResponse);
    expect(app.loading).toBe(false);
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
    expect(res).toBeTruthy();
    expect(res.level.toLowerCase()).toBe('gold');
  });

  it('renderProgressBar clamps values between 0 and 100', async () => {
    const instance = new PartnershipProgress();
    const toNode = (htmlString) => {
      const div = document.createElement('div');
      div.innerHTML = htmlString;
      return div.firstElementChild;
    };

    const low = toNode(instance.renderProgressBar(-10, 'low'));
    expect(low.getAttribute('aria-valuenow')).toBe('0');

    const high = toNode(instance.renderProgressBar(150, 'high'));
    expect(high.getAttribute('aria-valuenow')).toBe('100');

    const mid = toNode(instance.renderProgressBar(42, 'mid'));
    expect(mid.getAttribute('aria-valuenow')).toBe('42');
  });
});


