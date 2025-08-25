import {getLibs} from "../../scripts/utils.js";
import AssetPreview from "./AssetPreview.js";
import {getConfig, populateLocalizedTextFromListItems, replaceText} from "../utils/utils.js";

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
  console.log('in block');
  performance.mark('asset-preview:start');

  const miloLibs = getLibs();
  const config = getConfig();

  const sectionIndex = el.parentNode.getAttribute('data-idx');

  const localizedText = {};
  populateLocalizedTextFromListItems(el, localizedText);

  const deps = await Promise.all([
    localizationPromises(localizedText, config),
    // import(`${miloLibs}/features/spectrum-web-components/dist/theme.js`),
    // import(`${miloLibs}/features/spectrum-web-components/dist/search.js`),
    // import(`${miloLibs}/features/spectrum-web-components/dist/checkbox.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/button.js`),
    // import(`${miloLibs}/features/spectrum-web-components/dist/progress-circle.js`),
  ]);


  const rows = Array.from(el.children);
  let dateFilterValue = '';

  rows.forEach((row) => {
    const cols = Array.from(row.children);
    const rowTitle = cols[0].innerText.trim().toLowerCase().replace(/ /g, '-');

    if (rowTitle === "date-filter") {
      dateFilterValue = cols[1]?.innerText.trim();
    }
  });


  const blockData = {
    localizedText,
    tableData: el.children,
  }


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


