import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import init from '../../../eds/blocks/dx-card-collection/dx-card-collection.js';
import PartnerCards from '../../../eds/components/PartnerCards.js';

const cardsString = await readFile({ path: './mocks/cards.json' });
const tagsString = await readFile({ path: './mocks/tags.json' });
const tags = JSON.parse(tagsString);
const cards = JSON.parse(cardsString);

describe('dx-card-collection block', () => {
  beforeEach(async () => {
    sinon.stub(PartnerCards.prototype, 'fetchData').resolves({ cards });
    sinon.stub(PartnerCards.prototype, 'fetchTags').resolves({ tags });

    sinon.stub(PartnerCards.prototype, 'firstUpdated').callsFake(async function () {
      this.allCards = cards;
      this.cards = cards;
      this.paginatedCards = this.cards.slice(0, 3);
      this.hasResponseData = true;
      this.fetchedData = true;
      this.allTags = tags;
    });

    await import('../../../eds/scripts/scripts.js');
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
  });

  afterEach(() => {
    PartnerCards.prototype.fetchData.restore();
    PartnerCards.prototype.fetchTags.restore();
    PartnerCards.prototype.firstUpdated.restore();
  });

  const setupAndCommonTest = async (windowWidth) => {
    Object.defineProperty(window, 'innerWidth', { value: windowWidth });

    const block = document.querySelector('.dx-card-collection');
    expect(block).to.exist;

    const component = await init(block);
    await component.updateComplete;
    expect(component).to.exist;

    const partnerNewsWrapper = document.querySelector('.dx-card-collection-wrapper');
    expect(partnerNewsWrapper.shadowRoot).to.exist;
    const partnerCardsCollection = partnerNewsWrapper.shadowRoot.querySelector('.partner-cards-collection');
    expect(partnerCardsCollection).to.exist;
    expect(partnerCardsCollection.innerHTML).to.include('single-partner-card');
    const firstCard = partnerCardsCollection.querySelector('.card-wrapper');
    expect(firstCard.shadowRoot).to.exist;
    const searchBarWrapper = partnerNewsWrapper.shadowRoot.querySelector('.partner-cards-sidebar .search-wrapper');
    expect(searchBarWrapper.shadowRoot).to.exist;
    const spectrumSearch = searchBarWrapper.querySelector('#search');
    expect(spectrumSearch.shadowRoot).to.exist;
    const paginationWrapper = partnerNewsWrapper.shadowRoot.querySelector('.partner-cards-content .pagination-wrapper');
    expect(paginationWrapper).to.not.exist;
    const loadMoreBtn = partnerNewsWrapper.shadowRoot.querySelector('.partner-cards-content .pagination-wrapper .load-more-btn');
    expect(loadMoreBtn).to.not.exist;
    const sortWrapper = partnerNewsWrapper.shadowRoot.querySelector('.partner-cards-content .sort-wrapper');
    expect(sortWrapper).to.exist;
    const firstSortItem = sortWrapper.querySelector('.sort-list .sort-item');
    expect(firstSortItem).to.exist;

    return { partnerNewsWrapper };
  };

  it('should have shadow root and render partner cards for mobile', async function () {
    const { partnerNewsWrapper } = await setupAndCommonTest(500);

    const filtersBtn = partnerNewsWrapper.shadowRoot.querySelector('.filters-btn-mobile');
    expect(filtersBtn).to.exist;
    const filtersWrapper = partnerNewsWrapper.shadowRoot.querySelector('.all-filters-wrapper-mobile');
    expect(filtersWrapper).to.exist;
    const firstFilter = filtersWrapper.querySelector('.filter-wrapper-mobile');
    expect(firstFilter).to.exist;
  });
  it('should have shadow root and render partner cards for desktop', async function () {
    const { partnerNewsWrapper } = await setupAndCommonTest(1500);

    const sidebarFiltersWrapper = partnerNewsWrapper.shadowRoot.querySelector('.sidebar-filters-wrapper');
    expect(sidebarFiltersWrapper).to.exist;
    const firstFilter = sidebarFiltersWrapper.querySelector('.filter');
    expect(firstFilter).to.exist;
  });
  it('should render partner cards with design property set to half height card', async function () {
    PartnerCards.prototype.firstUpdated.restore();

    sinon.stub(PartnerCards.prototype, 'firstUpdated').callsFake(async function () {
      this.blockData.cardDesign = 'single-partner-card--half-height';
      this.allCards = cards;
      this.cards = cards;
      this.paginatedCards = this.cards.slice(0, 3);
      this.hasResponseData = true;
      this.fetchedData = true;
      this.allTags = tags;
    });

    const { partnerNewsWrapper } = await setupAndCommonTest(1200);

    expect(partnerNewsWrapper.shadowRoot).to.exist;
    const partnerCardsCollection = partnerNewsWrapper.shadowRoot.querySelector('.partner-cards-collection');
    expect(partnerCardsCollection).to.exist;
    expect(partnerCardsCollection.innerHTML).to.include('single-partner-card');
    const firstCard = partnerCardsCollection.querySelector('.card-wrapper.single-partner-card--half-height');
    expect(firstCard.shadowRoot).to.exist;
  });

  it('should render filter info box when configured for desktop', async function () {
    PartnerCards.prototype.firstUpdated.restore();
    PartnerCards.prototype.fetchTags.restore();

    sinon.stub(PartnerCards.prototype, 'fetchTags').callsFake(async function () {
      this.allTags = tags;
    });

    sinon.stub(PartnerCards.prototype, 'setBlockData').callsFake(function () {
      this.blockData = {
        ...this.blockData,
        title: '',
        filters: [],
        filtersInfos: [],
        sort: {
          default: { key: 'newest', value: 'Newest' },
          items: [
            { key: 'newest', value: 'Newest' },
            { key: 'oldest', value: 'Oldest' },
          ],
        },
        pagination: 'disable',
        filterInfoBox: {
          title: 'Info Box Title',
          description: '<strong>Test</strong> description with <script>alert("xss")</script> HTML',
        },
        localizedText: {
          '{{filter}}': 'Filter',
          '{{clear-all}}': 'Clear All',
          '{{search}}': 'Search',
        },
      };
    });

    sinon.stub(PartnerCards.prototype, 'firstUpdated').callsFake(async function () {
      this.allCards = cards;
      this.cards = cards;
      this.paginatedCards = this.cards.slice(0, 3);
      this.hasResponseData = true;
      this.fetchedData = true;
      this.allTags = tags;
      this.selectedSortOrder = { key: 'newest', value: 'Newest' };
    });

    const { partnerNewsWrapper } = await setupAndCommonTest(1500);

    const infoBox = partnerNewsWrapper.shadowRoot.querySelector('.sidebar-info-box');
    expect(infoBox).to.exist;
    const title = infoBox.querySelector('.title');
    expect(title.textContent).to.equal('Info Box Title');
    // Verify DOMPurify sanitized the content (script tag removed)
    expect(infoBox.innerHTML).to.not.include('<script>');
    expect(infoBox.innerHTML).to.include('<strong>Test</strong>');
  });

});
