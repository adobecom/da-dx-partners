import { expect } from '@esm-bundle/chai';
import showNextPopup from '../../eds/scripts/showNextPopup.js';

describe('showNextPopup browser coverage', () => {
  it('does nothing for a signed-out visitor', async () => {
    document.cookie = 'partner_data=';

    const result = await showNextPopup('/libs', 'client-id');

    expect(result).to.equal(undefined);
  });
});
