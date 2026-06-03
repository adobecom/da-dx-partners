/* eslint-disable max-len, spaced-comment */
import { getConfig } from '../blocks/utils/utils.js';
import { getLibs } from '../scripts/utils.js';

const miloLibs = getLibs();
const { loadStyle } = await import(`${miloLibs}/utils/utils.js`);
const API_SOURCE_URL = 'https://documentservices.adobe.com/view-sdk/viewer.js';

const PDF_EMBED_MODE_CONFIG = {
  // 'full-window': { embedMode: 'FULL_WINDOW', defaultViewMode: 'FIT_WIDTH' }, // TODO: Re-enable once the PDF viewer team's search bug is fixed
  'sized-container': { embedMode: 'SIZED_CONTAINER' },
  'in-line': { embedMode: 'IN_LINE' },
};

const PDF_EMBED_ADD_CONFIG = {
  showZoomControl: true,
  showDownloadPDF: false,
  showPrintPDF: false,
  showAnnotationTools: false,
  showThumbnails: false,
  showBookmarks: false,
  showFullScreen: true,
  enableFormFilling: false,
  showFullScreenViewButton: false,
};

export const loadSdk = () => new Promise((resolve, reject) => {
  if (window.AdobeDC?.View) {
    resolve();
    return;
  }

  const timeout = setTimeout(() => reject(new Error('PDF SDK load timeout')), 10000);

  document.addEventListener('adobe_dc_view_sdk.ready', () => {
    clearTimeout(timeout);
    resolve();
  }, { once: true });

  const existingScript = document.querySelector('script[src*="view-sdk/viewer.js"]');
  if (!existingScript) {
    const script = document.createElement('script');
    script.src = API_SOURCE_URL;
    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('PDF SDK failed to load'));
    };
    document.head.appendChild(script);
  }
});

export const getPdfConfig = () => {
  //The client ids are specific to the origin (no wildcards), so the stage **pdfViewerClientId** only works for **main--milo--adobecom.aem.page**.
  const config = getConfig();
  return config.env?.consumer?.pdfViewerClientId || config.pdfViewerClientId;
};

const initPdfViewer = async ({ url, fileName, divId, pdfEmbedMode = 'sized-container' }) => {
  await loadStyle('/eds/components/PdfViewer.css');
  const clientId = getPdfConfig();

  const embedMode = PDF_EMBED_MODE_CONFIG[pdfEmbedMode] ? pdfEmbedMode : 'sized-container';
  const pdfEmbedConfig = PDF_EMBED_MODE_CONFIG[embedMode];

  const initViewer = () => {
    const container = document.getElementById(divId);
    if (container) {
      container.classList.add(embedMode);
      if (embedMode !== 'in-line') container.classList.add('landscape');
    }

    const adobeDCView = new window.AdobeDC.View({
      clientId,
      divId,
      locale: 'en-US',
    });

    adobeDCView.previewFile(
      { content: { location: { url } }, metaData: { fileName } },
      { ...pdfEmbedConfig, ...PDF_EMBED_ADD_CONFIG },
    );
  };

  await loadSdk();
  initViewer();
};

export default initPdfViewer;
