import PartnershipProgress from './PartnershipProgress.js';
import { getConfig, populateLocalizedTextFromListItems, replaceText } from '../utils/utils.js';

function declareAssetPreview() {
  if (customElements.get('partnership-progress')) return;
  customElements.define('partnership-progress', PartnershipProgress);
}

async function localizationPromises(localizedText, config) {
  return Promise.all(Object.keys(localizedText).map(async (key) => {
    const value = await replaceText(key, config);
    if (value.length) localizedText[key] = value;
  }));
}

export default async function init(el) {
  performance.mark('partnership-progress:start');

  const config = getConfig();

  const sectionIndex = el.parentNode.getAttribute('data-idx');

  const localizedText = {
    '{{Solution}}': 'Solution',
    '{{Technology}}': 'Technology',
    '{{Requirements}}': 'Requirements',
    '{{Silver}}': 'Silver',
    '{{Gold}}': 'Gold',
    '{{Platinum}}': 'Platinum',
    '{{Specializations}}': 'Specializations',
    '{{Credentials}}': 'Credentials',
    '{{Active Customer Deployments}}': 'Active Customer Deployments',
    '{{Exchange Marketplace listings}}': 'Exchange Marketplace listings',
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
  const app = document.createElement('partnership-progress');
  app.className = 'partnership-progress-block';
  app.setAttribute('daa-lh', 'Partnership Progress Block');

  const blockClasses = el.classList;
  if (blockClasses.length > 1) {
    blockClasses.remove('partnership-progress');
    app.classList.add(...blockClasses);
  }
  app.blockData = blockData;
  app.setAttribute('data-idx', sectionIndex);
  el.replaceWith(app);

  await deps;
  performance.mark('partnership-progress:end');
  performance.measure('partnership-progress block', 'partnership-progress:start', 'partnership-progress:end');
  return app;
}


