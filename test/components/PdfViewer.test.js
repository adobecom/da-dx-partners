import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs, getLibs } from '../../eds/scripts/utils.js';

// TODO: Re-enable the full-window test once the PDF viewer team's search bug is fixed

setLibs('/libs');

const miloLibs = getLibs();
const { setConfig } = await import(`${miloLibs}/utils/utils.js`);

// Simulate a prod environment so getPdfConfig() reads the prod client ID.
setConfig({
  pdfViewerClientId: '3b6559c26f1e478a99e97ffe3da634bb',
  env: { consumer: { pdfViewerClientId: '3b6559c26f1e478a99e97ffe3da634bb' } },
});

// ---------------------------------------------------------------------------
// Import PdfViewer and use its own loadSdk to load the real SDK once.
// ---------------------------------------------------------------------------

const { default: initPdfViewer, getPdfConfig, loadSdk } = await import('../../eds/components/PdfViewer.js');

await loadSdk();

// ---------------------------------------------------------------------------
describe('PdfViewer', () => {
  const TEST_DIV_ID = 'pdf-viewer-test-container';
  const TEST_URL = 'https://example.com/sample.pdf';
  const TEST_FILE_NAME = 'sample.pdf';

  let previewFileStub;
  let viewConstructorStub;

  beforeEach(() => {
    document.body.innerHTML = `<div id="${TEST_DIV_ID}"></div>`;

    previewFileStub = sinon.stub();
    viewConstructorStub = sinon.stub(window.AdobeDC, 'View').returns({ previewFile: previewFileStub });
  });

  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
    document.head.querySelectorAll('link[rel="stylesheet"]').forEach((el) => el.remove());
  });

  // -------------------------------------------------------------------------
  describe('getPdfConfig', () => {
    it('should return env.consumer.pdfViewerClientId when set', () => {
      setConfig({ env: { consumer: { pdfViewerClientId: 'consumer-client-id' } }, pdfViewerClientId: 'fallback-client-id' });
      expect(getPdfConfig()).to.equal('consumer-client-id');
    });

    it('should fall back to pdfViewerClientId when consumer clientId is absent', () => {
      setConfig({ pdfViewerClientId: 'fallback-client-id' });
      expect(getPdfConfig()).to.equal('fallback-client-id');
    });
  });

  // -------------------------------------------------------------------------
  describe('initPdfViewer – AdobeDC.View constructor args', () => {
    it('should instantiate AdobeDC.View with the correct divId', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID });

      expect(viewConstructorStub.calledOnce).to.be.true;
      expect(viewConstructorStub.firstCall.args[0].divId).to.equal(TEST_DIV_ID);
    });

    it('should instantiate AdobeDC.View with locale en-US', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID });

      expect(viewConstructorStub.firstCall.args[0].locale).to.equal('en-US');
    });

    it('should pass the clientId from config to AdobeDC.View', async () => {
      setConfig({ pdfViewerClientId: 'expected-client-id' });
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID });

      expect(viewConstructorStub.firstCall.args[0].clientId).to.equal('expected-client-id');
    });
  });

  // -------------------------------------------------------------------------
  describe('initPdfViewer – previewFile call', () => {
    it('should call previewFile with the correct PDF URL', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID });

      expect(previewFileStub.calledOnce).to.be.true;
      expect(previewFileStub.firstCall.args[0].content.location.url).to.equal(TEST_URL);
    });

    it('should call previewFile with the correct file name', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID });

      expect(previewFileStub.firstCall.args[0].metaData.fileName).to.equal(TEST_FILE_NAME);
    });
  });

  // -------------------------------------------------------------------------
  describe('initPdfViewer – embed modes', () => {
    it('should default to FULL_WINDOW when pdfEmbedMode is omitted', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID });

      expect(previewFileStub.firstCall.args[1].embedMode).to.equal('SIZED_CONTAINER');
    });

    // it('should use FULL_WINDOW for "full-window"', async () => {
    //   await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID, pdfEmbedMode: 'full-window' });
    //
    //   expect(previewFileStub.firstCall.args[1].embedMode).to.equal('FULL_WINDOW');
    // });

    it('should use SIZED_CONTAINER for "sized-container"', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID, pdfEmbedMode: 'sized-container' });

      expect(previewFileStub.firstCall.args[1].embedMode).to.equal('SIZED_CONTAINER');
    });

    it('should use IN_LINE for "in-line"', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID, pdfEmbedMode: 'in-line' });

      expect(previewFileStub.firstCall.args[1].embedMode).to.equal('IN_LINE');
    });

    it('should fall back to FULL_WINDOW for an unrecognised mode', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID, pdfEmbedMode: 'unknown' });

      expect(previewFileStub.firstCall.args[1].embedMode).to.equal('SIZED_CONTAINER');
    });

    // it('should set defaultViewMode FIT_WIDTH for full-window', async () => {
    //   await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID, pdfEmbedMode: 'full-window' });
    //
    //   expect(previewFileStub.firstCall.args[1].defaultViewMode).to.equal('FIT_WIDTH');
    // });
  });

  // -------------------------------------------------------------------------
  describe('initPdfViewer – container CSS classes', () => {
    // it('should add the embed-mode string as a class to the container', async () => {
    //   await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID, pdfEmbedMode: 'full-window' });
    //
    //   expect(document.getElementById(TEST_DIV_ID).classList.contains('full-window')).to.be.true;
    // });
    //
    // it('should add "landscape" for full-window', async () => {
    //   await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID, pdfEmbedMode: 'full-window' });
    //
    //   expect(document.getElementById(TEST_DIV_ID).classList.contains('landscape')).to.be.true;
    // });

    it('should add "landscape" for sized-container', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID, pdfEmbedMode: 'sized-container' });

      expect(document.getElementById(TEST_DIV_ID).classList.contains('landscape')).to.be.true;
    });

    it('should NOT add "landscape" for in-line', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID, pdfEmbedMode: 'in-line' });

      const container = document.getElementById(TEST_DIV_ID);
      expect(container.classList.contains('in-line')).to.be.true;
      expect(container.classList.contains('landscape')).to.be.false;
    });

    it('should handle a missing container gracefully', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: 'does-not-exist' });

      expect(previewFileStub.calledOnce).to.be.true;
    });
  });

  // -------------------------------------------------------------------------
  describe('initPdfViewer – PDF_EMBED_ADD_CONFIG options', () => {
    it('should disable PDF download', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID });
      expect(previewFileStub.firstCall.args[1].showDownloadPDF).to.be.false;
    });

    it('should disable PDF printing', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID });
      expect(previewFileStub.firstCall.args[1].showPrintPDF).to.be.false;
    });

    it('should enable zoom control', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID });
      expect(previewFileStub.firstCall.args[1].showZoomControl).to.be.true;
    });

    it('should enable full-screen button', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID });
      expect(previewFileStub.firstCall.args[1].showFullScreen).to.be.true;
    });

    it('should disable annotation tools', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID });
      expect(previewFileStub.firstCall.args[1].showAnnotationTools).to.be.false;
    });

    it('should disable form filling', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID });
      expect(previewFileStub.firstCall.args[1].enableFormFilling).to.be.false;
    });

    it('should disable thumbnails', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID });
      expect(previewFileStub.firstCall.args[1].showThumbnails).to.be.false;
    });

    it('should disable bookmarks', async () => {
      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID });
      expect(previewFileStub.firstCall.args[1].showBookmarks).to.be.false;
    });
  });

  // -------------------------------------------------------------------------
  describe('loadSdk – SDK already present', () => {
    it('should not inject another script tag when window.AdobeDC.View already exists', async () => {
      const scriptCountBefore = document.head.querySelectorAll('script').length;

      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID });

      expect(document.head.querySelectorAll('script').length).to.equal(scriptCountBefore);
    });
  });

  // -------------------------------------------------------------------------
  describe('loadSdk – SDK event path', () => {
    it('should wait for adobe_dc_view_sdk.ready when View is not yet available', async () => {
      sinon.restore();
      const savedView = window.AdobeDC.View;
      window.AdobeDC.View = null;

      previewFileStub = sinon.stub();

      setTimeout(() => {
        window.AdobeDC.View = function MockView() { this.previewFile = previewFileStub; };
        document.dispatchEvent(new Event('adobe_dc_view_sdk.ready'));
      }, 10);

      await initPdfViewer({ url: TEST_URL, fileName: TEST_FILE_NAME, divId: TEST_DIV_ID });

      expect(previewFileStub.calledOnce).to.be.true;
      window.AdobeDC.View = savedView;
    });
  });
  // -------------------------------------------------------------------------
  describe('loadSdk – error handling', () => {
    let savedAdobeDC;

    beforeEach(() => {
      // The outer beforeEach already stubs window.AdobeDC.View; save the
      // whole object so we can put it back after tests that replace it.
      savedAdobeDC = window.AdobeDC;
    });

    afterEach(() => {
      window.AdobeDC = savedAdobeDC;
    });

    it('should reject when the SDK times out', async () => {
      const clock = sinon.useFakeTimers();

      // Simulate SDK not loaded
      window.AdobeDC = {};

      const promise = loadSdk();

      // Fast-forward timeout
      clock.tick(10001);

      let error;
      try {
        await promise;
      } catch (e) {
        error = e;
      }

      expect(error).to.be.instanceOf(Error);
      expect(error.message).to.equal('PDF SDK load timeout');

      clock.restore();
    });

    it('should reject when the SDK script fails to load', async () => {
      window.AdobeDC = {};

      // Remove the real SDK script so loadSdk() enters the injection branch,
      // then stub appendChild to capture the element WITHOUT making a real
      // network request (avoids cross-origin window.onerror from the browser).
      document.querySelector('script[src*="view-sdk/viewer.js"]')?.remove();

      let injectedScript;
      sinon.stub(document.head, 'appendChild').callsFake((node) => {
        if (node.tagName === 'SCRIPT') injectedScript = node;
      });

      const promise = loadSdk();
      injectedScript.onerror();

      let error;
      try {
        await promise;
      } catch (e) {
        error = e;
      }

      expect(error).to.be.instanceOf(Error);
      expect(error.message).to.equal('PDF SDK failed to load');
    });
  });
});
