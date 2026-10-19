import { expect } from '@esm-bundle/chai';

function getStyleHrefs() {
  return [...document.head.querySelectorAll('link[rel="stylesheet"]')].map((link) => link.getAttribute('href'));
}

function hasHrefEnding(hrefs, suffix) {
  return hrefs.some((href) => href?.endsWith(suffix));
}

async function importScripts() {
  await import(`../../eds/scripts/scripts.js?test=${Date.now()}-${Math.random()}`);
}

describe('scripts entry point', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('loads the project script entry point without a synchronous import error', async () => {
    let imported = true;
    try {
      document.body.innerHTML = '<main></main>';
      await importScripts();
    } catch (error) {
      imported = false;
    }
    expect(imported).to.equal(true);
  });

  it('loads the default Milo stylesheet for non-C2 pages', async () => {
    document.body.innerHTML = '<main></main>';

    await importScripts();

    const hrefs = getStyleHrefs();
    expect(hasHrefEnding(hrefs, '/libs/styles/styles.css')).to.equal(true);
    expect(hasHrefEnding(hrefs, '/eds/styles/styles.css')).to.equal(true);
    expect(hasHrefEnding(hrefs, '/libs/c2/styles/styles.css')).to.equal(false);
  });

  it('loads the C2 Milo stylesheet for C2 pages', async () => {
    document.head.innerHTML = '<meta name="foundation" content="c2">';
    document.body.innerHTML = '<main></main>';

    await importScripts();

    const hrefs = getStyleHrefs();
    expect(hasHrefEnding(hrefs, '/libs/c2/styles/styles.css')).to.equal(true);
    expect(hasHrefEnding(hrefs, '/eds/styles/styles.css')).to.equal(true);
    expect(hasHrefEnding(hrefs, '/libs/styles/styles.css')).to.equal(false);
  });
});
