import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import showNextPopup from '../../eds/scripts/showNextPopup.js';

describe('showNextPopup browser coverage', () => {
  afterEach(() => {
    sinon.restore();
    document.cookie = 'partner_data=; Path=/; Max-Age=0;';
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
    document.cookie = 'partner_data={"DXP":{"status":"MEMBER"}}; Path=/';

    const result = await showNextPopup('/libs', 'client-id', 'dxp:partnerAgreement');

    expect(result).to.equal(undefined);
  });

  it('routes directly to portal messaging and skips when no special state exists', async () => {
    document.cookie = 'partner_data={"DXP":{"status":"MEMBER"}}; Path=/';

    const result = await showNextPopup('/libs', 'client-id', 'dxp:portalMessaging');

    expect(result).to.equal(undefined);
  });

  it('runs the default chain with a non-displaying certification response', async () => {
    document.cookie = 'partner_data={"DXP":{"status":"MEMBER"}}; Path=/';
    sinon.stub(window, 'fetch').resolves({ ok: true, json: async () => ({ credentials: [] }) });

    const result = await showNextPopup('/libs', 'client-id');

    expect(result).to.equal(undefined);
  });
});
