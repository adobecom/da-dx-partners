import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../eds/scripts/utils.js';

describe('text-with-submit block', () => {
  let fetchStub;

  beforeEach(async () => {
    setLibs('/libs');
    fetchStub = sinon.stub(window, 'fetch');
  });

  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
    document.querySelectorAll('.submit-toast').forEach((el) => el.remove());
  });

  describe('init', () => {
    beforeEach(async () => {
      document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    });

    it('should decorate block with correct classes and structure', async () => {
      const { default: init } = await import('../../../eds/blocks/text-with-submit/text-with-submit.js');
      const block = document.querySelector('.text-with-submit');
      block.classList.add('full-width');
      await init(block);

      // base classes
      expect(block.classList.contains('text-with-submit-block')).to.be.true;
      expect(block.classList.contains('con-block')).to.be.true;

      // foreground row
      expect(block.querySelector('.foreground')).to.exist;

      // action area wrapped in cta-container
      const ctaContainer = block.querySelector('.cta-container');
      expect(ctaContainer).to.exist;
      expect(ctaContainer.querySelector('.action-area')).to.exist;

      // full-width helper classes
      expect(block.classList.contains('max-width-8-desktop')).to.be.true;
      expect(block.classList.contains('center')).to.be.true;
      expect(block.classList.contains('xxl-spacing')).to.be.true;
    });

    it('should add has-bg class when first row has text content', async () => {
      const { default: init } = await import('../../../eds/blocks/text-with-submit/text-with-submit.js');

      const block = document.createElement('div');
      block.className = 'text-with-submit';
      const bgRow = document.createElement('div');
      bgRow.textContent = 'background content';
      const contentRow = document.createElement('div');
      contentRow.innerHTML = '<div><h2>Title</h2></div>';
      block.appendChild(bgRow);
      block.appendChild(contentRow);
      document.body.appendChild(block);

      await init(block);
      expect(block.classList.contains('has-bg')).to.be.true;
    });

    it('should not add has-bg class when first row is empty', async () => {
      const { default: init } = await import('../../../eds/blocks/text-with-submit/text-with-submit.js');

      const block = document.createElement('div');
      block.className = 'text-with-submit';
      const bgRow = document.createElement('div');
      const contentRow = document.createElement('div');
      contentRow.innerHTML = '<div><h2>Title</h2></div>';
      block.appendChild(bgRow);
      block.appendChild(contentRow);
      document.body.appendChild(block);

      await init(block);
      expect(block.classList.contains('has-bg')).to.be.false;
    });
  });

  describe('decorateMultiViewport', () => {
    it('should assign correct viewport classes to 2 children', async () => {
      const { default: init } = await import('../../../eds/blocks/text-with-submit/text-with-submit.js');

      const block = document.createElement('div');
      block.className = 'text-with-submit';
      const row = document.createElement('div');
      row.innerHTML = '<div>Mobile content</div><div>Tablet/Desktop content</div>';
      block.appendChild(row);
      document.body.appendChild(block);

      await init(block);

      const [child1, child2] = row.children;
      expect(child1.className).to.equal('mobile-up');
      expect(child2.className).to.equal('tablet-up desktop-up');
    });

    it('should assign correct viewport classes to 3 children', async () => {
      const { default: init } = await import('../../../eds/blocks/text-with-submit/text-with-submit.js');

      const block = document.createElement('div');
      block.className = 'text-with-submit';
      const row = document.createElement('div');
      row.innerHTML = '<div>Mobile</div><div>Tablet</div><div>Desktop</div>';
      block.appendChild(row);
      document.body.appendChild(block);

      await init(block);

      const [c1, c2, c3] = row.children;
      expect(c1.className).to.equal('mobile-up');
      expect(c2.className).to.equal('tablet-up');
      expect(c3.className).to.equal('desktop-up');
    });
  });

  describe('handleClick', () => {
    beforeEach(async () => {
      document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    });

    it('should show positive toast on successful API response', async () => {
      fetchStub.resolves({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { default: init } = await import('../../../eds/blocks/text-with-submit/text-with-submit.js');
      const block = document.querySelector('.text-with-submit');
      await init(block);

      const submitLink = block.querySelector('.action-area a');
      submitLink.click();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 50));

      const toast = document.querySelector('.submit-toast.spectrum-Toast--positive');
      expect(toast).to.exist;
    });

    it('should show negative toast when API returns success=false', async () => {
      fetchStub.resolves({
        ok: true,
        json: async () => ({ success: false }),
      });

      const { default: init } = await import('../../../eds/blocks/text-with-submit/text-with-submit.js');
      const block = document.querySelector('.text-with-submit');
      await init(block);

      const submitLink = block.querySelector('.action-area a');
      submitLink.click();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 50));

      const toast = document.querySelector('.submit-toast.spectrum-Toast--negative');
      expect(toast).to.exist;
    });

    it('should show negative toast when fetch returns non-ok response', async () => {
      fetchStub.resolves({ ok: false, status: 500 });

      const { default: init } = await import('../../../eds/blocks/text-with-submit/text-with-submit.js');
      const block = document.querySelector('.text-with-submit');
      await init(block);

      const submitLink = block.querySelector('.action-area a');
      submitLink.click();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 50));

      const toast = document.querySelector('.submit-toast.spectrum-Toast--negative');
      expect(toast).to.exist;
    });

    it('should show negative toast on network error', async () => {
      fetchStub.rejects(new Error('Network error'));

      const { default: init } = await import('../../../eds/blocks/text-with-submit/text-with-submit.js');
      const block = document.querySelector('.text-with-submit');
      await init(block);

      const submitLink = block.querySelector('.action-area a');
      submitLink.click();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 50));

      const toast = document.querySelector('.submit-toast.spectrum-Toast--negative');
      expect(toast).to.exist;
    });

    it('should not trigger fetch when link has no submit param', async () => {
      const { default: init } = await import('../../../eds/blocks/text-with-submit/text-with-submit.js');
      const block = document.querySelector('.text-with-submit');
      await init(block);

      const normalLink = block.querySelectorAll('.action-area a')[1];
      // Prevent page navigation while verifying no fetch is triggered
      normalLink.addEventListener('click', (e) => e.preventDefault(), { once: true });
      normalLink.click();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(fetchStub.called).to.be.false;
    });
  });
});
