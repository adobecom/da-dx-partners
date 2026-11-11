import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../eds/scripts/utils.js';
import { updatePartnerUserState, refreshPartnerAccountState } from '../../eds/scripts/partnerStateUtils.js';

const { getConfig, setConfig, updateConfig } = await import(`${setLibs('/libs')}/utils/utils.js`);

describe('partnerStateUtils', () => {
  let originalConfig;

  beforeEach(() => {
    originalConfig = getConfig();
    setConfig({ env: { name: 'stage' } });
  });

  afterEach(() => {
    sinon.restore();
    updateConfig(originalConfig);
  });

  it('posts user state updates', async () => {
    const fetchStub = sinon.stub(window, 'fetch').resolves({ ok: true, status: 200, json: async () => ({ ok: true }) });
    document.cookie = 'partner_data={"DXP":{"email":"user@example.com"}}';
    window.history.replaceState({}, '', '/digitalexperience/');

    const result = await updatePartnerUserState({ status: 'active' });

    expect(result.success).to.equal(true);
    expect(fetchStub.calledOnce).to.equal(true);
    expect(fetchStub.firstCall.args[0].origin).to.equal('https://partners.stage.adobe.com');
    expect(fetchStub.firstCall.args[1].method).to.equal('POST');
  });

  it('handles refresh requests without state updates', async () => {
    sinon.stub(window, 'fetch').resolves({ ok: true, status: 200, json: async () => ({ refreshed: true }) });
    document.cookie = 'partner_data={"DXP":{"email":"user@example.com"}}';
    window.history.replaceState({}, '', '/digitalexperience/');

    const result = await refreshPartnerAccountState();

    expect(result.body).to.deep.equal({ refreshed: true });
  });
});
