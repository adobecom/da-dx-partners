import { expect } from '@esm-bundle/chai';
import { handleRedirects } from '../../eds/scripts/partnerAgreement.js';

describe('partnerAgreement browser coverage', () => {
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
});
