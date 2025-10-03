import { getLibs } from '../../scripts/utils.js';
import { getConfig, populateLocalizedTextFromListItems, localizationPromises } from '../utils/utils.js';
import Search from './SearchCards.js';

function declareSearch() {
  if (customElements.get('search-cards')) return;
  customElements.define('search-cards', Search);
}

export default async function init(el) {
  performance.mark('search-cards:start');

  const miloLibs = getLibs();
  const config = getConfig();

  const sectionIndex = el.parentNode.getAttribute('data-idx');

  const localizedText = {
    '{{all}}': 'All',
    '{{apply}}': 'Apply',
    '{{assets}}': 'Assets',
    '{{back}}': 'Back',
    '{{clear-all}}': 'Clear all',
    '{{download}}': 'Download',
    '{{filter}}': 'Filter',
    '{{filter-by}}': 'Filter by',
    '{{filters}}': 'Filters',
    '{{open-in}}': 'Open in',
    '{{open-in-disabled}}': 'Open in disabled',
    '{{last-modified}}': 'Last modified',
    '{{load-more}}': 'Load more',
    '{{next}}': 'Next',
    '{{next-page}}': 'Next Page',
    '{{no-results-description}}': 'Try checking your spelling or broadening your search.',
    '{{no-results-title}}': 'No Results Found',
    '{{of}}': 'Of',
    '{{page}}': 'Page',
    '{{pages}}': 'Pages',
    '{{prev}}': 'Prev',
    '{{previous-page}}': 'Previous Page',
    '{{results}}': 'Results',
    '{{search-topics-resources-files}}': 'Search for topics, resources or files',
    '{{show}}': 'Show',
    '{{showing-results-for}}': 'Showing results for:',
    '{{size}}': 'Size',
    '{{view-all-results}}': 'View all results',
    '{{show-more}}': 'Show more',
    '{{show-less}}': 'Show less',
  };

  populateLocalizedTextFromListItems(el, localizedText);

  const deps = await Promise.all([
    localizationPromises(localizedText, config),
    import(`${miloLibs}/features/spectrum-web-components/dist/theme.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/search.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/checkbox.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/button.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/progress-circle.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/action-button.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/icons-workflow.js`),
  ]);

  declareSearch();

  const blockData = {
    localizedText,
    tableData: el.children,
    cardsPerPage: 12,
    ietf: config.locale.ietf,
    pagination: 'default',
  };

  const app = document.createElement('search-cards');
  app.className = 'search-cards-wrapper';
  app.blockData = blockData;
  app.setAttribute('data-idx', sectionIndex);
  el.replaceWith(app);

  await deps;
  performance.mark('search-cards:end');
  performance.measure('search-cards block', 'search-cards:start', 'search-cards:end');
  return app;
}
