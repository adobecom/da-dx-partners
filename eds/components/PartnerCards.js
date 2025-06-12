import { CAAS_TAGS_URL, getLibs, prodHosts } from '../scripts/utils.js';
import {
  partnerCardsStyles,
  partnerCardsLoadMoreStyles,
  partnerCardsPaginationStyles,
} from './PartnerCardsStyles.js';
import './SinglePartnerCard.js';
import './SinglePartnerCardHalfHeight.js';
import { extractFilterData } from '../blocks/utils/caasUtils.js';

const miloLibs = getLibs();
const { html, LitElement, css, repeat } = await import(`${miloLibs}/deps/lit-all.min.js`);

export default class PartnerCards extends LitElement {
  static designMap = {
    'half height card': 'single-partner-card--half-height'
  };

  static caasUrl;

  static styles = [
    partnerCardsStyles,
    partnerCardsLoadMoreStyles,
    partnerCardsPaginationStyles,
    css`#search {
      width: 100%;
    }`,
  ];

  static properties = {
    blockData: { type: Object },
    cards: { type: Array },
    paginatedCards: { type: Array },
    searchTerm: { type: String },
    paginationCounter: { type: Number },
    totalPages: { type: Number },
    selectedSortOrder: { type: Object },
    selectedFilters: { type: Object },
    urlSearchParams: { type: Object },
    mobileView: { type: Boolean },
    fetchedData: { type: Boolean },
    searchInputPlaceholder: { type: String },
    searchInputLabel: { type: String },
  };

  constructor() {
    super();
    this.allCards = [];
    this.cards = [];
    this.paginatedCards = [];
    this.searchTerm = '';
    this.paginationCounter = 1;
    this.totalPages = 0;
    this.cardsPerPage = 12;
    this.selectedSortOrder = {};
    this.selectedFilters = {};
    this.urlSearchParams = {};
    this.hasResponseData = true;
    this.fetchedData = false;
    this.mobileView = window.innerWidth <= 1200;
    this.searchInputPlaceholder = '{{search}}';
    this.searchInputLabel = '';
    this.allTags = [];
    this.cardFiltersSet = new Set();
    this.updateView = this.updateView.bind(this);
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.fetchTags();
    this.setBlockData();
    window.addEventListener('resize', this.updateView);
  }

  async fetchTags() {
    try {
      // todo milo have some default response stored if this fetch is not succesfull, do we need it
      const caasTagsResponse = await fetch(
        CAAS_TAGS_URL,
      );
      if (!caasTagsResponse.ok) {
        throw new Error(`Get caas tags HTTP error! Status: ${caasTagsResponse.status}`);
      }
      this.allTags = await caasTagsResponse.json();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('error', error);
    }
  }

  setBlockData() {
    this.blockData = {
      ...this.blockData,
      title: '',
      filters: [],
      filtersInfos: [],
      sort: {
        default: {},
        items: [],
      },
      filterInfoBox: {
        title: '',
        description: '',
      },
    };

    const blockDataActions = {
      title: (cols) => {
        const [titleEl] = cols;
        this.blockData.title = titleEl.innerText.trim();
      },
      filter: (cols) => {
        const [filterKeyEl, filterTagsKeysEl] = cols;
        const filterKey = filterKeyEl.innerText.trim().toLowerCase().replace(/ /g, '-');

        const filterTagsKeys = [];
        filterTagsKeysEl.querySelectorAll('li').forEach((li) => {
          const key = li.innerText.trim().toLowerCase().replace(/ /g, '-');
          if (key !== '') filterTagsKeys.push(key);
        });

        if (!filterKey || !filterTagsKeys.length) return;

        const filterObj = {
          key: filterKey,
          value: this.blockData.localizedText[`{{${filterKey}}}`],
          tags: filterTagsKeys.map((tagKey) => ({
            key: tagKey,
            parentKey: filterKey,
            value: this.blockData.localizedText[`{{${tagKey}}}`],
            checked: false,
          })),
        };
        this.blockData.filters.push(filterObj);
      },
      'caas-filter': async (cols) => {
        const [caasFilter] = cols;
        const filter = caasFilter.innerText.trim().toLowerCase().replace(/ /g, '-');
        const tag = extractFilterData(filter, this.allTags);
        if (tag) {
          this.blockData.filters.push(tag);
        }
      },
      sort: (cols) => {
        const [sortKeysEl] = cols;

        const sortKeys = [];
        sortKeysEl.querySelectorAll('li').forEach((li) => {
          const key = li.innerText.trim().toLowerCase().replace(/ /g, '-');
          if (key !== '') sortKeys.push(key);
        });

        if (!sortKeys.length) return;

        const sortItems = sortKeys.map((sortKey) => {
          const key = sortKey.endsWith('_default') ? sortKey.slice(0, -8) : sortKey;
          const value = this.blockData.localizedText[`{{${key}}}`];
          return { key, value };
        });

        const defaultKey = sortKeys.find((key) => key.endsWith('_default'));
        const finalDefaultKey = defaultKey ? defaultKey.slice(0, -8) : sortKeys[0];
        const defaultValue = sortItems.find((e) => e.key === finalDefaultKey).value;
        // eslint-disable-next-line max-len
        this.blockData.sort = { items: sortItems, default: { key: finalDefaultKey, value: defaultValue } };
      },
      'cards-per-page': (cols) => {
        const [cardsPerPageEl] = cols;
        const cardsPerPageStr = cardsPerPageEl.innerText.trim();
        const cardsPerPageNum = parseInt(cardsPerPageStr, 10);
        if (cardsPerPageNum) this.blockData.cardsPerPage = cardsPerPageNum;
      },
      pagination: (cols) => {
        const [paginationEl] = cols;
        const paginationType = paginationEl.innerText.trim();
        if (paginationType) this.blockData.pagination = paginationType.toLowerCase().replace(/ /g, '-');
      },
      'background-color': (cols) => {
        const [backgroundColorEl] = cols;
        const backgroundColor = backgroundColorEl.innerText.trim();
        if (backgroundColor) this.blockData.backgroundColor = backgroundColor;
      },
      'filter-info': (cols) => {
        const filterName = cols[0].innerText.trim();
        this.blockData.filtersInfos[filterName] = cols[1].innerText.trim();
      },
      'filter-info-box': (cols) => {
        this.blockData.filterInfoBox.title = cols[0].innerText.trim();
        this.blockData.filterInfoBox.description = this.getTextWithStrong(cols[1]);
      },
      'design': (cols) => {
        const [cardDesign] = cols;
        const cardDesignStr = cardDesign.innerText.trim();
        this.blockData.cardDesign = PartnerCards.designMap[cardDesignStr] || 'card-header';
      }
    };

    const rows = Array.from(this.blockData.tableData);
    rows.forEach((row) => {
      const cols = Array.from(row.children);
      const rowTitle = cols[0].innerText.trim().toLowerCase().replace(/ /g, '-');
      const colsContent = cols.slice(1);
      if (blockDataActions[rowTitle]) blockDataActions[rowTitle](colsContent);
    });
  }

  updateView() {
    const oldValue = this.mobileView;
    this.mobileView = window.innerWidth <= 1200;
    this.onViewUpdate(oldValue !== this.mobileView);
  }

  // eslint-disable-next-line class-methods-use-this
  onViewUpdate() {}

  async firstUpdated() {
    if (!this.blockData.filters) {
      requestAnimationFrame(() => this.firstUpdated());
      return;
    }
    await super.firstUpdated();
    await this.fetchData();
    if (this.blockData.sort.items.length) this.selectedSortOrder = this.blockData.sort.default;
    if (this.blockData.cardsPerPage) this.cardsPerPage = this.blockData.cardsPerPage;
    this.additionalFirstUpdated();
    this.initUrlSearchParams();
    this.handleActions();
  }

  // gets text content from node,
  // and keeps <strong> elements if any, while putting it at the beginning of new row
  getTextWithStrong(node) {
    if (!node) return '';
    return Array.from(node.childNodes).map((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        return child.textContent.trim();
      }
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.tagName === 'STRONG') {
          return `<br/><strong>${this.getTextWithStrong(child)}</strong>`;
        }
        return this.getTextWithStrong(child);
      }
      return '';
    }).join('');
  }

  // eslint-disable-next-line class-methods-use-this
  additionalFirstUpdated() {}

  mergeTagAndArbitraryFilters(card) {
    const filterTagMap = new Map(
      this.blockData.filters.flatMap((filter) => filter.tags
        .map((tag) => [tag.hash, { [tag.parentKey]: tag.key }])),
    );

    card.arbitrary = card.arbitrary
      .concat(card.tags.map((cardTag) => filterTagMap.get(cardTag.id)).filter(Boolean));
  }

  removeFiltersWithoutCards() {
    this.blockData.filters.forEach((filter) => {
      filter.tags = filter.tags.filter((tag) => this.cardFiltersSet.has(`${tag.parentKey}:${tag.key}`));
    });
    this.blockData.filters = this.blockData.filters
      .filter((filter) => filter.tags.length);
  }

  async fetchData() {
    try {
      let apiData;

      setTimeout(() => {
        this.hasResponseData = !!apiData?.cards;
        this.fetchedData = true;
      }, 5);

      const response = await fetch(
        this.blockData.caasUrl,
        this.getFetchOptions(),
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      apiData = await response.json();
      const cardsEvent = new Event('partner-cards-loaded');
      document.dispatchEvent(cardsEvent);
      if (apiData?.cards) {
        if (prodHosts.includes(window.location.host)) {
          apiData.cards = apiData.cards.filter((card) => !card.contentArea.url?.includes('/drafts/'));
        }

        apiData.cards.forEach((card, index) => {
          card.orderNum = index + 1;
          this.mergeTagAndArbitraryFilters(card);
          card.arbitrary.forEach((filter) => {
            const [key, value] = Object.entries(filter)[0]; // Extract key-value pair
            this.cardFiltersSet.add(`${key}:${value}`);
          });
        });

        this.onDataFetched(apiData);
        this.allCards = apiData.cards;
        this.removeFiltersWithoutCards();
        this.cards = apiData.cards;
        this.paginatedCards = this.cards.slice(0, this.cardsPerPage);
        this.hasResponseData = !!apiData.cards;
      }
    } catch (error) {
      this.hasResponseData = true;
      // eslint-disable-next-line no-console
      console.error('Error fetching data:', error);
    }
  }

  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  onDataFetched(apiData) {}

  // eslint-disable-next-line class-methods-use-this
  getFetchOptions() { return {}; }

  initUrlSearchParams() {
    // eslint-disable-next-line no-restricted-globals
    const { search } = location || window.location;
    this.urlSearchParams = new URLSearchParams(search);

    const term = this.urlSearchParams.get('term');
    if (term) {
      this.searchTerm = term;
    }

    if (this.blockData.filters.length && this.urlSearchParams.has('filters', 'yes')) {
      this.blockData.filters = this.blockData.filters.map((filter) => {
        if (this.urlSearchParams.has(filter.key)) {
          const filtersSearchTags = this.urlSearchParams.get(filter.key).split(',');

          filtersSearchTags.forEach((searchTag) => {
            const filterTag = filter.tags.find((tag) => tag.key === searchTag);
            if (filterTag) {
              filterTag.checked = true;
              this.selectedFilters = {
                ...this.selectedFilters,
                [filter.key]: [...(this.selectedFilters[filter.key] || []), filterTag],
              };
            }
          });
        }
        return filter;
      });
    }
  }

  get partnerCards() {
    if (!this.paginatedCards.length) {
      return html`<div class="no-results">
        <strong class="no-results-title">${this.blockData.localizedText['{{no-results-title}}']}</strong>
        <p class="no-results-description">${this.blockData.localizedText['{{no-results-description}}']}</p>
      </div>`;
    }

    if(this.blockData.cardDesign === PartnerCards.designMap['half height card']) {
      return html`${repeat(
        this.paginatedCards,
        (card) => card.id,
        (card) => html`<single-partner-card-half-height class="card-wrapper ${this.blockData.cardDesign}" .data=${card} .design=${this.blockData.cardDesign}></single-partner-card-half-height>`,
      )}`;
    }
    else {
      return html`${repeat(
        this.paginatedCards,
        (card) => card.id,
        (card) => html`<single-partner-card class="card-wrapper" .data=${card} .ietf=${this.blockData.ietf} .design=${this.blockData.cardDesign}></single-partner-card>`,
      )}`;
    }
    

    
  }

  get sortItems() {
    if (!this.blockData.sort.items.length) return;

    // eslint-disable-next-line consistent-return
    return html`${repeat(
      this.blockData.sort.items,
      (item) => item.key,
      (item) => html`<button
        class="sort-item ${this.selectedSortOrder.key === item.key ? 'selected' : ''}"
        value="${item.key}"
        @click="${() => this.handleSort(item)}">
        ${item.value}
      </button>`,
    )}`;
  }

  // eslint-disable-next-line class-methods-use-this,no-empty-function,getter-return
  get pagination() {
    if (this.blockData.pagination === 'load-more') return this.loadMorePagination;
    return this.defaultPagination;
  }

  shouldDisplayLoadMore() {
    return this.cards.length !== this.paginatedCards.length;
  }

  get loadMorePagination() {
    if (this.shouldDisplayLoadMore()) {
      return html`<button class="load-more-btn" @click="${this.handleLoadMore}" aria-label="${this.blockData.localizedText['{{load-more}}']}">${this.blockData.localizedText['{{load-more}}']}</button>`;
    }
    return '';
  }

  get defaultPagination() {
    return html`
      <div class="pagination-pages-list">
        <button class="pagination-prev-btn ${this.paginationCounter === 1 || !this.paginatedCards?.length ? 'disabled' : ''}" @click="${this.handlePrevPage}" aria-label="${this.blockData.localizedText['{{previous-page}}']}">
          ${this.blockData.localizedText['{{prev}}']}</button>
        ${this.paginationList}
        <button class="pagination-next-btn ${this.paginationCounter === this.totalPages || !this.paginatedCards?.length ? 'disabled' : ''}" @click="${this.handleNextPage}" aria-label="${this.blockData.localizedText['{{next-page}}']}">
          ${this.blockData.localizedText['{{next}}']}</button>
      </div>
    `;
  }

  get paginationList() {
    if (!this.cards.length) return;
    const pagesNumArray = this.getPageNumArray();
    // eslint-disable-next-line consistent-return
    return html`${repeat(
      pagesNumArray,
      (pageNum) => pageNum,
      (pageNum) => html`<button
        class="page-btn ${this.paginationCounter === pageNum ? 'selected' : ''}"
        @click="${() => this.handlePageNum(pageNum)}"
        aria-label="${this.blockData.localizedText['{{page}}']} ${pageNum}">
        ${pageNum}
      </button>`,
    )}`;
  }

  getPageNumArray() {
    const min = 1;
    this.totalPages = Math.ceil(this.cards.length / this.cardsPerPage);
    // eslint-disable-next-line consistent-return
    return Array.from({ length: this.totalPages }, (_, i) => i + min);
  }

  get cardsCounter() {
    const { length } = this.paginatedCards;
    if (!length) return 0;

    const { orderNum: lastElOrderNum } = this.paginatedCards[length - 1];

    if (this.blockData.pagination === 'load-more') return lastElOrderNum;

    const { orderNum: firstElOrderNum } = this.paginatedCards[0];
    return `${firstElOrderNum} - ${lastElOrderNum}`;
  }

  get filters() {
    if (!this.blockData.filters.length) return;

    // eslint-disable-next-line consistent-return
    return html`${repeat(
      this.blockData.filters,
      (filter) => filter.key,
      (filter) => {
        const selectedTagsData = this.countSelectedTags(filter.key);
        const { tagsCount } = selectedTagsData;

        return html`
          <div class="filter">
            <button class="filter-header" @click=${(e) => this.toggleFilter(e.currentTarget.parentNode)} aria-label="${filter.value}">
              <span class="filter-label">${filter.value}</span>
              <span class="filter-chevron-icon"></span>
            </button>
            <button class="filter-selected-tags-count-btn ${tagsCount ? '' : 'hidden'}" @click="${() => this.handleResetTags(filter.key)}" aria-label="${tagsCount}">
              <span class="filter-selected-tags-total-num">${tagsCount}</span>
            </button>
            <ul class="filter-list">
              ${this.blockData.filtersInfos[filter.key] ? html`<div class="filter-info">
                  <div class="info-icon" style="background-image: url('/eds/img/icons/info.svg')"></div>
                 <span class="filter-info-text"> ${this.blockData.filtersInfos[filter.key]}</span> </div>`
            : ''}
              <sp-theme theme="spectrum" color="light" scale="medium">
                ${this.getTagsByFilter(filter)}
              </sp-theme>
            </ul>
          </div>`;
      },
    )}`;
  }

  getTotalResults() {
    return this.cards?.length;
  }

  get filtersMobile() {
    if (!this.blockData?.filters?.length) return;

    // eslint-disable-next-line consistent-return
    return html`${repeat(
      this.blockData.filters,
      (filter) => filter.key,
      (filter) => {
        const selectedTagsData = this.countSelectedTags(filter.key);
        const { tagsString } = selectedTagsData;
        const { tagsCount } = selectedTagsData;

        /* eslint-disable indent */
        return html`
          <div class="filter-wrapper-mobile">
            <div class="filter-mobile">
              <button class="filter-header-mobile" @click=${(e) => this.toggleFilter(e.target.closest('.filter-wrapper-mobile'))} aria-label="${filter.value}">
                <div class="filter-header-content-mobile">
                  <h3 class="filter-header-name-mobile">${filter.value}</h3>
                  ${tagsCount
            ? html`
                      <div class="filter-header-selected-tags-mobile">
                        <span class="filter-header-selected-tags-text-mobile">${tagsString}</span>
                        <span class="filter-header-selected-tags-count-mobile">+ ${tagsCount}</span>
                      </div>
                    `
            : ''
          }
                </div>
                <span class="filter-header-chevron-icon"></span>
              </button>
              ${this.blockData.filtersInfos[filter.key] ? html`<div class="filter-info">
                  <div class="info-icon" style="background-image: url('/eds/img/icons/info.svg')"></div>
                 <span class="filter-info-text"> ${this.blockData.filtersInfos[filter.key]}</span> </div>`
            : ''}
              <ul class="filter-tags-mobile">
                <sp-theme theme="spectrum" color="light" scale="medium">
                  ${this.getTagsByFilter(filter)}
                </sp-theme>
              </ul>
              <div class="filter-footer-mobile-wrapper">
                <div class="filter-footer-mobile">
                  <span class="filter-footer-results-mobile">${this.getTotalResults()} ${this.blockData.localizedText['{{results}}']}</span>
                  <div class="filter-footer-buttons-mobile">
                    <button class="filter-footer-clear-btn-mobile" @click="${() => this.handleResetTags(filter.key)}" aria-label="${this.blockData.localizedText['{{clear-all}}']}">${this.blockData.localizedText['{{clear-all}}']}</button>
                    <sp-theme theme="spectrum" color="light" scale="medium">
                      <sp-button @click=${(e) => this.toggleFilter(e.target.closest('.filter-wrapper-mobile'))} aria-label="${this.blockData.localizedText['{{apply}}']}">${this.blockData.localizedText['{{apply}}']}</sp-button>
                    </sp-theme>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        /* eslint-enable indent */
      },
    )}`;
  }

  get chosenFilters() {
    const extractedTags = Object.values(this.selectedFilters).flatMap((tagsArray) => tagsArray);
    if (!extractedTags.length) return;

    const htmlContent = html`${repeat(
      extractedTags.sort((a, b) => a.value.localeCompare(b.value)),
      (tag) => tag.key,
      (tag) => html`
        <button class="sidebar-chosen-filter-btn" @click="${() => this.handleRemoveTag(tag)}" aria-label="${tag.value}">
          ${tag.value}
        </button>`,
    )}`;

    // eslint-disable-next-line consistent-return
    return { htmlContent, tagsCount: extractedTags.length };
  }

  getTagsByFilter(filter) {
    const { tags } = filter;

    return html`${repeat(
      tags,
      (tag) => tag.key,
      (tag) => html`<li><sp-checkbox
        size="m" emphasized
        ?checked=${tag.checked}
        @change=${(event) => this.handleTag(event, tag, filter.key)}
      >
        ${tag.value}
      </sp-checkbox></li>`,
    )}`;
  }

  toggleSort() {
    const element = this.shadowRoot.querySelector('.sort-list');
    element.classList.toggle('expanded');
  }

  // eslint-disable-next-line class-methods-use-this
  toggleFilter(clickedFilter) {
    clickedFilter.classList.toggle('expanded');
  }

  openFiltersMobile() {
    const element = this.shadowRoot.querySelector('.all-filters-wrapper-mobile');
    element.classList.add('open');
  }

  closeFiltersMobile() {
    const element = this.shadowRoot.querySelector('.all-filters-wrapper-mobile');
    element.classList.remove('open');
  }

  handleActions() {
    this.handleSearchAction();
    if (this.blockData.sort.items.length) this.handleSortAction();
    if (this.blockData.filters.length) this.handleFilterAction();
    this.additionalActions();
    // eslint-disable-next-line no-return-assign
    this.cards.forEach((card, index) => card.orderNum = index + 1);
    this.updatePaginatedCards();
  }

  // eslint-disable-next-line class-methods-use-this
  additionalActions() {}

  handleResetActions() {
    this.searchTerm = '';
    this.urlSearchParams.delete('term');
    this.selectedFilters = {};
    this.blockData.filters.forEach((filter) => {
      // eslint-disable-next-line no-return-assign
      filter.tags.forEach((tag) => tag.checked = false);
      this.urlSearchParams.delete(filter.key);
    });
    this.additionalResetActions();
    this.paginationCounter = 1;
    this.handleActions();
    this.handleFilterAction();
    if (this.blockData.filters.length) this.handleUrlSearchParams();
  }

  // eslint-disable-next-line class-methods-use-this
  additionalResetActions() {}

  handleSearchAction() {
    // eslint-disable-next-line max-len
    this.cards = this.allCards.filter((card) => card.contentArea?.title.toLowerCase().includes(this.searchTerm)
      || card.contentArea?.description.toLowerCase().includes(this.searchTerm));
  }

  handleSearch(event) {
    this.searchTerm = event.target.value.toLowerCase();
    if (this.searchTerm) {
      this.urlSearchParams.set('term', this.searchTerm);
    } else {
      this.urlSearchParams.delete('term');
    }
    this.handleUrlSearchParams();
    this.paginationCounter = 1;
    this.handleActions();
  }

  handleSortAction() {
    const sortFunctions = {
      newest: (a, b) => new Date(b.cardDate) - new Date(a.cardDate),
      oldest: (a, b) => new Date(a.cardDate) - new Date(b.cardDate),
    };
    // todo check is this sort valid or we should keep
    const sortKey = this.selectedSortOrder.key === 'most-recent' ? 'newest' : this.selectedSortOrder.key;
    // todo -> old one :     this.cards.sort(sortFunctions[this.selectedSortOrder.key]);
    this.cards.sort(sortFunctions[sortKey]);
  }

  handleSort(selectedItem) {
    this.toggleSort();

    if (selectedItem.key !== this.selectedSortOrder.key) {
      this.selectedSortOrder = selectedItem;

      this.paginationCounter = 1;
      this.handleActions();
    }
  }

  handleFilterAction() {
    const selectedFiltersKeys = Object.keys(this.selectedFilters);
    if (selectedFiltersKeys.length) {
      this.cards = this.cards.filter((card) => {
        if (!card.arbitrary.length) return;

        let cardArbitraryArr = [...card.arbitrary];
        const firstObj = card.arbitrary[0];
        if ('id' in firstObj && 'version' in firstObj) {
          cardArbitraryArr = cardArbitraryArr.slice(1);
        }
        // eslint-disable-next-line consistent-return
        return selectedFiltersKeys.every((key) => cardArbitraryArr.some((arbitraryTag) => {
          const arbitraryTagKey = Object.keys(arbitraryTag)[0]?.replaceAll(' ', '-');
          if (arbitraryTagKey !== key) return false;

          const arbitraryTagValue = this.getArbitraryTagValue(arbitraryTag, key);
          if (arbitraryTagValue) {
            // eslint-disable-next-line max-len
            return this.selectedFilters[key].some((selectedTag) => selectedTag.key === arbitraryTagValue);
          }
          return false;
        }));
      });
    } else {
      this.urlSearchParams.delete('filters');
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getArbitraryTagValue(arbitraryTag, key) {
    return arbitraryTag[key].replaceAll(' ', '-');
  }

  handleUrlSearchParams() {
    const url = new URL(window.location.href);

    const searchParamsString = this.urlSearchParams.toString();
    if (searchParamsString.length) {
      url.search = decodeURIComponent(searchParamsString);
    } else {
      url.search = '';
    }

    window.history.pushState({}, '', url);
  }

  handleTag(event, tag, filterKey) {
    if (!event.target.checked) {
      this.handleRemoveTag(tag);
      if (!Object.keys(this.selectedFilters).length) {
        this.handleFilterAction();
        this.handleUrlSearchParams();
      }
      return;
    }

    tag.checked = true;

    if (this.selectedFilters[filterKey]) {
      this.selectedFilters = {
        ...this.selectedFilters,
        [filterKey]: [...this.selectedFilters[filterKey], tag],
      };

      let filterSearchValue = this.urlSearchParams.get(filterKey);
      filterSearchValue += `,${tag.key}`;
      this.urlSearchParams.set(filterKey, filterSearchValue);
    } else {
      if (!Object.keys(this.selectedFilters).length) {
        this.urlSearchParams.append('filters', 'yes');
      }

      this.selectedFilters = {
        ...this.selectedFilters,
        [filterKey]: [tag],
      };

      this.urlSearchParams.append(filterKey, tag.key);
    }

    this.paginationCounter = 1;
    this.handleActions();
    this.handleUrlSearchParams();
  }

  handleRemoveTag(tag) {
    tag.checked = false;
    const { key: tagKey, parentKey: filterKey } = tag;

    // eslint-disable-next-line max-len
    const updatedFilterTags = [...this.selectedFilters[filterKey]].filter((filterTag) => filterTag.key !== tagKey);

    if (updatedFilterTags.length) {
      this.selectedFilters = {
        ...this.selectedFilters,
        [filterKey]: updatedFilterTags,
      };

      const filterSearchParams = this.urlSearchParams.get(filterKey).split(',');
      const updatedSearchFilterTags = filterSearchParams.filter((param) => param !== tagKey);
      this.urlSearchParams.set(filterKey, updatedSearchFilterTags.toString());
    } else {
      const { [filterKey]: _removedKeyFilters, ...updatedSelectedFilters } = this.selectedFilters;
      this.selectedFilters = updatedSelectedFilters;
      this.urlSearchParams.delete(filterKey);
    }

    this.paginationCounter = 1;
    this.handleFilterAction();
    this.handleActions();
    this.handleUrlSearchParams();
  }

  handleResetTags(filterKey) {
    const { [filterKey]: _removedKeyFilters, ...updatedSelectedFilters } = this.selectedFilters;
    this.selectedFilters = { ...updatedSelectedFilters };
    this.urlSearchParams.delete(filterKey);

    this.blockData.filters.forEach((filter) => {
      if (filter.key === filterKey) {
        // eslint-disable-next-line no-return-assign
        filter.tags.forEach((tag) => tag.checked = false);
      }
    });

    this.paginationCounter = 1;
    this.handleFilterAction();
    this.handleActions();
    this.handleUrlSearchParams();
  }

  countSelectedTags(filterKey) {
    if (!this.selectedFilters[filterKey]) {
      return {
        tagsString: '',
        tagsCount: 0,
      };
    }

    const tags = [...this.selectedFilters[filterKey]].map((tag) => tag.value);
    return {
      tagsString: tags.join(', '),
      tagsCount: tags.length,
    };
  }

  updatePaginatedCards() {
    const endIndex = this.paginationCounter * this.cardsPerPage;
    const startIndex = this.blockData.pagination === 'load-more' ? 0 : (this.paginationCounter - 1) * this.cardsPerPage;
    this.paginatedCards = this.cards.slice(startIndex, endIndex);
  }

  handleLoadMore() {
    this.paginationCounter += 1;
    this.handleActions();
  }

  handlePageNum(pageNum) {
    if (this.paginationCounter !== pageNum) {
      this.paginationCounter = pageNum;
      this.handleActions();
    }
  }

  handlePrevPage() {
    if (this.paginationCounter > 1) {
      this.paginationCounter -= 1;
      this.handleActions();
    }
  }

  handleNextPage() {
    if (this.paginationCounter < this.totalPages) {
      this.paginationCounter += 1;
      this.handleActions();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.updateView);
  }

  renderInfoBoxDescription() {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.blockData.filterInfoBox.description;
    return html`${tempDiv}`;
  }

  // eslint-disable-next-line class-methods-use-this
  getSlider() {}

  /* eslint-disable indent */
  render() {
    return html`
      ${this.fetchedData
        ? html`
          <div class="partner-cards">
            <div class="partner-cards-sidebar-wrapper">
              <div class="partner-cards-sidebar">
                <sp-theme class="search-wrapper" theme="spectrum" color="light" scale="medium">
                  ${this.searchInputLabel && !this.mobileView ? html`<sp-field-label for="search" size="m">${this.blockData.localizedText[this.searchInputLabel]}</sp-field-label>` : ''}
                  <sp-search id="search" size="m" value="${this.searchTerm}" @input="${this.handleSearch}"
                             @submit="${(event) => event.preventDefault()}"
                             placeholder="${this.blockData.localizedText[this.searchInputPlaceholder]}"></sp-search>
                </sp-theme>

                ${!this.mobileView
            ? html`
                    ${this.getSlider()}
                    <div class="sidebar-header">
                      <h3 class="sidebar-title">${this.blockData.localizedText['{{filter}}']}</h3>
                      <button class="sidebar-clear-btn" @click="${this.handleResetActions}"
                              aria-label="${this.blockData.localizedText['{{clear-all}}']}">
                        ${this.blockData.localizedText['{{clear-all}}']}
                      </button>
                    </div>
                    <div class="sidebar-chosen-filters-wrapper">
                      ${this.chosenFilters && this.chosenFilters.htmlContent}
                    </div>
                    <div class="sidebar-filters-wrapper">
                      ${this.filters}
                    </div>
                    ${this.blockData.filterInfoBox.title ? html` 
                      <div class="sidebar-info-box">
                      <div class="title">${this.blockData.filterInfoBox.title}</div>
                      ${this.renderInfoBoxDescription()}
                    </div>` : ''
              }
                  `
            : ''
          }
              </div>
            </div>
            <div class="partner-cards-content">
            ${this.getPartnerCardsHeader()}
              <div class="partner-cards-collection">
                ${this.hasResponseData
            ? this.partnerCards
            : html`
                    <div class="progress-circle-wrapper">
                      <sp-theme theme="spectrum" color="light" scale="medium">
                        <sp-progress-circle label="Cards loading" indeterminate="" size="l"
                                            role="progressbar"></sp-progress-circle>
                      </sp-theme>
                    </div>
                  `
          }
              </div>
              ${this.shouldDisplayPagination()
            ? html`
                  <div
                    class="pagination-wrapper ${this.blockData?.pagination === 'load-more' ? 'pagination-wrapper-load-more' : 'pagination-wrapper-default'}">
                    ${this.pagination}
                    <span
                      class="pagination-total-results">${this.cardsCounter} ${this.blockData.localizedText['{{of}}']} ${this.cards.length} ${this.blockData.localizedText['{{results}}']}</span>
                  </div>
                `
            : ''
          }
            </div>
          </div>` : ''}
      ${this.getFilterFullScreenView(this.mobileView && this.fetchData)}
    `;
  }

  shouldDisplayPagination() {
    return this.cards.length && this.blockData?.pagination !== 'disable';
  }

  getFilterFullScreenView(condition) {
    return condition ? html`
          <div class="all-filters-wrapper-mobile">
            <div class="all-filters-header-mobile">
              <button class="all-filters-header-back-btn-mobile" @click="${this.closeFiltersMobile}" aria-label="${this.blockData.localizedText['{{back}}']}"></button>
              <span class="all-filters-header-title-mobile">${this.blockData.localizedText['{{filter-by}}']}</span>
            </div>
            <div class="all-filters-list-mobile">
              ${this.filtersMobile}
            </div>
            <div class="all-filters-footer-mobile">
              <span class="all-filters-footer-results-mobile">${this.getTotalResults()} ${this.blockData.localizedText['{{results}}']}</span>
              <div class="all-filters-footer-buttons-mobile">
                <button class="all-filters-footer-clear-btn-mobile" @click="${this.handleResetActions}" aria-label="${this.blockData.localizedText['{{clear-all}}']}">${this.blockData.localizedText['{{clear-all}}']}</button>
                <sp-theme theme="spectrum" color="light" scale="medium">
                  <sp-button @click="${this.closeFiltersMobile}" aria-label="${this.blockData.localizedText['{{apply}}']}">${this.blockData.localizedText['{{apply}}']}</sp-button>
                </sp-theme>
              </div>
            </div>
          </div>
        `
      : '';
  }

  getPartnerCardsHeader() {
    return html`
      <div class="partner-cards-header">
        <div class="partner-cards-title-wrapper">
          <h3 class="partner-cards-title">${this.blockData.title}</h3>
          <span
            class="partner-cards-cards-results"><strong>${this.cards?.length}</strong> ${this.blockData.localizedText['{{results}}']}</span>
        </div>
        <div class="partner-cards-sort-wrapper">
          ${this.mobileView
        ? html`
              <button class="filters-btn-mobile" @click="${this.openFiltersMobile}"
                      aria-label="${this.blockData.localizedText['{{filters}}']}">
                <span class="filters-btn-mobile-icon"></span>
                <span class="filters-btn-mobile-title">${this.blockData.localizedText['{{filters}}']}</span>
                ${this.chosenFilters?.tagsCount
            ? html`<span class="filters-btn-mobile-total">${this.chosenFilters.tagsCount}</span>`
            : ''
          }
              </button>
            `
        : ''
      }
          ${this.blockData.sort.items.length
        ? html`
              <div class="sort-wrapper">
                <button class="sort-btn" @click="${this.toggleSort}">
                  <span class="sort-btn-text">${this.selectedSortOrder.value}</span>
                  <span class="filter-chevron-icon"></span>
                </button>
                <div class="sort-list">
                  ${this.sortItems}
                </div>
              </div>`
        : ''
      }
        </div>
      </div>
    `;
  }

  /* eslint-enable indent */
}
