/* eslint-disable */
/**
 * @jest-environment jsdom
 */
import path from 'path';
import fs from 'fs';

jest.mock('../../../eds/scripts/utils.js', () => ({
  getLibs: () => '/libs',
  invokeAfterImsIsReady: async (cb) => cb(),
  getMetadataContent: (name) => global.document.querySelector(`meta[name="${name}"]`)?.content ?? null,
}));

jest.mock('../../../eds/blocks/utils/partnershipDataService.js', () => ({
  getPartnershipData: jest.fn(),
}));

jest.mock('../../../eds/scripts/personalization.js', () => ({
  replaceDirectText: jest.fn((node, search, replace) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        child.nodeValue = child.nodeValue.replaceAll(search, replace);
      }
    });
  }),
}));

jest.mock('/libs/utils/utils.js', () => ({ loadStyle: jest.fn() }), { virtual: true });
jest.mock('/libs/blocks/notification/notification.js', () => ({ __esModule: true, default: jest.fn() }), { virtual: true });

function makeApiData({ level = 'Gold', solutionPct = 100, technologyPct = 100 } = {}) {
  const norm = level.toLowerCase();
  const next = norm === 'silver' ? 'gold' : 'platinum';
  return {
    billingContact: [{ firstName: 'Jane', lastName: 'Doe' }],
    level,
    solution: [
      {
        level: next,
        credentials: { total: 0, required: 30, percentage: solutionPct },
        customerDeployments: { total: 0, required: 10, percentage: solutionPct },
        specializations: { total: 0, required: 1, percentage: solutionPct },
      },
      {
        level: norm === 'silver' ? 'platinum' : 'silver',
        credentials: { total: 0, required: 100, percentage: 0 },
        customerDeployments: { total: 0, required: 20, percentage: 0 },
        specializations: { total: 0, required: 5, percentage: 0 },
      },
    ],
    technology: [
      {
        level: next,
        credentials: { total: 0, required: 2, percentage: technologyPct },
        customerDeployments: { total: 0, required: 2, percentage: technologyPct },
        solutions: { total: 0, required: 1, percentage: technologyPct },
      },
      {
        level: norm === 'silver' ? 'platinum' : 'silver',
        credentials: { total: 0, required: 4, percentage: 0 },
        customerDeployments: { total: 0, required: 3, percentage: 0 },
        solutions: { total: 0, required: 1, percentage: 0 },
      },
    ],
  };
}

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('getTargetLevel', () => {
  let getTargetLevel;

  beforeAll(async () => {
    ({ getTargetLevel } = await import('../../../eds/blocks/uplevel-banner/uplevel-banner.js'));
  });

  it('returns null for platinum level', () => {
    expect(getTargetLevel(makeApiData({ level: 'Platinum' }))).toBeNull();
  });

  it('returns null for unknown level', () => {
    expect(getTargetLevel(makeApiData({ level: 'Registered' }))).toBeNull();
  });

  it('returns null when both solution and technology tracks are incomplete', () => {
    expect(getTargetLevel(makeApiData({ solutionPct: 0, technologyPct: 0 }))).toBeNull();
  });

  it('returns target level when solution track is fully completed', () => {
    expect(getTargetLevel(makeApiData({ solutionPct: 100 }))).toBe('platinum');
  });

  it('returns target level when solution is incomplete but technology track is fully completed', () => {
    expect(getTargetLevel(makeApiData({ solutionPct: 0, technologyPct: 100 }))).toBe('platinum');
  });

  it('maps Silver → gold and Gold → platinum', () => {
    expect(getTargetLevel(makeApiData({ level: 'Silver' }))).toBe('gold');
    expect(getTargetLevel(makeApiData({ level: 'Gold' }))).toBe('platinum');
  });
});

describe('uplevel-banner init', () => {
  let init;
  let getPartnershipData;
  let initNotification;

  beforeEach(async () => {
    document.body.innerHTML = fs.readFileSync(
      path.resolve(__dirname, './mocks/body.html'),
      'utf8',
    );

    ({ getPartnershipData } = require('../../../eds/blocks/utils/partnershipDataService.js'));
    ({ default: initNotification } = require('/libs/blocks/notification/notification.js'));

    getPartnershipData.mockResolvedValue(makeApiData());

    ({ default: init } = await import('../../../eds/blocks/uplevel-banner/uplevel-banner.js'));
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('removes the element from the DOM immediately on init', () => {
    const el = document.querySelector('.uplevel-banner');
    init(el);
    expect(document.body.contains(el)).toBe(false);
  });

  it('re-inserts the element at its original DOM position', async () => {
    const el = document.querySelector('.uplevel-banner');
    const sibling = document.createElement('div');
    document.body.appendChild(sibling);

    await init(el);
    await flushPromises();

    expect(document.body.contains(el)).toBe(true);
    expect(el.nextElementSibling).toBe(sibling);
  });

  it('calls initNotification with the element', async () => {
    const el = document.querySelector('.uplevel-banner');
    await init(el);
    await flushPromises();
    expect(initNotification).toHaveBeenCalledWith(el);
  });

  it('does not re-insert when partner is not eligible', async () => {
    getPartnershipData.mockResolvedValue(makeApiData({ solutionPct: 0, technologyPct: 0 }));
    const el = document.querySelector('.uplevel-banner');
    await init(el);
    await flushPromises();
    expect(document.body.contains(el)).toBe(false);
  });

  it('does not re-insert when uplevel-banner metadata is set to none', async () => {
    const meta = document.createElement('meta');
    meta.name = 'uplevel-banner';
    meta.content = 'none';
    document.head.appendChild(meta);

    const el = document.querySelector('.uplevel-banner');
    await init(el);
    await flushPromises();
    expect(document.body.contains(el)).toBe(false);
  });

  it('replaces $eligibleLevel placeholder and leaves $accountName for personalization', async () => {
    const el = document.querySelector('.uplevel-banner');
    await init(el);
    await flushPromises();

    const text = el.querySelector('h3').textContent;
    expect(text).toContain('platinum');
    expect(text).not.toContain('$eligibleLevel');
    expect(text).toContain('$accountName');
  });

  it('logs an error when API call fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    getPartnershipData.mockRejectedValue(new Error('API error'));

    const el = document.querySelector('.uplevel-banner');
    await init(el);
    await flushPromises();

    expect(console.error).toHaveBeenCalledWith('[uplevel-banner] error', expect.any(Error));
  });
});
