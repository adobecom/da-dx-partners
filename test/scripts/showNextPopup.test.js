import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import showNextPopup from '../../eds/scripts/showNextPopup.js';

describe('showNextPopup browser coverage', () => {
  beforeEach(() => {
    let cookie = '';
    sinon.stub(document, 'cookie').get(() => cookie).set((value) => { cookie = value; });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('does nothing for a signed-out visitor', async () => {
    document.cookie = 'partner_data=';

    const result = await showNextPopup('/libs', 'client-id');

    expect(result).to.equal(undefined);
  });

  it('skips all handlers for an unknown popup type', async () => {
    document.cookie = 'partner_data={"DXP":{"status":"MEMBER"}}; Path=/';

    const result = await showNextPopup('/libs', 'client-id', 'unknown-popup');

    expect(result).to.equal(undefined);
  });

  it('routes directly to the partner agreement popup', async () => {
    const consoleWarnStub = sinon.stub(console, 'warn');
    document.cookie = 'partner_data={"DXP":{"status":"MEMBER"}}; Path=/';

    const result = await showNextPopup('/libs', 'client-id', 'dxp:partnerAgreement');

    expect(result).to.equal(undefined);
    expect(consoleWarnStub.calledOnceWithExactly('Partner agreement should be displayed but partner agreement meta path is not authored')).to.be.true;
  });

  it('routes directly to portal messaging and skips when no special state exists', async () => {
    document.cookie = 'partner_data={"DXP":{"status":"MEMBER"}}; Path=/';

    const result = await showNextPopup('/libs', 'client-id', 'dxp:portalMessaging');

    expect(result).to.equal(undefined);
  });

  it('runs the default chain with a non-displaying certification response', async () => {
    const consoleWarnStub = sinon.stub(console, 'warn');
    document.cookie = 'partner_data={"DXP":{"status":"MEMBER"}}; Path=/';
    sinon.stub(window, 'fetch').resolves({ ok: true, json: async () => ({ credentials: [] }) });

    const result = await showNextPopup('/libs', 'client-id');

    expect(result).to.equal(undefined);
    expect(consoleWarnStub.calledOnceWithExactly('Partner agreement should be displayed but partner agreement meta path is not authored')).to.be.true;
  });
});
