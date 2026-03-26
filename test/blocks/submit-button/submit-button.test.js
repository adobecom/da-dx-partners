import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../eds/scripts/utils.js';

describe('submit-button block', () => {
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
      const { default: init } = await import('../../../eds/blocks/submit-button/submit-button.js');
      const block = document.querySelector('.submit-button');
      await init(block);

      expect(block.classList.contains('submit-button-block')).to.be.true;
      expect(block.classList.contains('con-block')).to.be.true;

      const foreground = block.querySelector('.foreground');
      expect(foreground).to.exist;

      const link = block.querySelector('.con-button');
      expect(link).to.exist;
    });

    it('should remove block if no link', async () => {
      const { default: init } = await import('../../../eds/blocks/submit-button/submit-button.js');
      const block = document.createElement('div');
      block.className = 'submit-button';
      document.body.appendChild(block);

      await init(block);
      expect(document.body.contains(block)).to.be.false;
    });
  });

  describe('handleClick', () => {
    beforeEach(async () => {
      document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    });

    // Helper function to reduce duplication
    async function triggerSubmitAndGetToast(variant = 'negative') {
      const { default: init } = await import('../../../eds/blocks/submit-button/submit-button.js');
      const block = document.querySelector('.submit-button');
      await init(block);

      const link = block.querySelector('a');
      link.click();

      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 50));

      return document.querySelector(`.submit-toast.spectrum-Toast--${variant}`);
    }

    it('should show positive toast on successful API response', async () => {
      fetchStub.resolves({ ok: true, json: async () => ({ success: true }) });

      const toast = await triggerSubmitAndGetToast('positive');
      expect(toast).to.exist;
    });

    it('should show negative toast on success=false', async () => {
      fetchStub.resolves({ ok: true, json: async () => ({ success: false }) });

      const toast = await triggerSubmitAndGetToast();
      expect(toast).to.exist;
    });

    it('should show negative toast on non-ok response', async () => {
      fetchStub.resolves({ ok: false, status: 500 });

      const toast = await triggerSubmitAndGetToast();
      expect(toast).to.exist;
    });

    it('should show negative toast on network error', async () => {
      fetchStub.rejects(new Error('Network error'));

      const toast = await triggerSubmitAndGetToast();
      expect(toast).to.exist;
    });
  });
});
