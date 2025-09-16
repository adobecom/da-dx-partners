import { getLibs } from '../../scripts/utils.js';
import PartnerCards from '../../components/PartnerCards.js';
import { searchCardsStyles } from './SearchCardsStyles.js';
import '../../components/SearchCard.js';
import { generateRequestForSearchAPI } from '../utils/utils.js';

const miloLibs = getLibs();
const { html, repeat } = await import(`${miloLibs}/deps/lit-all.min.js`);
const SEE_ALL = 'SEE_ALL';

export default class Search extends PartnerCards {
  static styles = [
    PartnerCards.styles,
    searchCardsStyles,
  ];

  static properties = {
    ...PartnerCards.properties,
    contentType: { type: String },
    contentTypeCounter: { type: Object },
    typeaheadOptions: { type: Array },
    isTypeaheadOpen: { type: Boolean },
  };

  constructor() {
    super();
    this.contentType = 'all';
    this.contentTypeCounter = { countAll: 0, countAssets: 0, countPages: 0 };
    this.typeaheadOptions = [];
    this.isTypeaheadOpen = false;
  }

  // eslint-disable-next-line class-methods-use-this
  async fetchData() {
    // override in order to do nothing since
    // we will fetch data in handleActions which is called on each user action
  }

  // eslint-disable-next-line no-underscore-dangle
  get _typeaheadDialog() {
    return this.renderRoot.querySelector('dialog#typeahead');
  }

  // eslint-disable-next-line no-underscore-dangle
  get _searchInput() {
    return this.renderRoot.querySelector('#search');
  }

  // eslint-disable-next-line no-underscore-dangle
  get _dialog() {
    return this.renderRoot.querySelector('.suggestion-dialog');
  }

  async onSearchInput(event) {
    this.searchTerm = event.target.value;

    // Handle empty input
    if (!this.searchTerm) {
      this.closeTypeahead(SEE_ALL);
      return;
    }

    // Handle non-empty input
    await this.updateTypeaheadDialog();
  }

  async updateTypeaheadDialog() {
    try {
      if (!this.isTypeaheadOpen) {
        this.isTypeaheadOpen = true;
        // eslint-disable-next-line no-underscore-dangle
        this._typeaheadDialog.show();
        // eslint-disable-next-line no-underscore-dangle
        this._searchInput?.focus();
      }
      this.typeaheadOptions = await this.getSuggestions();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('There was a problem with your fetch operation:', error);
    }
  }

  closeTypeahead(value) {
    this.isTypeaheadOpen = false;
    // eslint-disable-next-line no-underscore-dangle
    this._typeaheadDialog.close(value);
    // eslint-disable-next-line no-underscore-dangle
    if (value !== SEE_ALL) {
      // eslint-disable-next-line no-underscore-dangle
      this.searchTerm = this._typeaheadDialog.returnValue;
    }
    this.handleSearch();
  }

  handleSearch() {
    if (this.searchTerm) {
      this.urlSearchParams.set('term', this.searchTerm);
    } else {
      this.urlSearchParams.delete('term');
    }
    this.handleUrlSearchParams();
    this.paginationCounter = 1;
    this.handleActions();
  }

  get typeaheadOptionsHTML() {
    function highlightFirstOccurrence(text, searchText) {
      if (!text || !searchText) return html`<p></p>`;
      const firstOccurrenceIndex = text.toLocaleLowerCase().indexOf(searchText.toLocaleLowerCase());
      if (firstOccurrenceIndex === -1) {
        return html`${text}`;
      }
      const beforeText = text.slice(0, firstOccurrenceIndex);
      const highlightedText = text.slice(
        firstOccurrenceIndex,
        firstOccurrenceIndex + searchText.length,
      );
      const afterText = text.slice(firstOccurrenceIndex + searchText.length);
      return html`${beforeText}<span class="bold">${highlightedText}</span>${afterText}`;
    }

    const optionItems = this.typeaheadOptions.map((o) => {
      const icon = o.type === 'asset' ? html`<span class="option-icon" style="background-image: url('/eds/img/icons/default.svg')"></span>` : '';
      return html`<p class="option" @click="${() => this.closeTypeahead(o.name)}">${icon}<span>${highlightFirstOccurrence(o.name, this.searchTerm)}<span><p>`;
    });
    return html`${optionItems}`;
  }

  // eslint-disable-next-line consistent-return
  async getSuggestions() {
    let data;
    try {
      const SUGGESTIONS_SIZE = 10;
      const response = await generateRequestForSearchAPI(
        {
          size: SUGGESTIONS_SIZE,
          sort: this.getSortValue(this.selectedSortOrder.key),
          from: 0,
          type: this.contentType,
          term: this.searchTerm,
          suggestions: 'true',
        },
        this.generateFilters(),
      );


      if (!response.ok) {
        throw new Error(`Error message: ${response.statusText}`);
      }

      data = await response.json();
      return data.suggested_completions;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('There was a problem with your fetch operation:', error);
    }
  }

  get partnerCards() {
    if (this.paginatedCards.length) {
      return html`${repeat(
        this.paginatedCards,
        (card) => card.id,
        (card) => html`<search-card class="card-wrapper" .data=${card} .localizedText=${this.blockData.localizedText} .ietf=${this.blockData.ietf}></search-card>`,
      )}`;
    }
    return html`<div class="no-results">
        <strong class="no-results-title">${this.blockData.localizedText['{{no-results-title}}']}</strong>
        <p class="no-results-description">${this.blockData.localizedText['{{no-results-description}}']}</p>
      </div>`;
  }

  // eslint-disable-next-line  class-methods-use-this
  getSortValue(sortKey) {
    const sortMap = { 'most-recent': 'recent', 'most-relevant': 'relevant' };
    return sortMap[sortKey];
  }

  // eslint-disable-next-line consistent-return
  async getCards() {
    const startCardIndex = (this.paginationCounter - 1) * this.cardsPerPage;
    let apiData;
    try {
      const response = await generateRequestForSearchAPI(
        {
          size: this.cardsPerPage,
          sort: this.getSortValue(this.selectedSortOrder.key),
          from: startCardIndex.toString(),
          type: this.contentType,
          term: this.searchTerm,
        },
        this.generateFilters(),
      );

      if (!response.ok) {
        throw new Error(`Error message: ${response.statusText}`);
      }

      apiData = await response.json();
      this.hasResponseData = !!apiData.cards;
      return apiData;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('There was a problem with your fetch operation:', error);
    }
  }

  generateFilters() {
    const filters = Object.fromEntries(
      Object.entries(this.selectedFilters).map(([key, arr]) => [
        key,
        arr.map((item) => item.key),
      ]),
    );
    return { filters };
  }

  async handleActions() {
    this.hasResponseData = false;
    this.additionalResetActions();
    const cardsData = await this.getCards();
    const { cards, count } = cardsData || { cards: [], count: { all: 0, assets: 0, pages: 0 } };
    this.cards = cards;
    if (this.blockData.pagination === 'load-more') {
      this.paginatedCards = this.paginatedCards.concat(cards);
    } else {
      this.paginatedCards = cards;
    }
    this.countAll = count.all;
    this.contentTypeCounter = {
      countAll: count.all,
      countAssets: count.assets,
      countPages: count.pages,
    };
    this.hasResponseData = true;
  }

  handleContentType(contentType) {
    if (this.contentType === contentType) return;
    this.contentType = contentType;

    this.paginationCounter = 1;
    this.handleActions();
  }

  getPageNumArray() {
    const countAll = this.getTotalResults();
    const numberOfPages = Math.ceil(countAll / this.cardsPerPage);
    this.totalPages = numberOfPages;
    // eslint-disable-next-line consistent-return
    return Array.from({ length: numberOfPages }, (value, index) => index + 1);
  }

  get cardsCounter() {
    const startIndex = (this.paginationCounter - 1) * this.cardsPerPage;
    const countAll = this.getTotalResults();
    const endIndex = startIndex + this.cardsPerPage;
    const lastCardIndex = countAll < endIndex
      ? countAll : endIndex;
    if (this.blockData.pagination === 'load-more') return lastCardIndex;

    return `${startIndex + 1} - ${lastCardIndex}`;
  }

  getTotalResults() {
    let countAll;
    switch (this.contentType) {
      case 'page':
        countAll = this.contentTypeCounter.countPages;
        break;
      case 'asset':
        countAll = this.contentTypeCounter.countAssets;
        break;
      default:
        countAll = this.contentTypeCounter.countAll;
    }
    return countAll;
  }

  handleEnter(event) {
    if (event.key === 'Enter') {
      this.closeTypeahead(SEE_ALL);
    }
  }

  handleClickOutside(event) {
    if (!this.isTypeaheadOpen) return;
    // eslint-disable-next-line no-underscore-dangle
    const dialog = this._dialog.getBoundingClientRect();
    // eslint-disable-next-line no-underscore-dangle
    const searchInput = this._searchInput.getBoundingClientRect();
    const isInDialog = (
      event.clientX >= dialog.left
        && event.clientX <= dialog.right
        && event.clientY >= dialog.top
        && event.clientY <= dialog.bottom
    );
    const isInSearch = (
      event.clientX >= searchInput.left
      && event.clientX <= searchInput.right
      && event.clientY >= searchInput.top
      && event.clientY <= searchInput.bottom
    );

    if (!isInDialog && !isInSearch) {
      // eslint-disable-next-line no-underscore-dangle
      this.closeTypeahead(SEE_ALL);
    }
  }

  shouldDisplayLoadMore() {
    return this.getTotalResults() !== this.paginatedCards.length;
  }

  additionalResetActions() {
    if (this.blockData.pagination === 'load-more' && this.paginationCounter === 1) {
      this.paginatedCards = [];
    }
  }

  /* eslint-disable indent */
  render() {
    return html`
      <div @click="${this.handleClickOutside}" class="search-box-wrapper" style="${this.blockData.backgroundColor ? `background: ${this.blockData.backgroundColor}` : ''}">
        <div class="search-box content">
          <h3 class="partner-cards-title">
            ${this.searchTerm && !this.isTypeaheadOpen
              ? `${this.blockData.localizedText['{{showing-results-for}}']} ${this.searchTerm}`
              : this.blockData.title
            }
          </h3>
          <sp-theme class="search-wrapper" theme="spectrum" color="light" scale="medium">
            <sp-search @keydown="${this.handleEnter}" id="search" size="m" value="${this.searchTerm}" @input="${this.onSearchInput}" @submit="${(event) => event.preventDefault()}" placeholder="${this.blockData.localizedText['{{search-topics-resources-files}}']}"></sp-search>
            <dialog class="suggestion-dialog-wrapper" @close="${this.dialogClosed}" id="typeahead">
              <div class="suggestion-dialog ">
                ${this.typeaheadOptionsHTML}
                <div class="option footer">
                  ${html`<p @click="${() => this.closeTypeahead(SEE_ALL)}">
                    ${this.blockData.localizedText['{{view-all-results}}']}</p>`}
                </div>
              </div>
            </dialog>
          </sp-theme>
        </div>

      </div>
      <div @click="${this.handleClickOutside}" class="content">
        <div class="partner-cards">
        <div class="partner-cards-sidebar-wrapper">
          <div class="partner-cards-sidebar">
            ${!this.mobileView
              ? html`
                <div class="sidebar-header">
                  <h3 class="sidebar-title">${this.blockData.localizedText['{{filters}}']}</h3>
                  <button class="sidebar-clear-btn" @click="${this.handleResetActions}" aria-label="${this.blockData.localizedText['{{clear-all}}']}">${this.blockData.localizedText['{{clear-all}}']}</button>
                </div>
                <div class="sidebar-chosen-filters-wrapper">
                  ${this.chosenFilters && this.chosenFilters.htmlContent}
                </div>
                <div class="sidebar-filters-wrapper">
                  ${this.filters}
                </div>
              `
              : ''
            }
          </div>
        </div>
        <div class="partner-cards-content">
          <div class="partner-cards-header">
            <div class="partner-cards-title-wrapper">
              ${this.blockData.localizedText['{{show}}']}:
              <sp-theme theme="spectrum" color="light" scale="medium">
                <sp-button variant="${this.contentType === 'all' ? 'primary' : 'secondary'}" size="m" @click="${() => this.handleContentType('all')}" aria-label="${this.blockData.localizedText['{{all}}']}">
                  ${this.blockData.localizedText['{{all}}']} (${this.contentTypeCounter.countAll})</sp-button>
                <sp-button variant="${this.contentType === 'asset' ? 'primary' : 'secondary'}" size="m" @click="${() => this.handleContentType('asset')}" aria-label="${this.blockData.localizedText['{{assets}}']}">
                  ${this.blockData.localizedText['{{assets}}']} (${this.contentTypeCounter.countAssets})</sp-button>
                <sp-button variant="${this.contentType === 'page' ? 'primary' : 'secondary'}" size="m" @click="${() => this.handleContentType('page')}" aria-label="${this.blockData.localizedText['{{pages}}']}">
                  ${this.blockData.localizedText['{{pages}}']} (${this.contentTypeCounter.countPages})</sp-button>
              </sp-theme>
            </div>
            <div class="partner-cards-sort-wrapper">
              ${this.mobileView
                ? html`
                  <button class="filters-btn-mobile" @click="${this.openFiltersMobile}" aria-label="${this.blockData.localizedText['{{filters}}']}">
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
                      <span class="filter-chevron-icon" />
                    </button>
                    <div class="sort-list">
                      ${this.sortItems}
                    </div>
                  </div>`
                : ''
              }
            </div>
          </div>
          <div class="partner-cards-collection">
            ${this.hasResponseData
              ? this.partnerCards
              : html`
                <div class="progress-circle-wrapper">
                  <sp-theme theme="spectrum" color="light" scale="medium">
                    <sp-progress-circle label="Cards loading" indeterminate="" size="l" role="progressbar"></sp-progress-circle>
                  </sp-theme>
                </div>
              `
            }
          </div>
          ${this.cards.length
            ? html`
              <div class="pagination-wrapper ${this.blockData?.pagination === 'load-more' ? 'pagination-wrapper-load-more' : 'pagination-wrapper-default'}">
                ${this.pagination}
                <span class="pagination-total-results">${this.cardsCounter} <span>${this.blockData.localizedText['{{of}}']} ${this.getTotalResults()} ${this.blockData.localizedText['{{results}}']}</span></span>
              </div>
            `
            : ''
          }
        </div>
      </div>
      </div>

      ${this.getFilterFullScreenView(this.mobileView)}
    `;
    }
  /* eslint-enable indent */
}
