import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../eds/scripts/utils.js';

const miloLibs = setLibs('/libs');
const { setConfig } = await import(`${miloLibs}/utils/utils.js`);
setConfig({ locales: { '': { ietf: 'en-US' } }, miloLibs });
const { default: init } = await import('../../../eds/blocks/partnership-progress/partnership-progress.js');

describe('partnership-progress', () => {
  it('replaces the authored block with a partnership-progress element', async () => {
    const section = document.createElement('div');
    section.setAttribute('data-idx', '0');
    const block = document.createElement('div');
    block.className = 'partnership-progress';
    section.appendChild(block);
    document.body.appendChild(section);

    const app = await init(block);

    expect(app.tagName.toLowerCase()).to.equal('partnership-progress');
    expect(app.getAttribute('data-idx')).to.equal('0');
    expect(app.className).to.equal('partnership-progress-block');
  });
});
