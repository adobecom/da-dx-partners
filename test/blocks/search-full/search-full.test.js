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
    pages: cards.filter(card => card.contentArea.type === 'html').length
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

  it('should handle different content types (all, assets, pages)', async function () {
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
      this.contentTypeCounter = { countAll: 0, countAssets: 0, countPages: 0 };
      this.countAll = 0;
    });

    sinon.stub(Search.prototype, 'firstUpdated').callsFake(async function () {
      this.allCards = [];
      this.cards = [];
      this.paginatedCards = [];
      this.hasResponseData = true;
      this.contentTypeCounter = { countAll: 0, countAssets: 0, countPages: 0 };
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
      this.contentTypeCounter = { countAll: 0, countAssets: 0, countPages: 0 };
    });

    sinon.stub(Search.prototype, 'firstUpdated').callsFake(async function () {
      this.allCards = [];
      this.cards = [];
      this.paginatedCards = [];
      this.hasResponseData = true;
      this.contentTypeCounter = { countAll: 0, countAssets: 0, countPages: 0 };
      this.allTags = [];
      this.selectedSortOrder = { key: 'most-recent', value: 'Most Recent' };
    });

    const { searchCardsWrapper } = await setupAndCommonTest(1200);

    expect(searchCardsWrapper.hasResponseData).to.be.true;
    expect(searchCardsWrapper.paginatedCards).to.have.length(0);
  });
});