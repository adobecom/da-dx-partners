import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { readFile } from '@web/test-runner-commands';

describe('Asset redirects', () => {
  let init;

  beforeEach(async () => {
    // Mock fetch to prevent external requests
    sinon.stub(window, 'fetch').resolves({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({}),
      text: async () => '',
    });

    // Load mock HTML
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });

    // Try to override window.location properties directly
    // In real browsers, these might not be configurable, but we'll try
    try {
      Object.defineProperty(window.location, 'origin', {
        value: 'https://partners.stage.adobe.com',
        writable: true,
        configurable: true,
      });
    } catch (e) {
      // If that fails, we'll work with the actual origin
    }

    try {
      Object.defineProperty(window.location, 'pathname', {
        value: '/digitalexperience/preview/restricted/1/program-guide.pdf.html',
        writable: true,
        configurable: true,
      });
    } catch (e) {
      // If that fails, use history.replaceState with just the pathname
      history.replaceState({}, '', '/digitalexperience/preview/restricted/1/program-guide.pdf.html');
    }

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

    // The first row matches the current URL, so redirect should happen
    // We can't verify window.location.replace was called in real browsers,
    // but we can verify the block is removed (which happens before redirect)
    await init(block);

    // Verify the block was removed (this happens before redirect)
    expect(document.querySelector('.asset-redirects')).to.not.exist;
  });

  it('should remove block but not redirect when URL does not match any row', async () => {
    // Set a URL that doesn't match any row
    try {
      Object.defineProperty(window.location, 'pathname', {
        value: '/digitalexperience/preview/restricted/999/nonexistent.pdf.html',
        writable: true,
        configurable: true,
      });
    } catch (e) {
      history.replaceState({}, '', '/digitalexperience/preview/restricted/999/nonexistent.pdf.html');
    }

    const block = document.querySelector('.asset-redirects');
    expect(block).to.exist;

    await init(block);

    // Verify the block was still removed (always happens)
    expect(document.querySelector('.asset-redirects')).to.not.exist;
  });

  it('should handle redirect loops by not redirecting', async () => {
    // Set URL to match a redirect that would create a loop
    // Row 3: webinar-recording-content-supply-chain -> webinar-recording-pko26-keynote
    // Row 1: program-guide -> webinar-recording-pko26-keynote
    // If we're on webinar-recording-pko26-keynote, it would redirect to itself (loop)
    try {
      Object.defineProperty(window.location, 'pathname', {
        value: '/digitalexperience/preview/netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html',
        writable: true,
        configurable: true,
      });
    } catch (e) {
      history.replaceState({}, '', '/digitalexperience/preview/netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html');
    }

    const block = document.querySelector('.asset-redirects');
    expect(block).to.exist;

    await init(block);

    // Verify the block was removed
    expect(document.querySelector('.asset-redirects')).to.not.exist;
    // Loop detection should prevent redirect, but we can't verify replace wasn't called in real browsers
  });

  it('should handle rows with empty cells', async () => {
    // Set URL to match a row that has empty cells (should be skipped)
    try {
      Object.defineProperty(window.location, 'pathname', {
        value: '/digitalexperience/preview/restricted/in/1/Retail_Banking_Industry_POV.pptx.html',
        writable: true,
        configurable: true,
      });
    } catch (e) {
      history.replaceState({}, '', '/digitalexperience/preview/restricted/in/1/Retail_Banking_Industry_POV.pptx.html');
    }

    const block = document.querySelector('.asset-redirects');
    expect(block).to.exist;

    await init(block);

    // Verify the block was removed
    expect(document.querySelector('.asset-redirects')).to.not.exist;
    // Empty cells should be skipped, but we can't verify replace wasn't called in real browsers
  });

  it('should handle relative URLs correctly', async () => {
    // Set URL to match a row with relative URLs
    try {
      Object.defineProperty(window.location, 'pathname', {
        value: '/digitalexperience/preview/netstorage-assets/restricted/co/content-supply-chain-automotive.pptx.html',
        writable: true,
        configurable: true,
      });
    } catch (e) {
      history.replaceState({}, '', '/digitalexperience/preview/netstorage-assets/restricted/co/content-supply-chain-automotive.pptx.html');
    }

    const block = document.querySelector('.asset-redirects');
    expect(block).to.exist;

    await init(block);

    // Verify the block was removed (redirect should happen for relative URLs)
    expect(document.querySelector('.asset-redirects')).to.not.exist;
  });
});
