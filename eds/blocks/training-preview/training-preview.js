import { getLibs } from '../../scripts/utils.js';
import TrainingPreview from './TrainingPreview.js';
import { getConfig, populateLocalizedTextFromListItems, replaceText } from '../utils/utils.js';

function declareTrainingPreview() {
  if (customElements.get('training-preview')) return;
  customElements.define('training-preview', TrainingPreview);
}

async function localizationPromises(localizedText, config) {
  return Promise.all(Object.keys(localizedText).map(async (key) => {
    const value = await replaceText(key, config);
    if (value.length) localizedText[key] = value;
  }));
}

export default async function init(el) {
  performance.mark('training-preview:start');

  const miloLibs = getLibs();
  const config = getConfig();

  const sectionIndex = el.parentNode.getAttribute('data-idx');

  const localizedText = {
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

  declareTrainingPreview();
  const app = document.createElement('training-preview');
  app.className = 'training-preview-block';
  app.blockData = blockData;
  app.setAttribute('data-idx', sectionIndex);
  el.replaceWith(app);

  await deps;
  performance.mark('training-preview:end');
  performance.measure('training-preview block', 'training-preview:start', 'training-preview:end');
  return app;
}


