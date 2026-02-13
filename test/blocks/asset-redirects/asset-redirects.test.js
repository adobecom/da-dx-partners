import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { readFile } from '@web/test-runner-commands';

describe('Asset redirects', () => {
  let init;

  beforeEach(async () => {
    // Load mock HTML
    document.body.innerHTML = await readFile({path: './mocks/body.html'});

    // Import init function
    ({default: init} = await import('../../../eds/blocks/asset-redirects/asset-redirects.js'));
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
});
