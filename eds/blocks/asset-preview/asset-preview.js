import { getLibs } from '../../scripts/utils.js';
import AssetPreview from './AssetPreview.js';
import { getConfig, populateLocalizedTextFromListItems, replaceText } from '../utils/utils.js';

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

  const miloLibs = getLibs();
  const config = getConfig();

  const sectionIndex = el.parentNode.getAttribute('data-idx');

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
    '{{Back to previous}}': 'Back to previous',
    '{{Asset data not found}}': 'Asset data not found',
    '{{Loading data}}': 'Loading data',
  };
  populateLocalizedTextFromListItems(el, localizedText);

  const deps = await Promise.all([
    localizationPromises(localizedText, config),
  ]);

  const blockData = {
    localizedText,
    tableData: el.children,
  };

  declareAssetPreview();
  const app = document.createElement('asset-preview');
  app.className = 'asset-preview-block';
  app.blockData = blockData;
  app.setAttribute('data-idx', sectionIndex);
  el.replaceWith(app);

  await deps;
  performance.mark('asset-preview:end');
  performance.measure('asset-preview block', 'asset-preview:start', 'asset-preview:end');
  return app;
}


