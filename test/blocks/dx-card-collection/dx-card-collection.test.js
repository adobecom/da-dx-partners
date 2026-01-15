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
    expect(infoBox.innerHTML).to.include('<strong>Test</strong>');
  });

  it('should contain card collection analytics attributes', async function () {
    const block = document.querySelector('.dx-card-collection');
    expect(block).to.exist;

    const component = await init(block);
    await component.updateComplete;
    expect(component).to.exist;

    const partnerNewsWrapper = document.querySelector('.dx-card-collection-wrapper');
    expect(partnerNewsWrapper.shadowRoot).to.exist;

    expect(partnerNewsWrapper.getAttribute('daa-lh')).to.equal('Card Collection');

    const partnerCards = partnerNewsWrapper.shadowRoot.querySelector('.partner-cards');
    expect(partnerCards.getAttribute('daa-lh')).to.equal('Card Collection | Filters: No Filters | Search Query: None');

    const firstCard = partnerCards.querySelector('.card-wrapper');
    expect(firstCard.getAttribute('daa-lh')).to.equal(`Card 1 | ${cards[0].contentArea.title} | ${cards[0].id}`);

    const singlePartnerCardBtn = firstCard.shadowRoot.querySelector('.card-btn');
    expect(singlePartnerCardBtn.getAttribute('daa-ll')).to.equal(singlePartnerCardBtn.textContent);
  });

  it('should contain card collection analytics attributes with filtering and search', async function () {
    const block = document.querySelector('.dx-card-collection');
    expect(block).to.exist;
    PartnerCards.prototype.firstUpdated.restore();

    sinon.stub(PartnerCards.prototype, 'firstUpdated').callsFake(async function () {
      this.allCards = cards;
      this.cards = cards;
      this.paginatedCards = this.cards.slice(0, 3);
      this.hasResponseData = true;
      this.fetchedData = true;
      this.allTags = tags;
      this.selectedSortOrder = { key: 'newest', value: 'Newest' };
      this.searchTerm = 'Adobe';
      this.selectedFilters = {'content-type': { checked: true, hash: "37mr/hvv", key: "event-session", parentKey: "content-type", value: "Event Session"}}
    });

    const component = await init(block);
    await component.updateComplete;
    expect(component).to.exist;

    const partnerNewsWrapper = document.querySelector('.dx-card-collection-wrapper');
    expect(partnerNewsWrapper.shadowRoot).to.exist;

    const partnerCards = partnerNewsWrapper.shadowRoot.querySelector('.partner-cards');
    expect(partnerCards).to.exist;
    expect(partnerCards.getAttribute('daa-lh')).to.equal('Card Collection | Filters: Event Session | Search Query: Adobe');
  });

  it('should initialize with past date filter when date-filter is set to past', async function () {
    document.body.innerHTML = `
      <div class="dx-card-collection">
        <div>
          <div>date-filter</div>
          <div>past</div>
        </div>
      </div>
    `;

    const block = document.querySelector('.dx-card-collection');
    const component = await init(block);
    await component.updateComplete;

    expect(component.blockData.dateFilter).to.exist;
    expect(component.blockData.dateFilter.tags).to.have.lengthOf(4);
    expect(component.blockData.dateFilter.tags[0].key).to.equal('show-all');
    expect(component.blockData.dateFilter.tags[2].key).to.equal('previous-month');
    expect(component.blockData.dateFilter.tags[3].key).to.equal('last-90-days');
  });

  it('should initialize with future date filter when date-filter is set to future', async function () {
    document.body.innerHTML = `
      <div class="dx-card-collection">
        <div>
          <div>date-filter</div>
          <div>future</div>
        </div>
      </div>
    `;

    const block = document.querySelector('.dx-card-collection');
    const component = await init(block);
    await component.updateComplete;

    expect(component.blockData.dateFilter).to.exist;
    expect(component.blockData.dateFilter.tags).to.have.lengthOf(4);
    expect(component.blockData.dateFilter.tags[0].key).to.equal('show-all');
    expect(component.blockData.dateFilter.tags[2].key).to.equal('next-month');
    expect(component.blockData.dateFilter.tags[3].key).to.equal('next-90-days');
  });

  it('should not initialize date filter when date-filter row is not authored', async function () {
    document.body.innerHTML = `
      <div class="dx-card-collection">
        <div>
          <div>Title</div>
          <div>Sample Title</div>
        </div>
      </div>
    `;

    const block = document.querySelector('.dx-card-collection');
    const component = await init(block);
    await component.updateComplete;

    expect(component.blockData.dateFilter).to.be.null;
  });

  describe('PartnerCardsWithDateFilter date filtering', () => {
    let component;
    let mockCards;

    beforeEach(async () => {
      const block = document.querySelector('.dx-card-collection');
      component = await init(block);
      await component.updateComplete;

      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      mockCards = [
        { id: '1', cardDate: new Date(currentYear, currentMonth, 15).toISOString() },
        { id: '2', cardDate: new Date(currentYear, currentMonth + 1, 15).toISOString() },
        { id: '3', cardDate: new Date(currentYear, currentMonth - 1, 15).toISOString() },
        { id: '4', cardDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '5', cardDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      component.cards = [...mockCards];
      component.allCards = [...mockCards];
    });

    it('should filter cards for next-month', () => {
      component.cards = [...mockCards];
      component.selectedDateFilter = { key: 'next-month' };
      component.handleDateFilterAction();
      
      const filteredIds = component.cards.map(card => card.id);
      expect(filteredIds).to.include('2');
      expect(filteredIds).to.not.include('3');
    });

    it('should handle next-month for December year transition', () => {
      const currentYear = new Date().getFullYear();
      component.cards = [
        { id: 'jan-next-year', cardDate: new Date(currentYear + 1, 0, 15).toISOString() },
      ];
      
      const clock = sinon.useFakeTimers(new Date(currentYear, 11, 15).getTime());
      component.selectedDateFilter = { key: 'next-month' };
      component.handleDateFilterAction();
      
      expect(component.cards.length).to.equal(1);
      expect(component.cards[0].id).to.equal('jan-next-year');
      clock.restore();
    });

    it('should filter cards for previous-month', () => {
      component.cards = [...mockCards];
      component.selectedDateFilter = { key: 'previous-month' };
      component.handleDateFilterAction();
      
      const filteredIds = component.cards.map(card => card.id);
      expect(filteredIds).to.include('3');
      expect(filteredIds).to.not.include('2');
    });

    it('should handle previous-month for January year transition', () => {
      const currentYear = new Date().getFullYear();
      component.cards = [
        { id: 'dec-last-year', cardDate: new Date(currentYear - 1, 11, 15).toISOString() },
      ];
      
      const clock = sinon.useFakeTimers(new Date(currentYear, 0, 15).getTime());
      component.selectedDateFilter = { key: 'previous-month' };
      component.handleDateFilterAction();
      
      expect(component.cards.length).to.equal(1);
      expect(component.cards[0].id).to.equal('dec-last-year');
      clock.restore();
    });

    it('should filter cards for next-90-days', () => {
      component.cards = [...mockCards];
      component.selectedDateFilter = { key: 'next-90-days' };
      component.handleDateFilterAction();
      
      const filteredIds = component.cards.map(card => card.id);
      expect(filteredIds).to.include('4');
      expect(filteredIds).to.not.include('5');
    });

    it('should handle next-90-days boundary correctly', () => {
      const today = new Date();
      component.cards = [
        { id: 'within-90', cardDate: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'at-90', cardDate: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'beyond-90', cardDate: new Date(today.getTime() + 91 * 24 * 60 * 60 * 1000).toISOString() },
      ];
      
      component.selectedDateFilter = { key: 'next-90-days' };
      component.handleDateFilterAction();
      
      const filteredIds = component.cards.map(card => card.id);
      expect(filteredIds).to.include('within-90');
      expect(filteredIds).to.include('at-90');
    });

    it('should filter cards for current-month', () => {
      component.cards = [...mockCards];
      component.selectedDateFilter = { key: 'current-month' };
      component.handleDateFilterAction();
      
      const filteredIds = component.cards.map(card => card.id);
      expect(filteredIds).to.include('1');
      expect(filteredIds).to.not.include('2');
      expect(filteredIds).to.not.include('3');
    });
  });
});
