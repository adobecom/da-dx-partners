import { getLibs } from '../../scripts/utils.js';
import TrainingPreview from './TrainingPreview.js';
import { getConfig, populateLocalizedTextFromListItems, replaceText } from '../utils/utils.js';

function keepInlineFragmentInDOM(tableRows, blockElement, fragmentRowTitle) {
  tableRows.forEach((row) => {
    const cols = Array.from(row.children);
    const rowTitle = cols[0].innerText.trim().toLowerCase().replace(/ /g, '-');
    const colsContent = cols.slice(1);
    if (rowTitle === fragmentRowTitle) {
      const inlineXfContent = document.createElement('div');
      inlineXfContent.innerHTML = colsContent[0].innerHTML;
      inlineXfContent.style.display = 'none';
      inlineXfContent.id = fragmentRowTitle;
      blockElement.appendChild(inlineXfContent);
    }
  });
}

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

  const localizedText = { '{{Loading data}}': 'Loading data',};
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
  app.setAttribute('daa-lh', 'Training Preview Block');
  app.blockData = blockData;
  app.setAttribute('data-idx', sectionIndex);
  keepInlineFragmentInDOM(Array.from(blockData.tableData), app, 'training-not-available-fragment');
  keepInlineFragmentInDOM(Array.from(blockData.tableData), app, 'enroll-alert-text');
  keepInlineFragmentInDOM(Array.from(blockData.tableData), app, 'training-warning-text');
  el.replaceWith(app);

  await deps;
  performance.mark('training-preview:end');
  performance.measure('training-preview block', 'training-preview:start', 'training-preview:end');
  return app;
}

