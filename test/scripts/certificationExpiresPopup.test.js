import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../eds/scripts/utils.js';
import { certificationExpiresPopup } from '../../eds/scripts/certificationExpiresPopup.js';

const miloLibs = setLibs('/libs');

describe('certificationExpiresPopup browser coverage', () => {
  beforeEach(() => {
    window.dxpImsReady = true;
    window.adobeIMS = { getAccessToken: () => ({ token: 'test-token' }) };
    localStorage.removeItem('last-certification-popup-shown');
  });

  afterEach(() => {
    sinon.restore();
    delete window.dxpImsReady;
    delete window.adobeIMS;
    localStorage.removeItem('last-certification-popup-shown');
  });

  it('skips the certification popup when the partner agreement is displayed', async () => {
    const result = await certificationExpiresPopup(miloLibs, false, true, 'test-client-id');

    expect(result).to.equal(undefined);
  });

  it('skips the certification popup when portal messaging is open', async () => {
    const result = await certificationExpiresPopup(miloLibs, true, false, 'test-client-id');

    expect(result).to.equal(undefined);
  });

  it('parses API expiration dates in DD/MM/YYYY format', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 200);
    const date = `${String(future.getDate()).padStart(2, '0')}/${String(future.getMonth() + 1).padStart(2, '0')}/${future.getFullYear()}`;
    sinon.stub(window, 'fetch').resolves({
      ok: true,
      json: async () => ({ credentials: [{ expirationDate: date }] }),
    });

    const result = await certificationExpiresPopup(miloLibs, false, false, 'test-client-id');

    expect(result).to.equal(undefined);
  });

  it('parses stored YYYY-MM-DD dates and skips invalid expiration dates', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const storedDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    localStorage.setItem('last-certification-popup-shown', storedDate);
    sinon.stub(window, 'fetch').resolves({
      ok: true,
      json: async () => ({ credentials: [{ expirationDate: 'not-a-date' }] }),
    });

    const result = await certificationExpiresPopup(miloLibs, false, false, 'test-client-id');

    expect(result).to.equal(undefined);
  });
});
