import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../eds/scripts/utils.js';

describe('feedback block', () => {
  let fetchStub;
  beforeEach(async () => {
    setLibs('/libs');
    fetchStub = sinon.stub(window, 'fetch').callsFake((url) => {
      if (url.includes('.plain.html')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '<div class="feedback"><div><div>Feedback-Definition</div><div>/feedback/feedback-definition.json</div></div></div>',
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () => '',
      });
    });
  });

  afterEach(() => {
    fetchStub.restore();
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    document.querySelectorAll('.feedback-dialog, .feedback-toast').forEach((el) => el.remove());
  });

  describe('metadata-based loading', () => {
    beforeEach(() => {
      const main = document.createElement('main');
      document.body.appendChild(main);
    });

    it('should load feedback fragment when metadata is true', async () => {
      const meta = document.createElement('meta');
      meta.name = 'feedback';
      meta.content = 'true';
      document.head.appendChild(meta);

      const { setFeedback } = await import('../../../eds/scripts/utils.js');
      const getConfig = () => ({ locale: { prefix: '' } });
      await setFeedback(getConfig);

      expect(fetchStub.calledOnce).to.be.true;
      const feedbackBlock = document.querySelector('.feedback');
      expect(feedbackBlock).to.exist;
    });

    it('should not load feedback when metadata is false or missing', async () => {
      const meta = document.createElement('meta');
      meta.name = 'feedback';
      meta.content = 'false';
      document.head.appendChild(meta);

      const { setFeedback } = await import('../../../eds/scripts/utils.js');
      const getConfig = () => ({ locale: { prefix: '' } });
      await setFeedback(getConfig);

      expect(fetchStub.called).to.be.false;
    });

    it('should load feedback with locale prefix', async () => {
      const meta = document.createElement('meta');
      meta.name = 'feedback';
      meta.content = 'true';
      document.head.appendChild(meta);

      const { setFeedback } = await import('../../../eds/scripts/utils.js');
      const getConfig = () => ({ locale: { prefix: '/de' } });
      await setFeedback(getConfig);

      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.firstCall.args[0]).to.include('/de/eds/partners-shared/fragments/feedback.plain.html');
    });

    it('should handle fetch errors gracefully', async () => {
      const meta = document.createElement('meta');
      meta.name = 'feedback';
      meta.content = 'true';
      document.head.appendChild(meta);

      fetchStub.restore();
      fetchStub = sinon.stub(window, 'fetch').resolves({
        ok: false,
        statusText: 'Not Found',
      });

      const { setFeedback } = await import('../../../eds/scripts/utils.js');
      const getConfig = () => ({ locale: { prefix: '' } });
      const result = await setFeedback(getConfig);

      expect(result).to.be.null;
    });
  });

  describe('block functionality', () => {
    beforeEach(async () => {
      document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    });

    it('should open dialog when button is clicked', async () => {
      const { default: init } = await import('../../../eds/blocks/feedback/feedback.js');
      const block = document.querySelector('.feedback');
      await init(block);

      const stickyButton = document.querySelector('.sticky-feedback-button');
      expect(stickyButton).to.exist;
      stickyButton.click();

      const dialog = document.querySelector('.feedback-dialog');
      expect(dialog).to.exist;
    });

    it('should handle star hover and textarea input', async () => {
      const { default: init } = await import('../../../eds/blocks/feedback/feedback.js');
      const block = document.querySelector('.feedback');
      await init(block);

      const stickyButton = document.querySelector('.sticky-feedback-button');
      stickyButton.click();

      const stars = document.querySelectorAll('sp-action-button[data-rating]');
      const mouseEnterEvent = new Event('mouseenter');
      const mouseLeaveEvent = new Event('mouseleave');

      stars[2].dispatchEvent(mouseEnterEvent);
      stars[2].dispatchEvent(mouseLeaveEvent);

      expect(stars[2]).to.exist;

      const textarea = document.querySelector('.feedback-textarea');
      const charCount = document.querySelector('.feedback-label-count');

      textarea.value = 'Test feedback';
      textarea.dispatchEvent(new Event('input'));

      expect(charCount.textContent).to.equal('487');
    });

    it('should close dialog and save rating when cancel is clicked or clicking outside', async () => {
      const { default: init } = await import('../../../eds/blocks/feedback/feedback.js');
      const block = document.querySelector('.feedback');
      await init(block);

      const stickyButton = document.querySelector('.sticky-feedback-button');
      stickyButton.click();

      const stars = document.querySelectorAll('sp-action-button[data-rating]');
      stars[2].click();

      const cancelButton = document.querySelector('.feedback-dialog-button.secondary-cta');
      cancelButton.click();

      expect(document.querySelector('.feedback-dialog')).to.not.exist;

      stickyButton.click();

      const selectedStars = document.querySelectorAll('sp-action-button[selected]');
      expect(selectedStars.length).to.equal(3);

      const dialog = document.querySelector('.feedback-dialog');
      dialog.click();

      expect(document.querySelector('.feedback-dialog')).to.not.exist;
    });

    it('should submit feedback successfully', async () => {
      const { default: init } = await import('../../../eds/blocks/feedback/feedback.js');
      const block = document.querySelector('.feedback');
      await init(block);

      const stickyButton = document.querySelector('.sticky-feedback-button');
      stickyButton.click();

      const stars = document.querySelectorAll('sp-action-button[data-rating]');
      stars[3].click();

      const sendButton = document.querySelector('.feedback-dialog-button.cta');
      sendButton.click();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(fetchStub.called).to.be.true;
      expect(document.querySelector('.feedback-dialog')).to.not.exist;
      const toast = document.querySelector('.feedback-toast.spectrum-Toast--positive');
      expect(toast).to.exist;
    });

    it('should show error toast on submission failure', async () => {
      fetchStub.restore();
      fetchStub = sinon.stub(window, 'fetch').rejects(new Error('Network error'));

      const { default: init } = await import('../../../eds/blocks/feedback/feedback.js');
      const block = document.querySelector('.feedback');
      await init(block);

      const stickyButton = document.querySelector('.sticky-feedback-button');
      stickyButton.click();

      const stars = document.querySelectorAll('sp-action-button[data-rating]');
      stars[3].click();

      const sendButton = document.querySelector('.feedback-dialog-button.cta');
      sendButton.click();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 50));

      const toast = document.querySelector('.feedback-toast.spectrum-Toast--negative');
      expect(toast).to.exist;
    });

    it('should handle try again button in error toast', async () => {
      fetchStub.restore();
      fetchStub = sinon.stub(window, 'fetch').rejects(new Error('Network error'));

      const { default: init } = await import('../../../eds/blocks/feedback/feedback.js');
      const block = document.querySelector('.feedback');
      await init(block);

      const stickyButton = document.querySelector('.sticky-feedback-button');
      stickyButton.click();

      const stars = document.querySelectorAll('sp-action-button[data-rating]');
      stars[3].click();

      const sendButton = document.querySelector('.feedback-dialog-button.cta');
      sendButton.click();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 50));

      const tryAgainBtn = document.querySelector('.feedback-try-again-cta');
      expect(tryAgainBtn).to.exist;
      tryAgainBtn.click();

      const dialog = document.querySelector('.feedback-dialog');
      expect(dialog).to.exist;
    });

    it('should auto-hide success toast after 5 seconds', async () => {
      const clock = sinon.useFakeTimers();
      const { default: init } = await import('../../../eds/blocks/feedback/feedback.js');
      const block = document.querySelector('.feedback');
      await init(block);

      const stickyButton = document.querySelector('.sticky-feedback-button');
      stickyButton.click();

      const stars = document.querySelectorAll('sp-action-button[data-rating]');
      stars[3].click();

      const sendButton = document.querySelector('.feedback-dialog-button.cta');
      sendButton.click();
      await clock.tickAsync(50);

      const toast = document.querySelector('.feedback-toast.spectrum-Toast--positive');
      expect(toast).to.exist;

      await clock.tickAsync(5000);
      expect(toast.classList.contains('feedback-toast-show')).to.be.false;

      await clock.tickAsync(300);
      expect(document.querySelector('.feedback-toast')).to.not.exist;

      clock.restore();
    });

    it('should handle submission failure with invalid response', async () => {
      fetchStub.restore();
      fetchStub = sinon.stub(window, 'fetch').callsFake((url) => {
        // Return error response to trigger error path
        if (url.includes('forms.adobe.com')) {
          return Promise.resolve({ ok: false, status: 500 });
        }
        return Promise.resolve({ ok: true, status: 200, text: async () => '' });
      });

      const { default: init } = await import('../../../eds/blocks/feedback/feedback.js');
      const block = document.querySelector('.feedback');
      await init(block);

      const stickyButton = document.querySelector('.sticky-feedback-button');
      stickyButton.click();

      const stars = document.querySelectorAll('sp-action-button[data-rating]');
      stars[3].click();

      const sendButton = document.querySelector('.feedback-dialog-button.cta');
      sendButton.click();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 50));

      const toast = document.querySelector('.feedback-toast.spectrum-Toast--negative');
      expect(toast).to.exist;
    });

    it('should close error toast when close button is clicked', async () => {
      fetchStub.restore();
      fetchStub = sinon.stub(window, 'fetch').rejects(new Error('Network error'));

      const { default: init } = await import('../../../eds/blocks/feedback/feedback.js');
      const block = document.querySelector('.feedback');
      await init(block);

      const stickyButton = document.querySelector('.sticky-feedback-button');
      stickyButton.click();

      const stars = document.querySelectorAll('sp-action-button[data-rating]');
      stars[3].click();

      const sendButton = document.querySelector('.feedback-dialog-button.cta');
      sendButton.click();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 50));

      const toast = document.querySelector('.feedback-toast.spectrum-Toast--negative');
      expect(toast).to.exist;

      const closeButton = document.querySelector('.feedback-toast-icon-close');
      closeButton.click();

      expect(document.querySelector('.feedback-toast')).to.not.exist;
    });

    it('should include user profile data when partner is signed in', async () => {
      const partnerData = {
        DXP: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          status: 'MEMBER',
        },
      };
      document.cookie = `partner_data=${encodeURIComponent(JSON.stringify(partnerData))}`;

      const { default: init } = await import('../../../eds/blocks/feedback/feedback.js');
      const block = document.querySelector('.feedback');
      await init(block);

      const stickyButton = document.querySelector('.sticky-feedback-button');
      stickyButton.click();

      const stars = document.querySelectorAll('sp-action-button[data-rating]');
      stars[3].click();

      const sendButton = document.querySelector('.feedback-dialog-button.cta');
      sendButton.click();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 50));

      const fetchCall = fetchStub.getCalls().find((call) => call.args[0].includes('forms.adobe.com'));
      expect(fetchCall).to.exist;
      const payload = JSON.parse(fetchCall.args[1].body);
      expect(payload.data.userName).to.equal('John Doe');
      expect(payload.data.userEmail).to.equal('john.doe@example.com');

      document.cookie = 'partner_data=; Path=/; Max-Age=0;';
    });

    it('should handle profile data parsing error when partner is signed in', async () => {
      document.cookie = 'partner_data=invalid-json-data';
      const consoleErrorStub = sinon.stub(console, 'error');
      const consoleInfoStub = sinon.stub(console, 'info');

      const { default: init } = await import('../../../eds/blocks/feedback/feedback.js');
      const block = document.querySelector('.feedback');
      await init(block);

      const stickyButton = document.querySelector('.sticky-feedback-button');
      stickyButton.click();

      const stars = document.querySelectorAll('sp-action-button[data-rating]');
      stars[3].click();

      const sendButton = document.querySelector('.feedback-dialog-button.cta');
      sendButton.click();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 50));

      const fetchCall = fetchStub.getCalls().find((call) => call.args[0].includes('forms.adobe.com'));
      expect(fetchCall).to.exist;
      const payload = JSON.parse(fetchCall.args[1].body);
      expect(payload.data.userName).to.equal('invalid');
      expect(payload.data.userEmail).to.equal('invalid');
      expect(consoleInfoStub.calledOnce).to.be.true;

      document.cookie = 'partner_data=; Path=/; Max-Age=0;';
      consoleErrorStub.restore();
      consoleInfoStub.restore();
    });

    it('should handle invalid URL in constructSubmitUrl', async () => {
      fetchStub.restore();
      fetchStub = sinon.stub(window, 'fetch').callsFake((url) => {
        if (url === null || url === 'null') {
          return Promise.reject(new Error('Invalid URL'));
        }
        return Promise.resolve({ ok: true, status: 200, text: async () => '' });
      });

      const feedbackModule = await import('../../../eds/blocks/feedback/feedback.js');
      const block = document.querySelector('.feedback');
      await feedbackModule.default(block);

      const stickyButton = document.querySelector('.sticky-feedback-button');
      stickyButton.click();

      const stars = document.querySelectorAll('sp-action-button[data-rating]');
      stars[3].click();
      
      const btoaStub = sinon.stub(window, 'btoa').throws(new Error('btoa error'));

      const sendButton = document.querySelector('.feedback-dialog-button.cta');
      sendButton.click();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 50));

      const toast = document.querySelector('.feedback-toast.spectrum-Toast--negative');
      expect(toast).to.exist;

      btoaStub.restore();
    });


    it('should render component when meta feedback is TRUE', async () => {
      const meta = document.createElement('meta');
      meta.name = 'feedback';
      meta.content = 'TRUE';
      document.head.appendChild(meta);

      const { default: init } = await import('../../../eds/blocks/feedback/feedback.js');
      const block = document.querySelector('.feedback');
      await init(block);

      const stickyButton = document.querySelector('.sticky-feedback-button');
      expect(stickyButton).to.exist;
    });

    it('should render component when meta feedback does not exist', async () => {
      const { default: init } = await import('../../../eds/blocks/feedback/feedback.js');
      const block = document.querySelector('.feedback');
      await init(block);

      const stickyButton = document.querySelector('.sticky-feedback-button');
      expect(stickyButton).to.exist;
    });
  });
});
