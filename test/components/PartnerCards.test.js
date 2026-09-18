import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import PartnerCards from '../../eds/components/PartnerCards.js';
import PartnerCardsWithDateFilter from '../../eds/components/PartnerCardsWithDateFilter.js';

if (!customElements.get('test-partner-cards')) {
  customElements.define('test-partner-cards', PartnerCards);
}
if (!customElements.get('test-partner-cards-date-filter')) {
  customElements.define('test-partner-cards-date-filter', PartnerCardsWithDateFilter);
}

function makeCardsInstance() {
  const component = document.createElement('test-partner-cards');
  component.blockData = {
    filters: [],
    filtersInfos: [],
    filtersPanel: 'enable',
    localizedText: {
      '{{no-results-title}}': 'No results',
      '{{no-results-description}}': 'Try again',
    },
    sort: { items: [], default: {} },
    pagination: 'default',
  };
  component.urlSearchParams = new URLSearchParams();
  return component;
}

function makeDateInstance() {
  const component = document.createElement('test-partner-cards-date-filter');
  component.blockData = {
    dateFilter: {
      key: 'date',
      value: 'Date',
      tags: [
        { key: 'show-all', value: 'Show all', default: true, checked: true },
        { key: 'current-month', value: 'This month', checked: false },
        { key: 'next-90-days', value: 'Next 90 days', checked: false },
      ],
    },
    filters: [],
    filtersInfos: [],
    localizedText: { '{{results}}': 'Results', '{{clear-all}}': 'Clear all' },
    sort: { items: [], default: {} },
  };
  component.cards = [];
  component.selectedFilters = {};
  component.urlSearchParams = new URLSearchParams();
  return component;
}

describe('PartnerCards unit behavior', () => {
  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('extracts text while preserving strong markup', () => {
    const component = makeCardsInstance();
    const node = document.createElement('div');
    node.innerHTML = 'Before <strong>important <em>text</em></strong> after';

    expect(component.getTextWithStrong(node)).to.equal('Before<br/><strong>importanttext</strong>after');
    expect(component.getTextWithStrong(null)).to.equal('');
  });

  it('flattens nested tags into a lookup map', () => {
    const component = makeCardsInstance();
    const tags = {
      product: {
        tagID: 'product',
        tags: { analytics: { tagID: 'product/analytics', title: 'Analytics' } },
      },
    };

    const result = component.flattenTagsToMap(tags);

    expect(result.get('product').title).to.equal(undefined);
    expect(result.get('product/analytics').title).to.equal('Analytics');
    expect(component.flattenTagsToMap(null).size).to.equal(0);
  });

  it('filters cards by search term and sorts by newest or oldest', () => {
    const component = makeCardsInstance();
    component.allCards = [
      { id: 'old', cardDate: '2024-01-01', contentArea: { title: 'Guide', description: 'Legacy' } },
      { id: 'new', cardDate: '2025-01-01', contentArea: { title: 'Analytics', description: 'Reporting' } },
    ];
    component.searchTerm = 'analytics';
    component.handleSearchAction();
    expect(component.cards.map((card) => card.id)).to.deep.equal(['new']);

    component.cards = [...component.allCards];
    component.selectedSortOrder = { key: 'most-recent' };
    component.handleSortAction();
    expect(component.cards.map((card) => card.id)).to.deep.equal(['new', 'old']);

    component.selectedSortOrder = { key: 'oldest' };
    component.handleSortAction();
    expect(component.cards.map((card) => card.id)).to.deep.equal(['old', 'new']);
  });

  it('supports load-more pagination and card counters', () => {
    const component = makeCardsInstance();
    component.blockData.pagination = 'load-more';
    component.cards = [{ orderNum: 1 }, { orderNum: 2 }, { orderNum: 3 }];
    component.paginatedCards = component.cards.slice(0, 2);

    expect(component.shouldDisplayLoadMore()).to.equal(true);
    expect(component.cardsCounter).to.equal(2);
    expect(component.loadMorePagination).to.exist;

    component.paginatedCards = component.cards;
    expect(component.shouldDisplayLoadMore()).to.equal(false);
    expect(component.loadMorePagination).to.equal('');
  });

  it('adds and removes selected filter tags while updating URL state', () => {
    const component = makeCardsInstance();
    component.cards = [{ arbitrary: [{ product: 'analytics' }] }];
    component.allCards = component.cards;
    component.blockData.filters = [{ key: 'product', tags: [] }];
    sinon.stub(component, 'handleActions');
    sinon.stub(component, 'handleFilterAction');

    const tag = { key: 'analytics', parentKey: 'product', checked: false };
    component.handleTag({ target: { checked: true } }, tag, 'product');
    expect(component.selectedFilters.product[0]).to.equal(tag);
    expect(component.urlSearchParams.get('filters')).to.equal('yes');
    expect(component.urlSearchParams.get('product')).to.equal('analytics');

    component.handleRemoveTag(tag);
    expect(component.selectedFilters).to.deep.equal({});
    expect(component.urlSearchParams.has('product')).to.equal(false);
  });
});

describe('PartnerCardsWithDateFilter unit behavior', () => {
  afterEach(() => sinon.restore());

  it('initializes and resets the default date tag', () => {
    const component = makeDateInstance();
    const { dateFilter: { tags } } = component.blockData;
    tags[0].checked = false;
    tags[1].checked = true;

    component.initDateTags(tags);

    expect(component.selectedDateFilter).to.equal(tags[0]);
    expect(tags[0].checked).to.equal(true);
    expect(tags[1].checked).to.equal(false);
  });

  it('selects a date tag and resets an already selected tag', () => {
    const component = makeDateInstance();
    sinon.stub(component, 'handleActions');
    const { dateFilter: { tags } } = component.blockData;

    component.handleDateTag(tags, tags[1]);
    expect(component.selectedDateFilter).to.equal(tags[1]);
    expect(tags[1].checked).to.equal(true);
    expect(tags[0].checked).to.equal(false);

    component.handleDateTag(tags, tags[1]);
    expect(component.selectedDateFilter).to.equal(tags[0]);
    expect(tags[0].checked).to.equal(true);
  });

  it('filters cards for the last 90 days and excludes older cards', () => {
    const clock = sinon.useFakeTimers(new Date(2025, 5, 15, 12).getTime());
    const component = makeDateInstance();
    component.cards = [
      { id: 'recent', cardDate: new Date(2025, 4, 20, 12).toISOString() },
      { id: 'old', cardDate: new Date(2025, 1, 1, 12).toISOString() },
    ];
    component.selectedDateFilter = { key: 'last-90-days' };

    component.handleDateFilterAction();

    expect(component.cards.map((card) => card.id)).to.deep.equal(['recent']);
    clock.restore();
  });

  it('returns no chosen date filter when the default is selected', () => {
    const component = makeDateInstance();
    const [defaultDateFilter] = component.blockData.dateFilter.tags;
    component.selectedDateFilter = defaultDateFilter;

    expect(component.chosenFilters).to.equal(undefined);
  });
});
