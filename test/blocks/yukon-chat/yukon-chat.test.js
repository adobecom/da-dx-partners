import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { readFile } from '@web/test-runner-commands';
import { setLibs } from '../../../eds/scripts/utils.js';
import { createMockYukonMultiSourceResponse } from './mocks/multi-source-stream.js';

describe('yukon-chat block', () => {
  let fetchStub;
  let init;

  beforeEach(async () => {
    setLibs('/libs');
    window.requestAnimationFrame = sinon.stub().callsFake((cb) => {
      setTimeout(cb, 0);
      return 1;
    });

    if (!window.crypto) window.crypto = {};
    window.crypto.randomUUID = sinon.stub().returns('test-uuid-12345');

    fetchStub = sinon.stub(window, 'fetch');

    fetchStub.callsFake(async (url) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('placeholders.json')) {
        return {
          ok: true,
          json: async () => ({
            data: [
              { key: 'send-message', value: 'Send Message' },
              { key: 'open-chat', value: 'Open Chat' },
              { key: 'scroll-to-bottom', value: 'Scroll to bottom' },
              { key: 'timeout-error', value: 'This is taking longer than expected. Please try again in a moment.' },
              { key: 'server-error', value: 'We’re having trouble processing your request right now. Please try again later.' },
              { key: 'network-error', value: 'Network error. Please check your connection and try again.' },
            ],
          }),
        };
      }
      return { ok: false, status: 404 };
    });

    document.body.innerHTML = await readFile({ path: './mocks/body.html' });

    ({ default: init } = await import('../../../eds/blocks/yukon-chat/yukon-chat.js'));
  });

  afterEach(() => {
    if (fetchStub) fetchStub.restore();
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    sinon.restore();
  });

  describe('Block initialization and rendering', () => {
    it('should render the standard yukon-chat block with all components', async () => {
      const block = document.querySelector('.yukon-chat');
      await init(block);

      const chatBlock = document.querySelector('.yukon-chat-block');
      expect(chatBlock).to.exist;

      const header = chatBlock.querySelector('.yc-block-header');
      expect(header).to.exist;
      expect(header.textContent).to.include('Ask Yukon AI');

      const textarea = chatBlock.querySelector('#yc-input-field');
      expect(textarea).to.exist;
      expect(textarea.getAttribute('placeholder')).to.equal('How can I help you today?');

      const tooltip = chatBlock.querySelector('#yc-label-tooltip');
      expect(tooltip).to.exist;
      expect(tooltip.textContent).to.equal('Ask AI');

      const sendButton = chatBlock.querySelector('.yc-input-field-button');
      expect(sendButton).to.exist;
      expect(sendButton.hasAttribute('disabled')).to.be.true;
    });

    it('should extract and apply authored configurations correctly', async () => {
      const block = document.querySelector('.yukon-chat');
      await init(block);

      const chatBlock = document.querySelector('.yukon-chat-block');
      const header = chatBlock.querySelector('.yc-block-header');
      const textarea = chatBlock.querySelector('#yc-input-field');
      const tooltip = chatBlock.querySelector('#yc-label-tooltip');

      expect(header.textContent).to.equal('Ask Yukon AI');
      expect(textarea.getAttribute('placeholder')).to.equal('How can I help you today?');
      expect(tooltip.textContent).to.equal('Ask AI');
    });
  });

  describe('Input field interactions', () => {
    it('should enable send button when text is entered', async () => {
      const block = document.querySelector('.yukon-chat');
      await init(block);

      const textarea = document.querySelector('#yc-input-field');
      const sendButton = document.querySelector('.yc-input-field-button');

      expect(sendButton.hasAttribute('disabled')).to.be.true;

      textarea.value = 'Hello Yukon';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      expect(sendButton.hasAttribute('disabled')).to.be.false;
    });

    it('should disable send button when text is cleared', async () => {
      const block = document.querySelector('.yukon-chat');
      await init(block);

      const textarea = document.querySelector('#yc-input-field');
      const sendButton = document.querySelector('.yc-input-field-button');

      textarea.value = 'Hello';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      expect(sendButton.hasAttribute('disabled')).to.be.false;

      textarea.value = '';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      expect(sendButton.hasAttribute('disabled')).to.be.true;
    });

    it('should disable send button with only whitespace', async () => {
      const block = document.querySelector('.yukon-chat');
      await init(block);

      const textarea = document.querySelector('#yc-input-field');
      const sendButton = document.querySelector('.yc-input-field-button');

      textarea.value = '   ';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      expect(sendButton.hasAttribute('disabled')).to.be.true;
    });

    it('should not submit on Shift+Enter', async () => {
      const block = document.querySelector('.yukon-chat');
      await init(block);

      const textarea = document.querySelector('#yc-input-field');
      textarea.value = 'Test question';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      const shiftEnterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: true,
        bubbles: true,
      });

      textarea.dispatchEvent(shiftEnterEvent);
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(fetchStub.called).to.be.false;
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const block = document.querySelector('.yukon-chat');
      await init(block);

      const sendButton = document.querySelector('.yc-input-field-button');
      expect(sendButton.getAttribute('aria-label')).to.equal('Send Message');

      const label = document.querySelector('.yc-input-field-label');
      expect(label.getAttribute('aria-describedby')).to.equal('yc-label-tooltip');

      const tooltip = document.querySelector('#yc-label-tooltip');
      expect(tooltip.getAttribute('role')).to.equal('tooltip');
    });

    it('should have focusable elements', async () => {
      const block = document.querySelector('.yukon-chat');
      await init(block);

      const textarea = document.querySelector('#yc-input-field');
      const sendButton = document.querySelector('.yc-input-field-button');
      const label = document.querySelector('.yc-input-field-label');

      expect(textarea).to.exist;
      expect(sendButton).to.exist;
      expect(label.getAttribute('tabindex')).to.equal('0');
    });
  });

  describe('Edge cases', () => {
    it('should not send empty messages', async () => {
      const block = document.querySelector('.yukon-chat');
      await init(block);

      const textarea = document.querySelector('#yc-input-field');
      const sendButton = document.querySelector('.yc-input-field-button');

      textarea.value = '';
      sendButton.click();

      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(fetchStub.called).to.be.false;
    });
  });

  describe('Send flow', () => {
    it('should open modal, call fetch, and render AI response', async () => {
      const encoder = new TextEncoder();
      const chunk = encoder.encode('[{"generated_text":"Hello from Yukon"}]\n');

      fetchStub.callsFake(async (url) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.includes('placeholders.json')) {
          return {
            ok: true,
            json: async () => ({
              data: [
                { key: 'send-message', value: 'Send Message' },
                { key: 'open-chat', value: 'Open Chat' },
                { key: 'scroll-to-bottom', value: 'Scroll to bottom' },
                { key: 'timeout-error', value: 'This is taking longer than expected. Please try again in a moment.' },
                { key: 'server-error', value: 'We’re having trouble processing your request right now. Please try again later.' },
                { key: 'network-error', value: 'Network error. Please check your connection and try again.' },
              ],
            }),
          };
        }
        if (urlStr.includes('yukonAIAssistant')) {
          return {
            ok: true,
            status: 200,
            body: new ReadableStream({
              start(controller) {
                controller.enqueue(chunk);
                controller.close();
              },
            }),
          };
        }
        return { ok: false, status: 404 };
      });

      const block = document.querySelector('.yukon-chat');
      await init(block);

      const textarea = document.querySelector('#yc-input-field');
      const sendButton = document.querySelector('.yc-input-field-button');

      textarea.value = 'What is Yukon?';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      expect(sendButton.hasAttribute('disabled')).to.be.false;

      sendButton.click();

      // eslint-disable-next-line no-promise-executor-return
      await new Promise((r) => setTimeout(r, 50));

      const modal = document.querySelector('#yukon-chat-modal');
      expect(fetchStub.called).to.be.true;

      const calledUrl = fetchStub.getCalls().find((call) => {
        const url = call.args[0];
        const urlStr = url?.toString?.() ?? String(url);
        return urlStr.includes('yukonAIAssistant');
      })?.args[0];
      expect(calledUrl).to.exist;
      const urlStr = calledUrl?.toString?.() ?? String(calledUrl);

      expect(urlStr).to.include('/services/gravity/yukonAIAssistant');
      expect(urlStr).to.include('question=');
      expect(urlStr).to.include('requestId=');
      expect(urlStr).to.include('yukonProfile=');

      expect(modal.textContent).to.include('What is Yukon?');
      expect(modal.textContent).to.include('Hello from Yukon');
    });

    it('should render an error message when fetch returns non-ok', async () => {
      fetchStub.callsFake(async (url) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.includes('placeholders.json')) {
          return {
            ok: true,
            json: async () => ({
              data: [
                { key: 'send-message', value: 'Send Message' },
                { key: 'open-chat', value: 'Open Chat' },
                { key: 'scroll-to-bottom', value: 'Scroll to bottom' },
              ],
            }),
          };
        }
        if (urlStr.includes('yukonAIAssistant')) {
          return {
            ok: false,
            status: 500,
          };
        }
        return { ok: false, status: 404 };
      });

      const block = document.querySelector('.yukon-chat');
      await init(block);

      const textarea = document.querySelector('#yc-input-field');
      const sendButton = document.querySelector('.yc-input-field-button');

      textarea.value = 'Trigger error';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      expect(sendButton.hasAttribute('disabled')).to.be.false;

      sendButton.click();

      // eslint-disable-next-line no-promise-executor-return
      await new Promise((r) => setTimeout(r, 50));
      const modal = document.querySelector('#yukon-chat-modal');
      expect(modal).to.exist;
      const yukonFetchCalled = fetchStub.getCalls().some((call) => {
        const url = call.args[0];
        const urlStr = url?.toString?.() ?? String(url);
        return urlStr.includes('yukonAIAssistant');
      });
      expect(yukonFetchCalled).to.be.true;
      const errorMessage = modal.querySelector('.error-message');
      expect(errorMessage).to.exist;
      expect(errorMessage.textContent).to.include('We’re having trouble processing your request right now. Please try again later');
    });

    it('should handle network errors (TypeError) and re-enable button', async () => {
      const block = document.querySelector('.yukon-chat');
      await init(block);

      const textarea = document.querySelector('#yc-input-field');
      const sendButton = document.querySelector('.yc-input-field-button');

      fetchStub.callsFake(async (url) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.includes('placeholders.json')) {
          return {
            ok: true,
            json: async () => ({
              data: [
                { key: 'send-message', value: 'Send Message' },
                { key: 'open-chat', value: 'Open Chat' },
                { key: 'scroll-to-bottom', value: 'Scroll to bottom' },
              ],
            }),
          };
        }
        if (urlStr.includes('yukonAIAssistant')) {
          throw new TypeError('Failed to fetch');
        }
        return { ok: true, status: 200 };
      });

      textarea.value = 'Test network error';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      expect(sendButton.hasAttribute('disabled')).to.be.false;
      sendButton.click();

      // eslint-disable-next-line no-promise-executor-return
      await new Promise((r) => setTimeout(r, 50));

      const modal = document.querySelector('#yukon-chat-modal');
      expect(modal).to.exist;

      const errorMessage = modal.querySelector('.error-message');
      expect(errorMessage).to.exist;
      expect(errorMessage.textContent).to.include('Network error. Please check your connection and try again.');

      expect(sendButton.hasAttribute('disabled')).to.be.false;
      expect(textarea.hasAttribute('disabled')).to.be.false;
    });

    it('should handle server errors and re-enable button', async () => {
      const block = document.querySelector('.yukon-chat');
      await init(block);

      const textarea = document.querySelector('#yc-input-field');
      const sendButton = document.querySelector('.yc-input-field-button');

      fetchStub.callsFake(async (url) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.includes('placeholders.json')) {
          return {
            ok: true,
            json: async () => ({
              data: [
                { key: 'send-message', value: 'Send Message' },
                { key: 'open-chat', value: 'Open Chat' },
                { key: 'scroll-to-bottom', value: 'Scroll to bottom' },
              ],
            }),
          };
        }
        if (urlStr.includes('yukonAIAssistant')) {
          throw new Error('Some server error');
        }
        return { ok: true, status: 200 };
      });

      textarea.value = 'Test general error';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      expect(sendButton.hasAttribute('disabled')).to.be.false;

      sendButton.click();

      // eslint-disable-next-line no-promise-executor-return
      await new Promise((r) => setTimeout(r, 50));

      const modal = document.querySelector('#yukon-chat-modal');
      expect(modal).to.exist;

      const errorMessage = modal.querySelector('.error-message');
      expect(errorMessage).to.exist;
      expect(errorMessage.textContent).to.include('We’re having trouble processing your request right now. Please try again later');

      expect(sendButton.hasAttribute('disabled')).to.be.false;
      expect(textarea.hasAttribute('disabled')).to.be.false;
    });
    it('should handle HTML error responses and show error message', async () => {
      const encoder = new TextEncoder();
      const htmlChunk = encoder.encode('<!DOCTYPE html><html><head><title>Error</title></head><body>Server Error</body></html>\n');

      fetchStub.callsFake(async (url) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.includes('placeholders.json')) {
          return {
            ok: true,
            json: async () => ({
              data: [
                { key: 'send-message', value: 'Send Message' },
                { key: 'open-chat', value: 'Open Chat' },
                { key: 'scroll-to-bottom', value: 'Scroll to bottom' },
                { key: 'timeout-error', value: 'This is taking longer than expected. Please try again in a moment.' },
                { key: 'server-error', value: 'We’re having trouble processing your request right now. Please try again later.' },
                { key: 'network-error', value: 'Network error. Please check your connection and try again.' },
              ],
            }),
          };
        }
        if (urlStr.includes('yukonAIAssistant')) {
          return {
            ok: true,
            status: 200,
            body: new ReadableStream({
              start(controller) {
                controller.enqueue(htmlChunk);
                controller.close();
              },
            }),
          };
        }
        return { ok: false, status: 404 };
      });

      const block = document.querySelector('.yukon-chat');
      await init(block);

      const textarea = document.querySelector('#yc-input-field');
      const sendButton = document.querySelector('.yc-input-field-button');

      textarea.value = 'Test HTML error';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      expect(sendButton.hasAttribute('disabled')).to.be.false;

      sendButton.click();

      // eslint-disable-next-line no-promise-executor-return
      await new Promise((r) => setTimeout(r, 100));

      const modal = document.querySelector('#yukon-chat-modal');
      expect(modal).to.exist;

      const loadingMessage = modal.querySelector('.chat-loader');
      expect(loadingMessage).to.not.exist;

      const errorMessage = modal.querySelector('.error-message');
      expect(errorMessage).to.exist;
      expect(errorMessage.textContent).to.include(
        'We’re having trouble processing your request right now. Please try again later',
      );

      expect(sendButton.hasAttribute('disabled')).to.be.false;
      expect(textarea.hasAttribute('disabled')).to.be.false;
    });
    it('should render multiple links with target="_blank" in AI responses', async () => {
      const encoder = new TextEncoder();
      const responseWithLinks = 'Visit [Adobe](https://adobe.com) and [Partners Portal](https://partners.adobe.com).';
      const chunk = encoder.encode(`[{"generated_text":"${responseWithLinks}"}]\n`);

      fetchStub.callsFake(async () => ({
        ok: true,
        status: 200,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(chunk);
            controller.close();
          },
        }),
      }));

      const block = document.querySelector('.yukon-chat');
      await init(block);

      const textarea = document.querySelector('#yc-input-field');
      const sendButton = document.querySelector('.yc-input-field-button');

      textarea.value = 'Show me links';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      sendButton.click();

      // eslint-disable-next-line no-promise-executor-return
      await new Promise((r) => setTimeout(r, 100));

      const modal = document.querySelector('#yukon-chat-modal');
      expect(modal).to.exist;

      const yukonMessage = modal.querySelector('.yukon-message .message-text');
      expect(yukonMessage).to.exist;

      // check all links have target="_blank"
      const links = yukonMessage.querySelectorAll('a');
      expect(links.length).to.equal(2);

      links.forEach((link) => {
        expect(link.getAttribute('target')).to.equal('_blank');
      });
    });

    it('should collapse adjacent duplicate citations in AI responses', async () => {
      const encoder = new TextEncoder();
      const responseWithDuplicateCitations = 'TD Synnex is a distributor [^1][^1][^1] in France [^2] and Japan [^3][^3].';
      const chunk = encoder.encode(`[{"generated_text":"${responseWithDuplicateCitations}"}]\n`);

      fetchStub.callsFake(async () => ({
        ok: true,
        status: 200,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(chunk);
            controller.close();
          },
        }),
      }));

      const block = document.querySelector('.yukon-chat');
      await init(block);

      const textarea = document.querySelector('#yc-input-field');
      const sendButton = document.querySelector('.yc-input-field-button');

      textarea.value = 'Tell me about TD Synnex';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      sendButton.click();

      // eslint-disable-next-line no-promise-executor-return
      await new Promise((r) => setTimeout(r, 100));

      const yukonMessage = document.querySelector('#yukon-chat-modal .yukon-message .message-text');
      expect(yukonMessage).to.exist;
      expect(yukonMessage.textContent).to.include('TD Synnex is a distributor  in France  and Japan .');
      expect(yukonMessage.textContent).to.not.include('[1][1]');
      expect(yukonMessage.textContent).to.not.include('[3][3]');
    });

    it('should remove citations and everything after them from AI responses', async () => {
      const encoder = new TextEncoder();
      const responseWithCitations = 'Here is the answer.\\n\\n### Citations:\\n* [1] https://example.com\\n* [2] https://adobe.com';
      const chunk = encoder.encode(`[{"generated_text":"${responseWithCitations}"}]\n`);

      fetchStub.callsFake(async (url) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.includes('placeholders.json')) {
          return {
            ok: true,
            json: async () => ({
              data: [
                { key: 'send-message', value: 'Send Message' },
                { key: 'open-chat', value: 'Open Chat' },
              ],
            }),
          };
        }
        return {
          ok: true,
          status: 200,
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(chunk);
              controller.close();
            },
          }),
        };
      });

      const block = document.querySelector('.yukon-chat');
      await init(block);

      const textarea = document.querySelector('#yc-input-field');
      const sendButton = document.querySelector('.yc-input-field-button');

      textarea.value = 'What is the answer?';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      sendButton.click();

      // eslint-disable-next-line no-promise-executor-return
      await new Promise((r) => setTimeout(r, 100));

      const modal = document.querySelector('#yukon-chat-modal');
      expect(modal).to.exist;

      const yukonMessage = modal.querySelector('.yukon-message .message-text');
      expect(yukonMessage).to.exist;
      expect(yukonMessage.textContent).to.include('Here is the answer.');
      expect(yukonMessage.textContent).to.not.include('Citations:');
      expect(yukonMessage.textContent).to.not.include('https://example.com');
    });

    it('should render a sources accordion when API provides source data', async () => {
      const encoder = new TextEncoder();
      const mockChunk = JSON.stringify([{
        generated_text: 'Here is some information.',
        source: {
          1: {
            document_id: 'test-id-1',
            document_name: 'index.html',
            document_url: 'https://test.com/index.html',
            title: 'Test Page',
          },
          2: {
            document_id: 'test-id-2',
            document_name: 'Test Doc',
            document_url: 'https://partners.stage.adobe.com/digitalexperience/preview/test-doc.pdf',
            title: 'Test Title PDF',
          },
        },
      }]);
      const chunk = encoder.encode(`${mockChunk}\n`);

      fetchStub.callsFake(async (url) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.includes('placeholders.json')) {
          return {
            ok: true,
            json: async () => ({
              data: [
                { key: 'send-message', value: 'Send Message' },
                { key: 'open-chat', value: 'Open Chat' },
                { key: 'sources', value: 'Sources' },
              ],
            }),
          };
        }
        return {
          ok: true,
          status: 200,
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(chunk);
              controller.close();
            },
          }),
        };
      });

      const block = document.querySelector('.yukon-chat');
      await init(block);

      const textarea = document.querySelector('#yc-input-field');
      const sendButton = document.querySelector('.yc-input-field-button');

      textarea.value = 'Where is this from?';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      sendButton.click();

      // eslint-disable-next-line no-promise-executor-return
      await new Promise((r) => setTimeout(r, 100));

      const modal = document.querySelector('#yukon-chat-modal');
      expect(modal).to.exist;

      const accordion = modal.querySelector('.yc-sources-accordion');
      expect(accordion).to.exist;

      const items = accordion.querySelectorAll('.yc-sources-list li a');
      expect(items.length).to.equal(2);

      expect(items[0].textContent).to.equal('Test Page');
      expect(items[0].getAttribute('href')).to.equal('https://test.com/index.html');

      expect(items[1].textContent.trim().replace(/\s+/g, ' ')).to.equal('Test Title PDF');
      expect(items[1].getAttribute('href')).to.equal('https://partners.stage.adobe.com/digitalexperience/preview/test-doc.pdf');

      // The page should have a page icon
      const pageIcon = items[0].querySelector('.yc-page-icon');
      expect(pageIcon).to.exist;

      // The asset should have a asset icon
      const assetIcon = items[1].querySelector('.yc-asset-icon');
      expect(assetIcon).to.exist;

      // Check citation numbers
      const citeRefs = accordion.querySelectorAll('.yc-source-citation-refs');
      expect(citeRefs[0].textContent.trim()).to.equal('1');
      expect(citeRefs[1].textContent.trim()).to.equal('2');
    });

    it('should render modal disclaimer below the input field container', async () => {
      const encoder = new TextEncoder();
      const chunk = encoder.encode('[{"generated_text":"Hi"}]\n');
      fetchStub.callsFake(async (url) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.includes('placeholders.json')) {
          return { ok: true, json: async () => ({ data: [] }) };
        }
        if (urlStr.includes('yukonAIAssistant')) {
          return {
            ok: true,
            status: 200,
            body: new ReadableStream({
              start(controller) {
                controller.enqueue(chunk);
                controller.close();
              },
            }),
          };
        }
        return { ok: false, status: 404 };
      });

      const block = document.querySelector('.yukon-chat');
      await init(block);

      const textarea = document.querySelector('#yc-input-field');
      const sendButton = document.querySelector('.yc-input-field-button');
      textarea.value = 'Hello';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      sendButton.click();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((r) => setTimeout(r, 50));

      const inputWrapper = document.querySelector('#yukon-chat-modal .modal-input-wrapper');
      expect(inputWrapper).to.exist;

      const disclaimer = inputWrapper.querySelector('.modal-disclaimer');
      expect(disclaimer).to.exist;
      expect(disclaimer.textContent).to.equal('This is a disclaimer.');

      const inputFieldContainer = inputWrapper.querySelector('.yc-input-field-container');
      expect(inputFieldContainer).to.exist;
      const children = Array.from(inputWrapper.children);
      expect(children.indexOf(inputFieldContainer)).to.be.lessThan(children.indexOf(disclaimer));
    });

    it('should not render modal disclaimer when config is absent', async () => {
      const encoder = new TextEncoder();
      const chunk = encoder.encode('[{"generated_text":"Hi"}]\n');
      fetchStub.callsFake(async (url) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.includes('placeholders.json')) {
          return { ok: true, json: async () => ({ data: [] }) };
        }
        if (urlStr.includes('yukonAIAssistant')) {
          return {
            ok: true,
            status: 200,
            body: new ReadableStream({
              start(controller) {
                controller.enqueue(chunk);
                controller.close();
              },
            }),
          };
        }
        return { ok: false, status: 404 };
      });

      const block = document.querySelector('.yukon-chat');
      const disclaimerRow = Array.from(block.children).find((row) => {
        const [keyDiv] = row.querySelectorAll(':scope > div');
        return keyDiv?.textContent.trim() === 'modal-disclaimer';
      });
      if (disclaimerRow) disclaimerRow.remove();

      await init(block);

      const textarea = document.querySelector('#yc-input-field');
      const sendButton = document.querySelector('.yc-input-field-button');
      textarea.value = 'Hello';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      sendButton.click();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((r) => setTimeout(r, 50));

      const disclaimer = document.querySelector('#yukon-chat-modal .modal-disclaimer');
      expect(disclaimer).to.not.exist;
    });

    it('should group sources by document_id when the stream emits multiple source objects', async () => {
      fetchStub.callsFake(async (url, fetchInit) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.includes('placeholders.json')) {
          return {
            ok: true,
            json: async () => ({
              data: [
                { key: 'send-message', value: 'Send Message' },
                { key: 'open-chat', value: 'Open Chat' },
                { key: 'scroll-to-bottom', value: 'Scroll to bottom' },
                { key: 'timeout-error', value: 'This is taking longer than expected. Please try again in a moment.' },
                { key: 'server-error', value: "We're having trouble processing your request right now. Please try again later." },
                { key: 'network-error', value: 'Network error. Please check your connection and try again.' },
                { key: 'sources', value: 'Sources' },
              ],
            }),
          };
        }
        if (urlStr.includes('yukonAIAssistant')) {
          return createMockYukonMultiSourceResponse({ signal: fetchInit?.signal });
        }
        return { ok: false, status: 404 };
      });

      const block = document.querySelector('.yukon-chat');
      await init(block);

      const textarea = document.querySelector('#yc-input-field');
      const sendButton = document.querySelector('.yc-input-field-button');

      textarea.value = 'Mock multi-source stream';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      sendButton.click();

      // eslint-disable-next-line no-promise-executor-return
      await new Promise((r) => setTimeout(r, 150));

      const modal = document.querySelector('#yukon-chat-modal');
      expect(modal).to.exist;

      const accordion = modal.querySelector('.yc-sources-accordion');
      expect(accordion).to.exist;

      const items = accordion.querySelectorAll('.yc-sources-list li a');
      expect(items.length).to.equal(3);
      expect(items[0].getAttribute('href')).to.equal('https://example.com/mock-yukon-source.pdf');
      expect(items[1].getAttribute('href')).to.equal('https://example.com/mock-partner-guide.pdf');
      expect(items[2].getAttribute('href')).to.equal('https://example.com/mock-partner-faq.pdf');
      expect(items[0].textContent).to.include('DE-yukon-doc-distributor-china-education.pdf');
      expect(items[1].textContent).to.include('Adobe-Partner-Program-Overview.pdf');
      expect(items[2].textContent).to.include('Partner-Portal-FAQ-Short.pdf');
      const citeRefs = accordion.querySelectorAll('.yc-source-citation-refs');
      expect(citeRefs.length).to.equal(3);
      expect(citeRefs[0].textContent.trim()).to.equal('1, 2');
      expect(citeRefs[1].textContent.trim()).to.equal('3, 4');
      expect(citeRefs[2].textContent.trim()).to.equal('5');
    });
  });
});
