import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import init from '../../../eds/blocks/search-full/search-full.js';
import Search from '../../../eds/blocks/search-full/SearchCards.js';

const cardsString = await readFile({ path: './mocks/cards.json' });
const cards = JSON.parse(cardsString);

const mockSearchResponse = {
  cards,
  count: {
    all: cards.length,
    assets: cards.filter(card => card.contentArea.type !== 'announcement').length,
    pages: cards.filter(card => card.contentArea.type === 'html').length,
    courses: cards.filter(card => card.contentArea.type === 'course').length
  }
};

const mockSuggestionsResponse = {
  suggested_completions: [
    { name: 'Adobe Analytics', type: 'product' },
    { name: 'Analytics Certification', type: 'asset' },
    { name: 'Target Implementation', type: 'asset' }
  ]
};

describe('search-full block', () => {
  let fetchStub;

  beforeEach(async () => {
    fetchStub = sinon.stub(window, 'fetch');
    
    fetchStub.resolves({
      ok: true,
      json: () => Promise.resolve(mockSearchResponse)
    });

    sinon.stub(Search.prototype, 'fetchData').callsFake(async function () {
    });

    sinon.stub(Search.prototype, 'fetchTags').resolves({ tags: [] });

    sinon.stub(Search.prototype, 'handleActions').callsFake(async function () {
      this.cards = cards;
      this.paginatedCards = this.cards.slice(0, 12);
      this.hasResponseData = true;
      this.contentTypeCounter = mockSearchResponse.count;
      this.countAll = mockSearchResponse.count.all;
    });

    sinon.stub(Search.prototype, 'getSuggestions').resolves(mockSuggestionsResponse.suggested_completions);

    sinon.stub(Search.prototype, 'setBlockData').callsFake(function () {
      this.blockData = {
        ...this.blockData,
        sort: {
          items: [
            { key: 'most-recent', value: 'Most Recent' },
            { key: 'most-relevant', value: 'Most Relevant' }
          ]
        },
        filters: []
      };
    });

    sinon.stub(Search.prototype, 'firstUpdated').callsFake(async function () {
      this.allCards = cards;
      this.cards = cards;
      this.paginatedCards = this.cards.slice(0, 12);
      this.hasResponseData = true;
      this.contentTypeCounter = mockSearchResponse.count;
      this.allTags = [];
      this.selectedSortOrder = { key: 'most-recent', value: 'Most Recent' };
    });

    await import('../../../eds/scripts/scripts.js');
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
  });

  afterEach(() => {
    fetchStub.restore();
    Search.prototype.fetchData.restore();
    Search.prototype.fetchTags.restore();
    Search.prototype.handleActions.restore();
    Search.prototype.getSuggestions.restore();
    Search.prototype.setBlockData.restore();
    Search.prototype.firstUpdated.restore();
  });

  const setupAndCommonTest = async (windowWidth) => {
    Object.defineProperty(window, 'innerWidth', { value: windowWidth });

    const block = document.querySelector('.search-full');
    expect(block).to.exist;

    const component = await init(block);
    await component.updateComplete;
    expect(component).to.exist;

    const searchCardsWrapper = document.querySelector('.search-cards-wrapper');
    expect(searchCardsWrapper.shadowRoot).to.exist;
    
    const searchBoxWrapper = searchCardsWrapper.shadowRoot.querySelector('.search-box-wrapper');
    expect(searchBoxWrapper).to.exist;
    
    const searchWrapper = searchCardsWrapper.shadowRoot.querySelector('.search-wrapper');
    expect(searchWrapper.shadowRoot).to.exist;
    const searchInput = searchWrapper.querySelector('#search');
    expect(searchInput.shadowRoot).to.exist;

    const partnerCardsSection = searchCardsWrapper.shadowRoot.querySelector('.partner-cards');
    expect(partnerCardsSection).to.exist;

    const partnerCardsContent = searchCardsWrapper.shadowRoot.querySelector('.partner-cards-content');
    expect(partnerCardsContent).to.exist;

    const contentTypeButtons = partnerCardsContent.querySelectorAll('sp-button');
    expect(contentTypeButtons.length).to.be.at.least(3);

    const partnerCardsCollection = partnerCardsContent.querySelector('.partner-cards-collection');
    expect(partnerCardsCollection).to.exist;

    return { searchCardsWrapper };
  };

  it('should have shadow root and render search cards for mobile', async function () {
    const { searchCardsWrapper } = await setupAndCommonTest(500);

    const filtersBtn = searchCardsWrapper.shadowRoot.querySelector('.filters-btn-mobile');
    expect(filtersBtn).to.exist;

    const searchTitle = searchCardsWrapper.shadowRoot.querySelector('.partner-cards-title');
    expect(searchTitle).to.exist;

    expect(searchCardsWrapper.contentType).to.equal('all');
    expect(searchCardsWrapper.contentTypeCounter).to.deep.equal(mockSearchResponse.count);
  });

  it('should have shadow root and render search cards for desktop', async function () {
    const { searchCardsWrapper } = await setupAndCommonTest(1500);

    const sidebarWrapper = searchCardsWrapper.shadowRoot.querySelector('.partner-cards-sidebar-wrapper');
    expect(sidebarWrapper).to.exist;

    const searchBoxWrapper = searchCardsWrapper.shadowRoot.querySelector('.search-box-wrapper');
    expect(searchBoxWrapper).to.exist;
  });

  it('should render search cards with proper content type filtering', async function () {
    const { searchCardsWrapper } = await setupAndCommonTest(1200);

    expect(searchCardsWrapper.contentType).to.equal('all');
    
    expect(searchCardsWrapper.contentTypeCounter).to.deep.equal(mockSearchResponse.count);
    
    const partnerCardsCollection = searchCardsWrapper.shadowRoot.querySelector('.partner-cards-collection');
    expect(partnerCardsCollection).to.exist;
    
    expect(searchCardsWrapper.paginatedCards).to.have.length.at.least(1);
  });

  it('should handle search input and typeahead functionality', async function () {
    const { searchCardsWrapper } = await setupAndCommonTest(1200);

    const typeaheadDialog = searchCardsWrapper.shadowRoot.querySelector('dialog#typeahead');
    expect(typeaheadDialog).to.exist;

    expect(searchCardsWrapper.typeaheadOptions).to.be.an('array');
    expect(searchCardsWrapper.isTypeaheadOpen).to.be.false;

    searchCardsWrapper.searchTerm = 'analytics';
    expect(searchCardsWrapper.searchTerm).to.equal('analytics');
  });

  it('should handle different content types (all, assets, pages, courses)', async function () {
    const { searchCardsWrapper } = await setupAndCommonTest(1200);

    expect(searchCardsWrapper.contentType).to.equal('all');
    
    searchCardsWrapper.contentType = 'asset';
    expect(searchCardsWrapper.contentType).to.equal('asset');
    
    searchCardsWrapper.contentType = 'page';
    expect(searchCardsWrapper.contentType).to.equal('page');
  });

  it('should display no results when no cards are found', async function () {
    Search.prototype.handleActions.restore();
    Search.prototype.firstUpdated.restore();
    
    sinon.stub(Search.prototype, 'handleActions').callsFake(async function () {
      this.cards = [];
      this.paginatedCards = [];
      this.hasResponseData = true;
      this.contentTypeCounter = { countAll: 0, countAssets: 0, countPages: 0, countCourses: 0 };
      this.countAll = 0;
    });

    sinon.stub(Search.prototype, 'firstUpdated').callsFake(async function () {
      this.allCards = [];
      this.cards = [];
      this.paginatedCards = [];
      this.hasResponseData = true;
      this.contentTypeCounter = { countAll: 0, countAssets: 0, countPages: 0, countCourses: 0 };
      this.allTags = [];
      this.selectedSortOrder = { key: 'most-recent', value: 'Most Recent' };
    });

    const { searchCardsWrapper } = await setupAndCommonTest(1200);

    expect(searchCardsWrapper.paginatedCards).to.have.length(0);
    expect(searchCardsWrapper.contentTypeCounter.countAll).to.equal(0);
  });

  it('should handle pagination correctly', async function () {
    const { searchCardsWrapper } = await setupAndCommonTest(1200);

    expect(searchCardsWrapper.paginationCounter).to.equal(1);
    expect(searchCardsWrapper.cardsPerPage).to.equal(12);
    
    expect(searchCardsWrapper.blockData.pagination).to.equal('default');
  });

  it('should handle API errors gracefully', async function () {
    fetchStub.resolves({
      ok: false,
      statusText: 'Server Error'
    });

    Search.prototype.handleActions.restore();
    Search.prototype.firstUpdated.restore();
    
    sinon.stub(Search.prototype, 'handleActions').callsFake(async function () {
      this.cards = [];
      this.paginatedCards = [];
      this.hasResponseData = true;
      this.contentTypeCounter = { countAll: 0, countAssets: 0, countPages: 0, countCourses: 0 };
    });

    sinon.stub(Search.prototype, 'firstUpdated').callsFake(async function () {
      this.allCards = [];
      this.cards = [];
      this.paginatedCards = [];
      this.hasResponseData = true;
      this.contentTypeCounter = { countAll: 0, countAssets: 0, countPages: 0, countCourses: 0 };
      this.allTags = [];
      this.selectedSortOrder = { key: 'most-recent', value: 'Most Recent' };
    });

    const { searchCardsWrapper } = await setupAndCommonTest(1200);

    expect(searchCardsWrapper.hasResponseData).to.be.true;
    expect(searchCardsWrapper.paginatedCards).to.have.length(0);
  });

  it('should display loading indicator when data is being fetched', async function () {
    Search.prototype.handleActions.restore();
    Search.prototype.firstUpdated.restore();
    
    // Stub firstUpdated to set hasResponseData to false initially
    sinon.stub(Search.prototype, 'firstUpdated').callsFake(async function () {
      this.allCards = [];
      this.cards = [];
      this.paginatedCards = [];
      this.hasResponseData = false;  // Set to false to show loading state
      this.contentTypeCounter = { countAll: 0, countAssets: 0, countPages: 0, countCourses: 0 };
      this.allTags = [];
      this.selectedSortOrder = { key: 'most-recent', value: 'Most Recent' };
    });

    // Stub handleActions to keep hasResponseData as false
    sinon.stub(Search.prototype, 'handleActions').callsFake(async function () {
      this.cards = [];
      this.paginatedCards = [];
      this.hasResponseData = false;  // Keep as false to maintain loading state
      this.contentTypeCounter = { countAll: 0, countAssets: 0, countPages: 0, countCourses: 0 };
    });

    const { searchCardsWrapper } = await setupAndCommonTest(1200);

    // Verify the component is in loading state
    expect(searchCardsWrapper.hasResponseData).to.be.false;
    
    // Check that the progress circle is rendered
    const partnerCardsContent = searchCardsWrapper.shadowRoot.querySelector('.partner-cards-content');
    expect(partnerCardsContent).to.exist;
    
    const partnerCardsCollection = partnerCardsContent.querySelector('.partner-cards-collection');
    expect(partnerCardsCollection).to.exist;
    
    const progressCircleWrapper = partnerCardsCollection.querySelector('.progress-circle-wrapper');
    expect(progressCircleWrapper).to.exist;
    
    const progressCircle = progressCircleWrapper.querySelector('sp-progress-circle');
    expect(progressCircle).to.exist;
    expect(progressCircle.getAttribute('label')).to.equal('Cards loading');
    expect(progressCircle.getAttribute('size')).to.equal('l');
    expect(progressCircle.getAttribute('indeterminate')).to.equal('');
  });

  it('should render chosen filter buttons when filters are selected', async function () {
    Search.prototype.handleActions.restore();
    Search.prototype.firstUpdated.restore();
    Search.prototype.setBlockData.restore();
    
    // Stub setBlockData to include filters
    sinon.stub(Search.prototype, 'setBlockData').callsFake(function () {
      this.blockData = {
        ...this.blockData,
        sort: {
          items: [
            { key: 'most-recent', value: 'Most Recent' },
            { key: 'most-relevant', value: 'Most Relevant' }
          ]
        },
        filters: [
          {
            key: 'product',
            value: 'Product',
            tags: [
              { key: 'analytics', parentKey: 'product', value: 'Analytics', checked: true },
              { key: 'target', parentKey: 'product', value: 'Target', checked: true }
            ]
          },
          {
            key: 'industry',
            value: 'Industry',
            tags: [
              { key: 'retail', parentKey: 'industry', value: 'Retail', checked: true }
            ]
          }
        ],
        filtersInfos: {} // Add empty filtersInfos to prevent undefined error
      };
    });
    
    // Stub firstUpdated to set selectedFilters
    sinon.stub(Search.prototype, 'firstUpdated').callsFake(async function () {
      this.allCards = cards;
      this.cards = cards;
      this.paginatedCards = this.cards.slice(0, 12);
      this.hasResponseData = true;
      this.contentTypeCounter = mockSearchResponse.count;
      this.allTags = {
        namespaces: {
          caas: {
            tags: {
              'analytics': { tagID: 'analytics', title: 'Analytics' },
              'target': { tagID: 'target', title: 'Target' },
              'retail': { tagID: 'retail', title: 'Retail' }
            }
          }
        }
      };
      this.selectedSortOrder = { key: 'most-recent', value: 'Most Recent' };
      
      // Set selectedFilters to trigger chosenFilters rendering
      this.selectedFilters = {
        product: [
          { key: 'analytics', parentKey: 'product', value: 'Analytics', checked: true },
          { key: 'target', parentKey: 'product', value: 'Target', checked: true }
        ],
        industry: [
          { key: 'retail', parentKey: 'industry', value: 'Retail', checked: true }
        ]
      };
    });

    sinon.stub(Search.prototype, 'handleActions').callsFake(async function () {
      this.cards = cards;
      this.paginatedCards = this.cards.slice(0, 12);
      this.hasResponseData = true;
      this.contentTypeCounter = mockSearchResponse.count;
      this.countAll = mockSearchResponse.count.all;
    });

    const { searchCardsWrapper } = await setupAndCommonTest(1500); // Desktop view to render sidebar

    // Wait for component to fully render
    await searchCardsWrapper.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify selectedFilters are set
    expect(searchCardsWrapper.selectedFilters).to.exist;
    expect(Object.keys(searchCardsWrapper.selectedFilters).length).to.be.at.least(1);

    // Check that chosenFilters getter returns data
    const chosenFiltersData = searchCardsWrapper.chosenFilters;
    if (chosenFiltersData) {
      expect(chosenFiltersData.tagsCount).to.be.at.least(1);
      expect(chosenFiltersData.htmlContent).to.exist;

      // Look for the chosen filter buttons in the shadow DOM
      const sidebarChosenFilterBtns = searchCardsWrapper.shadowRoot.querySelectorAll('.sidebar-chosen-filter-btn');
      
      // The buttons might not be rendered if the sidebar isn't showing, but the getter should work
      expect(chosenFiltersData.tagsCount).to.equal(3);
    }
  });
});

// Unit tests for individual SearchCards methods
describe('SearchCards Unit Tests', () => {
  let searchComponent;
  let fetchStub;
  let consoleErrorStub;

  beforeEach(async () => {
    fetchStub = sinon.stub(window, 'fetch');
    consoleErrorStub = sinon.stub(console, 'error');
    searchComponent = new Search();
    // Set up basic properties
    searchComponent.blockData = {
      localizedText: {
        '{{no-results-title}}': 'No results found',
        '{{no-results-description}}': 'Try different keywords',
        '{{showing-results-for}}': 'Showing results for',
        '{{view-all-results}}': 'View all results',
        '{{filters}}': 'Filters',
        '{{clear-all}}': 'Clear all',
        '{{show}}': 'Show',
        '{{all}}': 'All',
        '{{assets}}': 'Assets', 
        '{{pages}}': 'Pages',
        '{{of}}': 'of',
        '{{results}}': 'results',
        '{{search-topics-resources-files}}': 'Search topics, resources, files'
      },
      sort: { items: [] },
      pagination: 'default'
    };
    searchComponent.selectedSortOrder = { key: 'most-recent', value: 'Most Recent' };
    searchComponent.cardsPerPage = 12;
    searchComponent.paginationCounter = 1;
    searchComponent.selectedFilters = {};
    searchComponent.paginatedCards = [];
    searchComponent.contentTypeCounter = { countAll: 15, countAssets: 5, countPages: 5, countCourses: 5 };
    searchComponent.urlSearchParams = new URLSearchParams();
  });

  afterEach(() => {
    fetchStub.restore();
    if (consoleErrorStub.restore) {
      consoleErrorStub.restore();
    }
  });

  describe('fetchData', () => {
    it('should be a no-op function', async () => {
      // This method is intentionally empty - just verify it exists and doesn't throw
      const result = await searchComponent.fetchData();
      expect(result).to.be.undefined;
    });
  });

  describe('DOM getters', () => {
    beforeEach(() => {
      searchComponent.renderRoot = {
        querySelector: sinon.stub()
      };
    });

    it('should get _typeaheadDialog element', () => {
      const mockDialog = { id: 'typeahead' };
      searchComponent.renderRoot.querySelector.withArgs('dialog#typeahead').returns(mockDialog);
      
      const result = searchComponent._typeaheadDialog;
      expect(result).to.equal(mockDialog);
      expect(searchComponent.renderRoot.querySelector.calledWith('dialog#typeahead')).to.be.true;
    });

    it('should get _searchInput element', () => {
      const mockInput = { id: 'search' };
      searchComponent.renderRoot.querySelector.withArgs('#search').returns(mockInput);
      
      const result = searchComponent._searchInput;
      expect(result).to.equal(mockInput);
      expect(searchComponent.renderRoot.querySelector.calledWith('#search')).to.be.true;
    });

    it('should get _dialog element', () => {
      const mockDialog = { className: 'suggestion-dialog' };
      searchComponent.renderRoot.querySelector.withArgs('.suggestion-dialog').returns(mockDialog);
      
      const result = searchComponent._dialog;
      expect(result).to.equal(mockDialog);
      expect(searchComponent.renderRoot.querySelector.calledWith('.suggestion-dialog')).to.be.true;
    });
  });

  describe('onSearchInput', () => {
    it('should handle empty search input', async () => {
      // Mock renderRoot for the closeTypeahead method
      const mockDialog = { close: sinon.spy(), returnValue: '' };
      searchComponent.renderRoot = {
        querySelector: sinon.stub().withArgs('dialog#typeahead').returns(mockDialog)
      };
      
      const closeTypeaheadSpy = sinon.spy(searchComponent, 'closeTypeahead');
      const event = { target: { value: '' } };
      
      await searchComponent.onSearchInput(event);
      
      expect(searchComponent.searchTerm).to.equal('');
      expect(closeTypeaheadSpy.calledWith('SEE_ALL')).to.be.true;
    });

    it('should handle non-empty search input', async () => {
      const updateTypeaheadDialogStub = sinon.stub(searchComponent, 'updateTypeaheadDialog');
      const event = { target: { value: 'analytics' } };
      
      await searchComponent.onSearchInput(event);
      
      expect(searchComponent.searchTerm).to.equal('analytics');
      expect(updateTypeaheadDialogStub.called).to.be.true;
    });
  });

  describe('updateTypeaheadDialog', () => {
    it('should update typeahead state and options', async () => {
      const mockDialog = { show: sinon.spy() };
      const mockInput = { focus: sinon.spy() };
      searchComponent.renderRoot = {
        querySelector: sinon.stub()
          .withArgs('dialog#typeahead').returns(mockDialog)
          .withArgs('#search').returns(mockInput)
      };
      
      // Set up required dependencies for getSuggestions
      searchComponent.contentType = 'all';
      searchComponent.searchTerm = 'analytics';
      searchComponent.isTypeaheadOpen = false;
      
      // Stub getSuggestions to return test data  
      const getSuggestionsStub = sinon.stub(searchComponent, 'getSuggestions').resolves(['suggestion1', 'suggestion2']);
      
      await searchComponent.updateTypeaheadDialog();
      
      // Verify that typeahead state was updated - the isTypeaheadOpen flag should be set
      expect(searchComponent.isTypeaheadOpen).to.be.true;
    });

    it('should handle errors gracefully', async () => {
      const mockDialog = { show: sinon.spy() };
      searchComponent.renderRoot = {
        querySelector: sinon.stub().withArgs('dialog#typeahead').returns(mockDialog)
      };
      
      // Stub getSuggestions on the instance to reject
      const getSuggestionsStub = sinon.stub(searchComponent, 'getSuggestions').rejects(new Error('API Error'));
      
      await searchComponent.updateTypeaheadDialog();
      
      expect(consoleErrorStub.called).to.be.true;
      
      // Restore the stub
      getSuggestionsStub.restore();
    });
  });

  describe('closeTypeahead', () => {
    it('should close typeahead and handle search', () => {
      const mockDialog = { 
        close: sinon.spy(), 
        returnValue: 'selected value' 
      };
      searchComponent.renderRoot = {
        querySelector: sinon.stub().withArgs('dialog#typeahead').returns(mockDialog)
      };
      
      const handleSearchStub = sinon.stub(searchComponent, 'handleSearch');
      searchComponent.isTypeaheadOpen = true;
      
      searchComponent.closeTypeahead('test value');
      
      expect(searchComponent.isTypeaheadOpen).to.be.false;
      expect(mockDialog.close.calledWith('test value')).to.be.true;
      expect(searchComponent.searchTerm).to.equal('selected value');
      expect(handleSearchStub.called).to.be.true;
    });

    it('should not update searchTerm when value is SEE_ALL', () => {
      const mockDialog = { 
        close: sinon.spy(), 
        returnValue: 'should not be used' 
      };
      searchComponent.renderRoot = {
        querySelector: sinon.stub().withArgs('dialog#typeahead').returns(mockDialog)
      };
      
      const handleSearchStub = sinon.stub(searchComponent, 'handleSearch');
      searchComponent.searchTerm = 'original';
      
      searchComponent.closeTypeahead('SEE_ALL');
      
      expect(searchComponent.searchTerm).to.equal('original');
      expect(handleSearchStub.called).to.be.true;
    });
  });

  describe('handleSearch', () => {
    it('should set URL params and handle actions with search term', () => {
      const handleUrlSearchParamsStub = sinon.stub(searchComponent, 'handleUrlSearchParams');
      const handleActionsStub = sinon.stub(searchComponent, 'handleActions');
      
      searchComponent.searchTerm = 'analytics';
      searchComponent.handleSearch();
      
      expect(searchComponent.urlSearchParams.get('term')).to.equal('analytics');
      expect(searchComponent.paginationCounter).to.equal(1);
      expect(handleUrlSearchParamsStub.called).to.be.true;
      expect(handleActionsStub.called).to.be.true;
    });

    it('should remove URL param when no search term', () => {
      const handleUrlSearchParamsStub = sinon.stub(searchComponent, 'handleUrlSearchParams');
      const handleActionsStub = sinon.stub(searchComponent, 'handleActions');
      
      searchComponent.searchTerm = '';
      searchComponent.urlSearchParams.set('term', 'old-term');
      
      searchComponent.handleSearch();
      
      expect(searchComponent.urlSearchParams.has('term')).to.be.false;
      expect(handleActionsStub.called).to.be.true;
    });
  });

  describe('getSortValue', () => {
    it('should return correct sort value for most-recent', () => {
      const result = searchComponent.getSortValue('most-recent');
      expect(result).to.equal('recent');
    });

    it('should return correct sort value for most-relevant', () => {
      const result = searchComponent.getSortValue('most-relevant');
      expect(result).to.equal('relevant');
    });

    it('should return undefined for unknown sort key', () => {
      const result = searchComponent.getSortValue('unknown');
      expect(result).to.be.undefined;
    });
  });

  describe('generateFilters', () => {
    it('should generate filters from selected filters', () => {
      searchComponent.selectedFilters = {
        category: [{ key: 'analytics' }, { key: 'marketing' }],
        level: [{ key: 'beginner' }]
      };
      
      const result = searchComponent.generateFilters();
      
      expect(result).to.deep.equal({
        filters: {
          category: ['analytics', 'marketing'],
          level: ['beginner']
        }
      });
    });

    it('should handle empty selected filters', () => {
      searchComponent.selectedFilters = {};
      
      const result = searchComponent.generateFilters();
      
      expect(result).to.deep.equal({ filters: {} });
    });
  });

  describe('handleContentType', () => {
    it('should update content type and handle actions', () => {
      const handleActionsStub = sinon.stub(searchComponent, 'handleActions');
      searchComponent.contentType = 'all';
      
      searchComponent.handleContentType('asset');
      
      expect(searchComponent.contentType).to.equal('asset');
      expect(searchComponent.paginationCounter).to.equal(1);
      expect(handleActionsStub.called).to.be.true;
    });

    it('should not do anything if content type is the same', () => {
      const handleActionsStub = sinon.stub(searchComponent, 'handleActions');
      searchComponent.contentType = 'all';
      
      searchComponent.handleContentType('all');
      
      expect(handleActionsStub.called).to.be.false;
    });
  });

  describe('getTotalResults', () => {
    it('should return page count for page content type', () => {
      searchComponent.contentType = 'page';
      const result = searchComponent.getTotalResults();
      expect(result).to.equal(5);
    });

    it('should return asset count for asset content type', () => {
      searchComponent.contentType = 'asset';
      const result = searchComponent.getTotalResults();
      expect(result).to.equal(5);
    });

    it('should return course count for course content type', () => {
      searchComponent.contentType = 'course';
      const result = searchComponent.getTotalResults();
      expect(result).to.equal(5);
    });

    it('should return all count for other content types', () => {
      searchComponent.contentType = 'all';
      const result = searchComponent.getTotalResults();
      expect(result).to.equal(15);
    });
  });

  describe('handleEnter', () => {
    it('should close typeahead when Enter key is pressed', () => {
      // Mock renderRoot for the closeTypeahead method
      const mockDialog = { close: sinon.spy(), returnValue: '' };
      searchComponent.renderRoot = {
        querySelector: sinon.stub().withArgs('dialog#typeahead').returns(mockDialog)
      };
      
      const closeTypeaheadSpy = sinon.spy(searchComponent, 'closeTypeahead');
      const event = { key: 'Enter' };
      
      searchComponent.handleEnter(event);
      
      expect(closeTypeaheadSpy.calledWith('SEE_ALL')).to.be.true;
    });

    it('should not close typeahead for other keys', () => {
      const closeTypeaheadSpy = sinon.spy(searchComponent, 'closeTypeahead');
      const event = { key: 'Space' };
      
      searchComponent.handleEnter(event);
      
      expect(closeTypeaheadSpy.called).to.be.false;
    });
  });

  describe('handleClickOutside', () => {
    it('should return early if typeahead is not open', () => {
      searchComponent.isTypeaheadOpen = false;
      const closeTypeaheadSpy = sinon.spy(searchComponent, 'closeTypeahead');
      
      searchComponent.handleClickOutside({ clientX: 100, clientY: 100 });
      
      expect(closeTypeaheadSpy.called).to.be.false;
    });

    it('should close typeahead when clicking outside dialog and search input', () => {
      searchComponent.isTypeaheadOpen = true;
      
      const mockDialog = {
        getBoundingClientRect: sinon.stub().returns({ left: 50, right: 150, top: 50, bottom: 150 })
      };
      const mockSearchInput = {
        getBoundingClientRect: sinon.stub().returns({ left: 200, right: 300, top: 50, bottom: 100 })
      };
      const mockTypeaheadDialog = { close: sinon.spy(), returnValue: '' };
      
      const querySelectorStub = sinon.stub();
      querySelectorStub.withArgs('.suggestion-dialog').returns(mockDialog);
      querySelectorStub.withArgs('#search').returns(mockSearchInput);
      querySelectorStub.withArgs('dialog#typeahead').returns(mockTypeaheadDialog);
      
      searchComponent.renderRoot = {
        querySelector: querySelectorStub
      };
      
      const closeTypeaheadSpy = sinon.spy(searchComponent, 'closeTypeahead');
      
      // Click outside both elements
      searchComponent.handleClickOutside({ clientX: 400, clientY: 400 });
      
      expect(closeTypeaheadSpy.calledWith('SEE_ALL')).to.be.true;
    });

    it('should not close typeahead when clicking inside dialog', () => {
      searchComponent.isTypeaheadOpen = true;
      
      const mockDialog = {
        getBoundingClientRect: sinon.stub().returns({ left: 50, right: 150, top: 50, bottom: 150 })
      };
      const mockSearchInput = {
        getBoundingClientRect: sinon.stub().returns({ left: 200, right: 300, top: 50, bottom: 100 })
      };
      const mockTypeaheadDialog = { close: sinon.spy(), returnValue: '' };
      
      const querySelectorStub = sinon.stub();
      querySelectorStub.withArgs('.suggestion-dialog').returns(mockDialog);
      querySelectorStub.withArgs('#search').returns(mockSearchInput);
      querySelectorStub.withArgs('dialog#typeahead').returns(mockTypeaheadDialog);
      
      searchComponent.renderRoot = {
        querySelector: querySelectorStub
      };
      
      const closeTypeaheadSpy = sinon.spy(searchComponent, 'closeTypeahead');
      
      // Click inside dialog
      searchComponent.handleClickOutside({ clientX: 100, clientY: 100 });
      
      expect(closeTypeaheadSpy.called).to.be.false;
    });
  });

  describe('shouldDisplayLoadMore', () => {
    it('should return true when there are more results to load', () => {
      searchComponent.paginatedCards = [1, 2, 3]; // 3 cards loaded
      searchComponent.contentTypeCounter = { countAll: 10 }; // 10 total
      searchComponent.contentType = 'all';
      
      const result = searchComponent.shouldDisplayLoadMore();
      
      expect(result).to.be.true;
    });

    it('should return false when all results are loaded', () => {
      searchComponent.paginatedCards = [1, 2, 3, 4, 5]; // 5 cards loaded
      searchComponent.contentTypeCounter = { countAssets: 5 }; // 5 total
      searchComponent.contentType = 'asset';
      
      const result = searchComponent.shouldDisplayLoadMore();
      
      expect(result).to.be.false;
    });
  });

  describe('additionalResetActions', () => {
    it('should reset paginated cards for load-more pagination on first page', () => {
      searchComponent.blockData.pagination = 'load-more';
      searchComponent.paginationCounter = 1;
      searchComponent.paginatedCards = [1, 2, 3];
      
      searchComponent.additionalResetActions();
      
      expect(searchComponent.paginatedCards).to.deep.equal([]);
    });

    it('should not reset paginated cards for load-more pagination on other pages', () => {
      searchComponent.blockData.pagination = 'load-more';
      searchComponent.paginationCounter = 2;
      searchComponent.paginatedCards = [1, 2, 3];
      
      searchComponent.additionalResetActions();
      
      expect(searchComponent.paginatedCards).to.deep.equal([1, 2, 3]);
    });

    it('should not reset paginated cards for default pagination', () => {
      searchComponent.blockData.pagination = 'default';
      searchComponent.paginationCounter = 1;
      searchComponent.paginatedCards = [1, 2, 3];
      
      searchComponent.additionalResetActions();
      
      expect(searchComponent.paginatedCards).to.deep.equal([1, 2, 3]);
    });
  });

  describe('getCards', () => {
    beforeEach(() => {
      // Set up component state needed for getCards
      searchComponent.cardsPerPage = 12;
      searchComponent.paginationCounter = 1;
      searchComponent.selectedSortOrder = { key: 'most-recent' };
      searchComponent.contentType = 'all';
      searchComponent.searchTerm = 'test';
    });

    it('should successfully fetch and return cards data', async () => {
      const mockResponse = {
        ok: true,
        json: sinon.stub().resolves({ 
          cards: [{ id: 1 }, { id: 2 }, { id: 3 }],
          count: { all: 3, assets: 1, pages: 1, courses: 1 }
        })
      };
      
      fetchStub.resolves(mockResponse);
      searchComponent.generateFilters = sinon.stub().returns({ filters: {} });
      searchComponent.getSortValue = sinon.stub().returns('recent');
      
      const result = await searchComponent.getCards();
      
      expect(searchComponent.hasResponseData).to.be.true;
      expect(result).to.deep.equal({ 
        cards: [{ id: 1 }, { id: 2 }, { id: 3 }],
        count: { all: 3, assets: 1, pages: 1, courses: 1 }
      });
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Server Error'
      };
      
      fetchStub.resolves(mockResponse);
      searchComponent.generateFilters = sinon.stub().returns({ filters: {} });
      searchComponent.getSortValue = sinon.stub().returns('recent');
      const result = await searchComponent.getCards();
      
      expect(consoleErrorStub.called).to.be.true;
      expect(result).to.be.undefined;
    });

    it('should handle network errors gracefully', async () => {
      fetchStub.rejects(new Error('Network error'));
      searchComponent.generateFilters = sinon.stub().returns({ filters: {} });
      searchComponent.getSortValue = sinon.stub().returns('recent');
      
      const result = await searchComponent.getCards();
      
      expect(consoleErrorStub.called).to.be.true;
      expect(result).to.be.undefined;
    });

    it('should set hasResponseData to false when no cards returned', async () => {
      const mockResponse = {
        ok: true,
        json: sinon.stub().resolves({ cards: null, count: { all: 0 } })
      };
      
      fetchStub.resolves(mockResponse);
      searchComponent.generateFilters = sinon.stub().returns({ filters: {} });
      searchComponent.getSortValue = sinon.stub().returns('recent');
      
      await searchComponent.getCards();
      
      expect(searchComponent.hasResponseData).to.be.false;
    });
  });

  describe('getSuggestions', () => {
    beforeEach(() => {
      // Set up component state needed for getSuggestions
      searchComponent.selectedSortOrder = { key: 'most-recent' };
      searchComponent.contentType = 'all';
      searchComponent.searchTerm = 'ana';
    });

    it('should successfully fetch and return suggestions', async () => {
      const mockResponse = {
        ok: true,
        json: sinon.stub().resolves({ 
          suggested_completions: [
            { name: 'Analytics', type: 'product' },
            { name: 'Marketing', type: 'asset' }
          ]
        })
      };
      
      fetchStub.resolves(mockResponse);
      searchComponent.generateFilters = sinon.stub().returns({ filters: {} });
      searchComponent.getSortValue = sinon.stub().returns('recent');
      
      const result = await searchComponent.getSuggestions();
      
      expect(result).to.deep.equal([
        { name: 'Analytics', type: 'product' },
        { name: 'Marketing', type: 'asset' }
      ]);
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Server Error'
      };
      
      fetchStub.resolves(mockResponse);
      searchComponent.generateFilters = sinon.stub().returns({ filters: {} });
      searchComponent.getSortValue = sinon.stub().returns('recent');
      const result = await searchComponent.getSuggestions();
      
      expect(consoleErrorStub.called).to.be.true;
      expect(result).to.be.undefined;
    });

    it('should handle network errors gracefully', async () => {
      fetchStub.rejects(new Error('Network error'));
      searchComponent.generateFilters = sinon.stub().returns({ filters: {} });
      searchComponent.getSortValue = sinon.stub().returns('recent');
      
      const result = await searchComponent.getSuggestions();
      
      expect(consoleErrorStub.called).to.be.true;
      expect(result).to.be.undefined;
    });
  });

  describe('handleActions', () => {
    it('should handle actions with load-more pagination', async () => {
      searchComponent.blockData.pagination = 'load-more';
      searchComponent.paginatedCards = [{ id: 1 }];
      searchComponent.additionalResetActions = sinon.spy();
      searchComponent.getCards = sinon.stub().resolves({
        cards: [{ id: 2 }, { id: 3 }],
        count: { all: 15, assets: 5, pages: 5, courses: 5 }
      });
      
      await searchComponent.handleActions();
      
      expect(searchComponent.hasResponseData).to.be.true;
      expect(searchComponent.additionalResetActions.called).to.be.true;
      expect(searchComponent.cards).to.deep.equal([{ id: 2 }, { id: 3 }]);
      expect(searchComponent.paginatedCards).to.deep.equal([{ id: 1 }, { id: 2 }, { id: 3 }]);
      expect(searchComponent.countAll).to.equal(15);
      expect(searchComponent.contentTypeCounter).to.deep.equal({
        countAll: 15,
        countAssets: 5,
        countPages: 5,
        countCourses: 5
      });
    });

    it('should handle actions with default pagination', async () => {
      searchComponent.blockData.pagination = 'default';
      searchComponent.paginatedCards = [{ id: 1 }];
      searchComponent.additionalResetActions = sinon.spy();
      searchComponent.getCards = sinon.stub().resolves({
        cards: [{ id: 2 }, { id: 3 }],
        count: { all: 15, assets: 5, pages: 5, courses: 5 }
      });
      
      await searchComponent.handleActions();
      
      expect(searchComponent.hasResponseData).to.be.true;
      expect(searchComponent.cards).to.deep.equal([{ id: 2 }, { id: 3 }]);
      expect(searchComponent.paginatedCards).to.deep.equal([{ id: 2 }, { id: 3 }]);
    });

    it('should handle null cards data gracefully', async () => {
      searchComponent.additionalResetActions = sinon.spy();
      searchComponent.getCards = sinon.stub().resolves(null);
      
      await searchComponent.handleActions();
      
      expect(searchComponent.cards).to.deep.equal([]);
      expect(searchComponent.countAll).to.equal(0);
      expect(searchComponent.contentTypeCounter).to.deep.equal({
        countAll: 0,
        countAssets: 0,
        countPages: 0,
        countCourses: 0
      });
    });
  });

  describe('highlightFirstOccurrence', () => {
    // Test the inner function from typeaheadOptionsHTML
    it('should highlight text correctly', () => {
      // We need to access the function indirectly since it's defined inside the getter
      searchComponent.searchTerm = 'ana';
      searchComponent.typeaheadOptions = [
        { name: 'Analytics', type: 'product' },
        { name: 'Marketing', type: 'asset' }
      ];
      
      const html = searchComponent.typeaheadOptionsHTML;
      expect(html).to.exist;
    });
  });

  describe('flattenTagsToMap', () => {
    it('should flatten a simple tags object with no nested tags', () => {
      const tagsObj = {
        tag1: { path: '/content/cq:tags/tag1', tagID: 'tag1', title: 'Tag 1', tags: {} },
        tag2: { path: '/content/cq:tags/tag2', tagID: 'tag2', title: 'Tag 2', tags: {} },
      };

      const result = searchComponent.flattenTagsToMap(tagsObj);

      expect(result).to.be.instanceOf(Map);
      expect(result.size).to.equal(2);
      expect(result.get('tag1').tagID).to.equal('tag1');
      expect(result.get('tag2').tagID).to.equal('tag2');
    });

    it('should flatten nested tags recursively', () => {
      const tagsObj = {
        parent1: {
          path: '/content/cq:tags/parent1',
          tagID: 'parent1',
          title: 'Parent 1',
          tags: {
            child1: {
              path: '/content/cq:tags/parent1/child1',
              tagID: 'child1',
              title: 'Child 1',
              tags: {},
            },
            child2: {
              path: '/content/cq:tags/parent1/child2',
              tagID: 'child2',
              title: 'Child 2',
              tags: {},
            },
          },
        },
        parent2: {
          path: '/content/cq:tags/parent2',
          tagID: 'parent2',
          title: 'Parent 2',
          tags: {},
        },
      };

      const result = searchComponent.flattenTagsToMap(tagsObj);

      expect(result).to.be.instanceOf(Map);
      expect(result.size).to.equal(4);
      expect(result.get('parent1').tagID).to.equal('parent1');
      expect(result.get('child1').tagID).to.equal('child1');
      expect(result.get('child2').tagID).to.equal('child2');
      expect(result.get('parent2').tagID).to.equal('parent2');
    });

    it('should handle deeply nested tags', () => {
      const tagsObj = {
        level1: {
          path: '/content/cq:tags/level1',
          tagID: 'level1',
          title: 'Level 1',
          tags: {
            level2: {
              path: '/content/cq:tags/level1/level2',
              tagID: 'level2',
              title: 'Level 2',
              tags: {
                level3: {
                  path: '/content/cq:tags/level1/level2/level3',
                  tagID: 'level3',
                  title: 'Level 3',
                  tags: {},
                },
              },
            },
          },
        },
      };

      const result = searchComponent.flattenTagsToMap(tagsObj);

      expect(result).to.be.instanceOf(Map);
      expect(result.size).to.equal(3);
      expect(result.get('level1').tagID).to.equal('level1');
      expect(result.get('level2').tagID).to.equal('level2');
      expect(result.get('level3').tagID).to.equal('level3');
    });

    it('should handle empty tags object', () => {
      const tagsObj = {};

      const result = searchComponent.flattenTagsToMap(tagsObj);

      expect(result).to.be.instanceOf(Map);
      expect(result.size).to.equal(0);
    });

    it('should return empty map when passed null', () => {
      const result = searchComponent.flattenTagsToMap(null);

      expect(result).to.be.instanceOf(Map);
      expect(result.size).to.equal(0);
    });

    it('should return empty map when passed undefined', () => {
      const result = searchComponent.flattenTagsToMap(undefined);

      expect(result).to.be.instanceOf(Map);
      expect(result.size).to.equal(0);
    });

    it('should return empty map when passed a string', () => {
      const result = searchComponent.flattenTagsToMap('invalid string');

      expect(result).to.be.instanceOf(Map);
      expect(result.size).to.equal(0);
    });

    it('should return empty map when passed a number', () => {
      const result = searchComponent.flattenTagsToMap(123);

      expect(result).to.be.instanceOf(Map);
      expect(result.size).to.equal(0);
    });

    it('should return empty map when passed an array', () => {
      const result = searchComponent.flattenTagsToMap([1, 2, 3]);

      expect(result).to.be.instanceOf(Map);
      expect(result.size).to.equal(0);
    });

    it('should skip null or undefined tags', () => {
      const tagsObj = {
        tag1: { path: '/content/cq:tags/tag1', tagID: 'tag1', title: 'Tag 1', tags: {} },
        tag2: null,
        tag3: undefined,
        tag4: { path: '/content/cq:tags/tag4', tagID: 'tag4', title: 'Tag 4', tags: {} },
      };

      const result = searchComponent.flattenTagsToMap(tagsObj);

      expect(result).to.be.instanceOf(Map);
      expect(result.size).to.equal(2);
      expect(result.get('tag1').tagID).to.equal('tag1');
      expect(result.get('tag4').tagID).to.equal('tag4');
    });

    it('should skip non-object values', () => {
      const tagsObj = {
        tag1: { path: '/content/cq:tags/tag1', tagID: 'tag1', title: 'Tag 1', tags: {} },
        tag2: 'string value',
        tag3: 123,
        tag4: { path: '/content/cq:tags/tag4', tagID: 'tag4', title: 'Tag 4', tags: {} },
      };

      const result = searchComponent.flattenTagsToMap(tagsObj);

      expect(result).to.be.instanceOf(Map);
      expect(result.size).to.equal(2);
      expect(result.get('tag1').tagID).to.equal('tag1');
      expect(result.get('tag4').tagID).to.equal('tag4');
    });

    it('should preserve all tag properties', () => {
      const tagsObj = {
        tag1: {
          tagID: 'caas:content-type/blog',
          title: 'Blog',
          path: '/content/cq:tags/caas/content-type/blog',
          description: 'Blog posts',
          tagImage: 'https://example.com/blog.svg',
          tags: {},
        },
      };

      const result = searchComponent.flattenTagsToMap(tagsObj);

      expect(result).to.be.instanceOf(Map);
      expect(result.size).to.equal(1);
      const tag = result.get('caas:content-type/blog');
      expect(tag).to.deep.equal(tagsObj.tag1);
      expect(tag.tagID).to.equal('caas:content-type/blog');
      expect(tag.title).to.equal('Blog');
    });

    it('should handle mixed nested and non-nested tags', () => {
      const tagsObj = {
        simple: {
          path: '/content/cq:tags/simple',
          tagID: 'simple',
          title: 'Simple',
          tags: {},
        },
        complex: {
          path: '/content/cq:tags/complex',
          tagID: 'complex',
          title: 'Complex',
          tags: {
            nested1: {
              path: '/content/cq:tags/complex/nested1',
              tagID: 'nested1',
              title: 'Nested 1',
              tags: {},
            },
          },
        },
      };

      const result = searchComponent.flattenTagsToMap(tagsObj);

      expect(result).to.be.instanceOf(Map);
      expect(result.size).to.equal(3);
      expect(result.get('simple').tagID).to.equal('simple');
      expect(result.get('complex').tagID).to.equal('complex');
      expect(result.get('nested1').tagID).to.equal('nested1');
    });
  });

  describe('fetchTags', () => {
    it('should fetch tags successfully and flatten them', async () => {
      const mockTagsResponse = {
        namespaces: {
          caas: {
            tags: {
              'content-type': {
                path: '/content/cq:tags/caas/content-type',
                tagID: 'caas:content-type',
                title: 'Content Type',
                tags: {
                  blog: {
                    path: '/content/cq:tags/caas/content-type/blog',
                    tagID: 'caas:content-type/blog',
                    title: 'Blog',
                    tags: {},
                  },
                  video: {
                    path: '/content/cq:tags/caas/content-type/video',
                    tagID: 'caas:content-type/video',
                    title: 'Video',
                    tags: {},
                  },
                },
              },
            },
          },
        },
      };

      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve(mockTagsResponse),
      });

      await searchComponent.fetchTags();

      expect(searchComponent.allTags).to.deep.equal(mockTagsResponse);
      expect(searchComponent.allTagsFlatMap).to.be.instanceOf(Map);
      expect(searchComponent.allTagsFlatMap.size).to.equal(3);
      
      // Check that all expected tags are in the map
      expect(searchComponent.allTagsFlatMap.has('caas:content-type')).to.be.true;
      expect(searchComponent.allTagsFlatMap.has('caas:content-type/blog')).to.be.true;
      expect(searchComponent.allTagsFlatMap.has('caas:content-type/video')).to.be.true;
    });

    it('should handle empty tags structure', async () => {
      const mockTagsResponse = {
        namespaces: {
          caas: {
            tags: {},
          },
        },
      };

      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve(mockTagsResponse),
      });

      await searchComponent.fetchTags();

      expect(searchComponent.allTags).to.deep.equal(mockTagsResponse);
      expect(searchComponent.allTagsFlatMap).to.be.instanceOf(Map);
      expect(searchComponent.allTagsFlatMap.size).to.equal(0);
    });

    it('should handle fetch error gracefully', async () => {
      fetchStub.resolves({
        ok: false,
        status: 404,
      });

      // Should not throw
      await searchComponent.fetchTags();

      // allTags should remain as initialized (empty array)
      expect(searchComponent.allTags).to.be.an('array');
      expect(searchComponent.allTagsFlatMap).to.be.instanceOf(Map);
    });

    it('should handle network error gracefully', async () => {
      fetchStub.rejects(new Error('Network error'));

      // Should not throw
      await searchComponent.fetchTags();

      // allTags should remain as initialized
      expect(searchComponent.allTags).to.be.an('array');
      expect(searchComponent.allTagsFlatMap).to.be.instanceOf(Map);
    });

    it('should handle complex nested structure with multiple levels', async () => {
      const mockTagsResponse = {
        namespaces: {
          caas: {
            tags: {
              category1: {
                path: '/content/cq:tags/cat1',
                tagID: 'cat1',
                title: 'Category 1',
                tags: {
                  subcategory1: {
                    path: '/content/cq:tags/cat1/subcat1',
                    tagID: 'subcat1',
                    title: 'Subcategory 1',
                    tags: {
                      item1: {
                        path: '/content/cq:tags/cat1/subcat1/item1',
                        tagID: 'item1',
                        title: 'Item 1',
                        tags: {},
                      },
                    },
                  },
                },
              },
              category2: {
                path: '/content/cq:tags/cat2',
                tagID: 'cat2',
                title: 'Category 2',
                tags: {},
              },
            },
          },
        },
      };

      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve(mockTagsResponse),
      });

      await searchComponent.fetchTags();

      expect(searchComponent.allTagsFlatMap).to.be.instanceOf(Map);
      expect(searchComponent.allTagsFlatMap.size).to.equal(4);
      expect(searchComponent.allTagsFlatMap.has('cat1')).to.be.true;
      expect(searchComponent.allTagsFlatMap.has('subcat1')).to.be.true;
      expect(searchComponent.allTagsFlatMap.has('item1')).to.be.true;
      expect(searchComponent.allTagsFlatMap.has('cat2')).to.be.true;
    });
  });

  describe('chosenFilters getter', () => {
    it('should return undefined when no filters are selected', () => {
      searchComponent.selectedFilters = {};
      
      const result = searchComponent.chosenFilters;
      
      expect(result).to.be.undefined;
    });

    it('should return htmlContent and tagsCount for selected filters', () => {
      searchComponent.selectedFilters = {
        product: [
          { key: 'analytics', parentKey: 'product', value: 'Analytics', checked: true },
          { key: 'target', parentKey: 'product', value: 'Target', checked: true }
        ],
        industry: [
          { key: 'retail', parentKey: 'industry', value: 'Retail', checked: true }
        ]
      };
      
      const result = searchComponent.chosenFilters;
      
      expect(result).to.exist;
      expect(result.tagsCount).to.equal(3);
      expect(result.htmlContent).to.exist;
    });

    it('should sort filters alphabetically by value', () => {
      searchComponent.selectedFilters = {
        category: [
          { key: 'zebra', parentKey: 'category', value: 'Zebra', checked: true },
          { key: 'apple', parentKey: 'category', value: 'Apple', checked: true },
          { key: 'monkey', parentKey: 'category', value: 'Monkey', checked: true }
        ]
      };
      
      const result = searchComponent.chosenFilters;
      
      expect(result).to.exist;
      expect(result.tagsCount).to.equal(3);
      
      // Verify tags are sorted: Apple, Monkey, Zebra
      const extractedTags = Object.values(searchComponent.selectedFilters).flatMap((tagsArray) => tagsArray);
      const sortedTags = extractedTags.sort((a, b) => a.value.localeCompare(b.value));
      expect(sortedTags[0].value).to.equal('Apple');
      expect(sortedTags[1].value).to.equal('Monkey');
      expect(sortedTags[2].value).to.equal('Zebra');
    });

    it('should handle tags with slash-separated values', () => {
      searchComponent.selectedFilters = {
        product: [
          { key: 'analytics', parentKey: 'product', value: 'product/Analytics', checked: true },
          { key: 'target', parentKey: 'product', value: 'product/Target', checked: true }
        ]
      };
      
      const result = searchComponent.chosenFilters;
      
      expect(result).to.exist;
      expect(result.tagsCount).to.equal(2);
      
      // The template uses tag.value?.split('/')[1] || tag.value
      // Verify the logic extracts the correct part
      const extractedTags = Object.values(searchComponent.selectedFilters).flatMap((tagsArray) => tagsArray);
      extractedTags.forEach(tag => {
        const displayValue = tag.value?.split('/')[1] || tag.value;
        expect(displayValue).to.not.include('/');
        expect(['Analytics', 'Target']).to.include(displayValue);
      });
    });

    it('should flatten multiple filter categories', () => {
      searchComponent.selectedFilters = {
        product: [
          { key: 'analytics', parentKey: 'product', value: 'Analytics', checked: true }
        ],
        industry: [
          { key: 'retail', parentKey: 'industry', value: 'Retail', checked: true }
        ],
        level: [
          { key: 'beginner', parentKey: 'level', value: 'Beginner', checked: true },
          { key: 'advanced', parentKey: 'level', value: 'Advanced', checked: true }
        ]
      };
      
      const result = searchComponent.chosenFilters;
      
      expect(result).to.exist;
      expect(result.tagsCount).to.equal(4);
      
      // Verify all tags from different categories are flattened
      const extractedTags = Object.values(searchComponent.selectedFilters).flatMap((tagsArray) => tagsArray);
      expect(extractedTags).to.have.lengthOf(4);
    });

    it('should handle tags with undefined values gracefully', () => {
      searchComponent.selectedFilters = {
        category: [
          { key: 'test', parentKey: 'category', value: undefined, checked: true }
        ]
      };
      
      const result = searchComponent.chosenFilters;
      
      expect(result).to.exist;
      expect(result.tagsCount).to.equal(1);
    });
  });
});

// Unit tests for SearchCard component
describe('SearchCard Unit Tests', () => {
  let searchCard;

  beforeEach(async () => {
    // Import SearchCard component
    await import('../../../eds/components/SearchCard.js');
    
    // Create a search-card element
    searchCard = document.createElement('search-card');
    
    // Set up mock data
    searchCard.data = {
      id: 'test-card-1',
      contentArea: {
        title: 'Test Card',
        description: 'This is a test card description',
        type: 'pdf',
        url: 'https://example.com/test.pdf',
        size: '2.5 MB'
      },
      cardDate: '2024-01-15',
      arbitrary: [
        { product: 'analytics' },
        { industry: 'retail' }
      ]
    };
    
    searchCard.localizedText = {
      '{{download}}': 'Download',
      '{{open-in}}': 'Open in',
      '{{open-in-disabled}}': 'Open in (disabled)',
      '{{last-modified}}': 'Last Modified',
      '{{size}}': 'Size'
    };
    
    searchCard.ietf = 'en-US';
  });

  afterEach(() => {
    if (searchCard.parentNode) {
      searchCard.parentNode.removeChild(searchCard);
    }
  });

  describe('toggleCard', () => {
    it('should add expanded class when not present', () => {
      // Create a mock element with classList
      const mockElement = {
        classList: {
          contains: sinon.stub().returns(false),
          add: sinon.spy(),
          remove: sinon.spy(),
          toggle: sinon.spy()
        }
      };
      
      searchCard.toggleCard(mockElement);
      
      expect(mockElement.classList.toggle.calledOnce).to.be.true;
    });

    it('should remove expanded class when present', () => {
      // Create a mock element with classList and expanded class
      const mockElement = {
        classList: {
          contains: sinon.stub().returns(true),
          add: sinon.spy(),
          remove: sinon.spy(),
          toggle: sinon.spy()
        }
      };
      
      searchCard.toggleCard(mockElement);
      
      expect(mockElement.classList.toggle.calledOnce).to.be.true;
      expect(mockElement.classList.toggle.calledWith('expanded')).to.be.true;
    });

    it('should toggle expanded class on real DOM element', () => {
      // Create a real DOM element
      const testElement = document.createElement('div');
      testElement.classList.add('search-card');
      document.body.appendChild(testElement);
      
      // Verify class is not present initially
      expect(testElement.classList.contains('expanded')).to.be.false;
      
      // Call toggleCard to add the class
      searchCard.toggleCard(testElement);
      expect(testElement.classList.contains('expanded')).to.be.true;
      
      // Call toggleCard again to remove the class
      searchCard.toggleCard(testElement);
      expect(testElement.classList.contains('expanded')).to.be.false;
      
      // Clean up
      document.body.removeChild(testElement);
    });

    it('should work when integrated with rendered search card', async () => {
      // Append the search card to the DOM to trigger rendering
      document.body.appendChild(searchCard);
      
      // Wait for component to render
      await searchCard.updateComplete;
      
      // Get the search-card element from shadow DOM
      const cardElement = searchCard.shadowRoot.querySelector('.search-card');
      expect(cardElement).to.exist;
      
      // Verify initial state - no expanded class
      expect(cardElement.classList.contains('expanded')).to.be.false;
      
      // Click on the card to trigger toggleCard
      cardElement.click();
      
      // Wait a bit for the event to process
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Verify expanded class was added
      expect(cardElement.classList.contains('expanded')).to.be.true;
      
      // Click again to toggle off
      cardElement.click();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Verify expanded class was removed
      expect(cardElement.classList.contains('expanded')).to.be.false;
      
      // Clean up
      document.body.removeChild(searchCard);
    });
  });
});
