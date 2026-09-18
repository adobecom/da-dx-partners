import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { loadPopupFragment } from '../../eds/scripts/portalMessaging.js';

describe('portalMessaging browser coverage', () => {
  afterEach(() => sinon.restore());

  it('returns the first element from a popup fragment main', async () => {
    sinon.stub(window, 'fetch').resolves({
      ok: true,
      text: async () => '<html><body><main><div id="popup">Content</div></main></body></html>',
    });

    const result = await loadPopupFragment('/fragment.html', 'portal messaging');

    expect(result.id).to.equal('popup');
  });

  it('returns null when a fragment request fails', async () => {
    sinon.stub(window, 'fetch').resolves({ ok: false, status: 404 });

    expect(await loadPopupFragment('/missing.html')).to.equal(null);
  });
});
