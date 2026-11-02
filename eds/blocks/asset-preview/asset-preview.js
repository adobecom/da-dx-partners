import AssetPreview from './AssetPreview.js';
import { getConfig, populateLocalizedTextFromListItems, replaceText, keepInlineFragmentInDOM } from '../utils/utils.js';
import { isAemAuthorHost } from '../../scripts/utils.js';

function declareAssetPreview() {
  if (customElements.get('asset-preview')) return;
  customElements.define('asset-preview', AssetPreview);
}

async function localizationPromises(localizedText, config) {
  return Promise.all(Object.keys(localizedText).map(async (key) => {
    const value = await replaceText(key, config);
    if (value.length) localizedText[key] = value;
  }));
}

export default async function init(el) {
  performance.mark('asset-preview:start');

  const isAEM = isAemAuthorHost(window.location.origin);
  const config = isAEM ? null : getConfig();

  const sectionIndex = el.parentNode?.getAttribute('data-idx');

  const localizedText = {
    '{{Date}}': 'Date',
    '{{Asset detail}}': 'Asset detail',
    '{{Audience}}': 'Audience',
    '{{Summary}}': 'Summary',
    '{{Type}}': 'Type',
    '{{Tags}}': 'Tags',
    '{{Size}}': 'Size',
    '{{View}}': 'View',
    '{{Download}}': 'Download',
    '{{Download PDF}}': 'Download PDF',
    '{{Back to previous}}': 'Back to previous',
    '{{Asset data not found}}': 'Asset data not found',
    '{{Loading data}}': 'Loading data',
    '{{Download PPT}}': 'Download PPT',
    '{{Download ZIP}}': 'Download ZIP',
    '{{Download Image}}': 'Download Image',
    '{{Download Word}}': 'Download Word',
    '{{Download Excel}}': 'Download Excel',
    '{{Download File}}': 'Download File',
    '{{Watch Video}}': 'Watch Video',
  };
  populateLocalizedTextFromListItems(el, localizedText);

  const deps = isAEM ? Promise.resolve() : Promise.all([
    localizationPromises(localizedText, config),
  ]);

  const blockData = {
    localizedText,
    tableData: el.children,
    isAEM,
  };

  declareAssetPreview();
  const app = document.createElement('asset-preview');
  app.className = 'asset-preview-block';
  app.blockData = blockData;
  if (sectionIndex) app.setAttribute('data-idx', sectionIndex);
  app.setAttribute('daa-lh', 'Asset Preview Block');
  keepInlineFragmentInDOM(Array.from(blockData.tableData), app, 'fragment-link');
  el.replaceWith(app);

  await deps;
  performance.mark('asset-preview:end');
  performance.measure('asset-preview block', 'asset-preview:start', 'asset-preview:end');
  return app;
}
