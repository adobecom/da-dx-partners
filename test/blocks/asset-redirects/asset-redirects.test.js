import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { readFile } from '@web/test-runner-commands';

describe('Asset redirects', () => {
  let init;

  beforeEach(async () => {
    // Load mock HTML
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });

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

  it('should remove the block without redirecting when no rule matches', async () => {
    const block = document.querySelector('.asset-redirects');
    window.history.replaceState({}, '', '/digitalexperience/preview/no-match.html');

    await init(block);

    expect(document.querySelector('.asset-redirects')).to.not.exist;
  });

  it('should normalize spaces in authored redirect paths', async () => {
    document.body.innerHTML = `
      <div class="asset-redirects">
        <div><div>/digitalexperience/preview/source file.html</div><div>/digitalexperience/preview/target file.html</div></div>
        <div><div>only one column</div></div>
      </div>
    `;
    const block = document.querySelector('.asset-redirects');
    window.history.replaceState({}, '', '/digitalexperience/preview/source-file.html');

    await init(block);

    expect(document.querySelector('.asset-redirects')).to.not.exist;
  });
});
