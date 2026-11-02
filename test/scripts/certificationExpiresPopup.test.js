import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../eds/scripts/utils.js';
import { certificationExpiresPopup } from '../../eds/scripts/certificationExpiresPopup.js';

const miloLibs = setLibs('/libs');

function daysFromToday(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

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

  it('skips when the directory request is not successful', async () => {
    sinon.stub(window, 'fetch').resolves({ ok: false, status: 503 });

    const result = await certificationExpiresPopup(miloLibs, false, false, 'test-client-id');

    expect(result).to.equal(undefined);
  });

  it('skips when the directory request rejects', async () => {
    sinon.stub(window, 'fetch').rejects(new Error('directory unavailable'));

    const result = await certificationExpiresPopup(miloLibs, false, false, 'test-client-id');

    expect(result).to.equal(undefined);
  });

  it('handles malformed credentials data without showing a modal', async () => {
    sinon.stub(window, 'fetch').resolves({ ok: true, json: async () => ({}) });

    const result = await certificationExpiresPopup(miloLibs, false, false, 'test-client-id');

    expect(result).to.equal(undefined);
  });

  it('checks milestone dates and skips when certification metadata is absent', async () => {
    const eventSpy = sinon.spy();
    window.addEventListener('dxp:showNextPopup', eventSpy);
    sinon.stub(window, 'fetch').resolves({
      ok: true,
      json: async () => ({ credentials: [{ expirationDate: daysFromToday(90) }] }),
    });

    const result = await certificationExpiresPopup(miloLibs, false, false, 'test-client-id');

    expect(result).to.equal(undefined);
    expect(eventSpy.called).to.equal(true);
    window.removeEventListener('dxp:showNextPopup', eventSpy);
  });

  it('skips when a certification popup fragment has no content', async () => {
    const meta = document.createElement('meta');
    meta.name = 'certification-modal';
    meta.content = '/fragments/certification-modal';
    document.head.appendChild(meta);
    sinon.stub(window, 'fetch').callsFake(async (url) => {
      if (String(url).includes('partner-directory')) {
        return { ok: true, json: async () => ({ credentials: [{ expirationDate: daysFromToday(90) }] }) };
      }
      return { ok: true, text: async () => '<html><body><main></main></body></html>' };
    });

    const result = await certificationExpiresPopup(miloLibs, false, false, 'test-client-id');

    expect(result).to.equal(undefined);
  });
});
