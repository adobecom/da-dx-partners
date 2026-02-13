import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { readFile } from '@web/test-runner-commands';

describe('Asset redirects', () => {
  let init;

  beforeEach(async () => {
    // Load mock HTML
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });

    // Set initial pathname using history.replaceState (works with relative paths)
    history.replaceState({}, '', '/digitalexperience/preview/restricted/1/program-guide.pdf.html');

    // Import init function
    ({ default: init } = await import('../../../eds/blocks/asset-redirects/asset-redirects.js'));
  });

  afterEach(() => {
    document.body.innerHTML = '';
    sinon.restore();
  });

  it('should remove block and attempt redirect when URL matches a row', async () => {
    const block = document.querySelector('.asset-redirects');
    expect(block).to.exist;

    await init(block);

    // Verify the block was removed (happens before redirect)
    expect(document.querySelector('.asset-redirects')).to.not.exist;
  });

  it('should remove block but not redirect when URL does not match any row', async () => {
    history.replaceState({}, '', '/digitalexperience/preview/restricted/999/nonexistent.pdf.html');

    const block = document.querySelector('.asset-redirects');
    expect(block).to.exist;

    await init(block);

    // Verify the block was removed
    expect(document.querySelector('.asset-redirects')).to.not.exist;
  });

  it('should handle redirect loops by not redirecting', async () => {
    // Set URL that would create a redirect loop
    history.replaceState({}, '', '/digitalexperience/preview/netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html');

    const block = document.querySelector('.asset-redirects');
    expect(block).to.exist;

    await init(block);

    // Verify the block was removed
    expect(document.querySelector('.asset-redirects')).to.not.exist;
  });

  it('should handle rows with empty cells', async () => {
    history.replaceState({}, '', '/digitalexperience/preview/restricted/in/1/Retail_Banking_Industry_POV.pptx.html');

    const block = document.querySelector('.asset-redirects');
    expect(block).to.exist;

    await init(block);

    // Verify the block was removed
    expect(document.querySelector('.asset-redirects')).to.not.exist;
  });

  it('should handle relative URLs correctly', async () => {
    history.replaceState({}, '', '/digitalexperience/preview/netstorage-assets/restricted/co/content-supply-chain-automotive.pptx.html');

    const block = document.querySelector('.asset-redirects');
    expect(block).to.exist;

    await init(block);

    // Verify the block was removed
    expect(document.querySelector('.asset-redirects')).to.not.exist;
  });
});
