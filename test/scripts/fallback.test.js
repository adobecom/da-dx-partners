import { expect } from '@esm-bundle/chai';

describe('fallback browser script', async () => {
  it('renders a localized browser warning banner', async () => {
    await import('../../eds/scripts/fallback.js');

    const banner = document.body.firstElementChild;
    expect(banner).to.exist;
    expect(banner.querySelector('span')).to.exist;
    expect(banner.querySelector('span').textContent.length).to.be.greaterThan(0);
    expect(banner.querySelector('span').lang).to.exist;
  });
});
