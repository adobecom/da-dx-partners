import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../eds/scripts/utils.js';
import { handleRedirects } from '../../eds/scripts/partnerAgreement.js';

const miloLibs = setLibs('/libs');
const { setConfig } = await import(`${miloLibs}/utils/utils.js`);
setConfig({ codeRoot: '/eds', miloLibs, locales: { '': { ietf: 'en-US' } } });
const { partnerAgreement } = await import('../../eds/scripts/partnerAgreement.js');

describe('partnerAgreement browser coverage', () => {
  afterEach(() => {
    sinon.restore();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.cookie = 'partner_data=; Path=/; Max-Age=0;';
  });

  it('redirects only to an allowed domain', () => {
    const win = {
      location: {
        href: 'https://partners.stage.adobe.com/home',
        search: '?redirectUrl=https://allowed.example.com/next',
      },
    };

    handleRedirects('allowed.example.com', win);

    expect(win.location.href).to.equal('https://allowed.example.com/next');
  });

  it('ignores an invalid redirect URL', () => {
    const win = { location: { href: 'https://partners.stage.adobe.com/home', search: '?redirectUrl=invalid' } };

    handleRedirects('allowed.example.com', win);

    expect(win.location.href).to.equal('https://partners.stage.adobe.com/home');
  });

  it('ignores redirects without domains or a redirect parameter', () => {
    const win = { location: { href: '/home', search: '' } };

    handleRedirects('', win);
    handleRedirects('allowed.example.com', win);

    expect(win.location.href).to.equal('/home');
  });

  it('skips an agreement already accepted by the partner', async () => {
    document.cookie = 'partner_data={"DXP":{"latestagreementaccepted":"true"}}; Path=/';

    const result = await partnerAgreement(miloLibs);

    expect(result).to.equal(false);
  });

  it('skips when agreement metadata is not authored', async () => {
    const result = await partnerAgreement(miloLibs);

    expect(result).to.equal(false);
  });

  it('skips when agreement metadata cannot be fetched', async () => {
    const meta = document.createElement('meta');
    meta.name = 'partner-agreement-meta';
    meta.content = '/fragments/agreement-meta';
    document.head.appendChild(meta);
    sinon.stub(window, 'fetch').resolves({ ok: false, status: 404 });

    const result = await partnerAgreement(miloLibs);

    expect(result).to.equal(false);
  });

  it('skips when the agreement terms response is empty', async () => {
    const meta = document.createElement('meta');
    meta.name = 'partner-agreement-meta';
    meta.content = '/fragments/agreement-meta';
    document.head.appendChild(meta);
    sinon.stub(window, 'fetch').callsFake(async (url) => {
      if (String(url).includes('agreement-meta')) {
        return { ok: true, text: async () => '<html><head></head></html>' };
      }
      return { ok: true, json: async () => ({ terms: [] }) };
    });

    const result = await partnerAgreement(miloLibs);

    expect(result).to.equal(false);
  });

  it('skips when the agreement API returns a non-success response', async () => {
    const meta = document.createElement('meta');
    meta.name = 'partner-agreement-meta';
    meta.content = '/fragments/agreement-meta';
    document.head.appendChild(meta);
    sinon.stub(window, 'fetch').callsFake(async (url) => {
      if (String(url).includes('agreement-meta')) {
        return { ok: true, text: async () => '<html><head></head></html>' };
      }
      return { ok: false, status: 500 };
    });

    expect(await partnerAgreement(miloLibs)).to.equal(false);
  });

  it('skips when the agreement API request rejects', async () => {
    const meta = document.createElement('meta');
    meta.name = 'partner-agreement-meta';
    meta.content = '/fragments/agreement-meta';
    document.head.appendChild(meta);
    sinon.stub(window, 'fetch').callsFake(async (url) => {
      if (String(url).includes('agreement-meta')) {
        return { ok: true, text: async () => '<html><head></head></html>' };
      }
      throw new Error('agreement unavailable');
    });

    expect(await partnerAgreement(miloLibs)).to.equal(false);
  });

  it('renders a partner agreement modal from metadata and terms', async () => {
    const meta = document.createElement('meta');
    meta.name = 'partner-agreement-meta';
    meta.content = '/fragments/agreement-meta';
    document.head.appendChild(meta);
    sinon.stub(window, 'fetch').callsFake(async (url) => {
      if (String(url).includes('agreement-meta')) {
        return {
          ok: true,
          text: async () => '<html><head><meta name="agreementtitle" content="Agreement" /><meta name="agreementctalabel" content="Accept" /></head></html>',
        };
      }
      return { ok: true, json: async () => ({ terms: ['<p>Terms</p>'] }) };
    });

    const result = await partnerAgreement(miloLibs);

    expect(result).to.equal(true);
    expect(document.querySelector('.agreement-wrapper')).to.exist;
    expect(document.querySelector('.agreement-cta')).to.exist;
  });
});
