import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../eds/scripts/utils.js';
import { getTargetLevel } from '../../../eds/blocks/uplevel-banner/uplevel-banner.js';

const miloLibs = setLibs('/libs');
const { setConfig } = await import(`${miloLibs}/utils/utils.js`);
setConfig({ codeRoot: '/eds', miloLibs, locales: { '': { ietf: 'en-US' } } });
const { default: init } = await import('../../../eds/blocks/uplevel-banner/uplevel-banner.js');

describe('uplevel-banner', () => {
  afterEach(() => {
    sinon.restore();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete window.adobeIMS;
  });

  it('maps completed silver and gold tracks to the next level', () => {
    const data = {
      level: 'Silver',
      solution: [{
        level: 'gold',
        credentials: { percentage: 100 },
        customerDeployments: { percentage: 100 },
        specializations: { percentage: 100 },
      }],
    };

    expect(getTargetLevel(data)).to.equal('gold');
  });

  it('returns null for incomplete or terminal levels', () => {
    expect(getTargetLevel({ level: 'Platinum' })).to.equal(null);
    expect(getTargetLevel({ level: 'Gold', solution: [] })).to.equal(null);
  });

  it('uses a fully completed technology track when the solution track is incomplete', () => {
    expect(getTargetLevel({
      level: 'Gold',
      solution: [{ level: 'platinum', credentials: { percentage: 0 } }],
      technology: [{
        level: 'platinum',
        credentials: { percentage: 100 },
        customerDeployments: { percentage: 100 },
        solutions: { percentage: 100 },
      }],
    })).to.equal('platinum');
  });

  it('returns null when both target tracks are incomplete or missing', () => {
    expect(getTargetLevel({ level: 'Silver', solution: [], technology: [] })).to.equal(null);
    expect(getTargetLevel({ level: 'Silver' })).to.equal(null);
  });

  it('removes the banner when metadata disables it', async () => {
    const meta = document.createElement('meta');
    meta.name = 'uplevel-banner';
    meta.content = 'NONE';
    document.head.appendChild(meta);
    const banner = document.createElement('div');
    banner.className = 'uplevel-banner';
    document.body.appendChild(banner);

    await init(banner);

    expect(banner.isConnected).to.equal(false);
  });

  it('logs an error when the partnership request has no IMS token', async () => {
    window.dxpImsReady = true;
    const banner = document.createElement('div');
    banner.className = 'uplevel-banner';
    document.body.appendChild(banner);
    const errorStub = sinon.stub(console, 'error');

    await init(banner);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errorStub.calledWith('[uplevel-banner] error', sinon.match.instanceOf(Error))).to.equal(true);
    delete window.dxpImsReady;
  });
});
