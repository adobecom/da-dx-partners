import { expect } from '@esm-bundle/chai';

describe('scripts entry point', () => {
  it('loads the project script entry point without a synchronous import error', async () => {
    let imported = true;
    try {
      await import('../../eds/scripts/scripts.js');
    } catch (error) {
      imported = false;
    }
    expect(imported).to.equal(true);
  });
});
