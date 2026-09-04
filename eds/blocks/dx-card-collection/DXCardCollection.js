import PartnerCardsWithDateFilter from '../../components/PartnerCardsWithDateFilter.js';
import { startsWithPath } from '../utils/utils.js';
import { DIGITALEXPERIENCE_PREVIEW_PATH } from '../utils/dxConstants.js';
import { getLibs, prodHosts } from '../../scripts/utils.js';
import { extractFilterData } from '../utils/caasUtils.js';

const miloLibs = getLibs();
const { processTrackingLabels } = await import(`${miloLibs}/martech/attributes.js`);
const { html, unsafeHTML } = await import(`${miloLibs}/deps/lit-all.min.js`);

export default class DXCardCollection extends PartnerCardsWithDateFilter {
  removeFiltersWithoutCards() {
    this.blockData.filters.forEach((filter) => {
      filter.tags = filter.tags.filter((tag) => this.cardFiltersSet.has(`${tag.parentKey}:${tag.key}`));
    });
    this.blockData.filters = this.blockData.filters
      .filter((filter) => filter.tags.length);
  }

  mergeTagAndArbitraryFilters(card) {
    const filterTagMap = new Map(
      this.blockData.filters.flatMap((filter) => filter.tags
        .map((tag) => [tag.hash, { [tag.parentKey]: tag.key }])),
    );

    // maybe add this only if regions filtering is enabled on collection
    const regionsTagMap = new Map(
      extractFilterData('caas:region', this.allTags).tags.map(
        (tag) => [tag.hash, { region: tag.key }],
      ),
    );

    card.arbitrary = card.arbitrary
      .concat(card.tags.map((cardTag) => filterTagMap.get(cardTag.id)).filter(Boolean))
      .concat(card.tags.map((cardTag) => regionsTagMap.get(cardTag.id)).filter(Boolean));
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
          card.arbitrary?.forEach((filter) => {
            if (Object.keys(filter).length === 0) {
              return;
            }
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

  /* eslint-enable indent */
  // eslint-disable-next-line class-methods-use-this
  filterByUserRegion(cards) {
    let returnValue;
    const userContryMappedToCaasTag = 'americas';
    if (userContryMappedToCaasTag) {
      returnValue = cards.filter((card) => {
        if (!card.arbitrary.length) return true;

        let cardArbitraryArr = [...card.arbitrary];
        const firstObj = card.arbitrary[0];
        if ('id' in firstObj && 'version' in firstObj) {
          cardArbitraryArr = cardArbitraryArr.slice(1);
        }
        const isAsset = startsWithPath(card.contentArea.url, DIGITALEXPERIENCE_PREVIEW_PATH);
        // eslint-disable-next-line consistent-return
        if (!isAsset) return true;
        const cardRegions = cardArbitraryArr.filter((el) => el.region).map((el) => el.region);

        const cardHasUserRegion = cardRegions && cardRegions.some(
          (region) => region === userContryMappedToCaasTag,
        );
        const cardHasNoRegion = !cardRegions || cardRegions.length === 0;
        // eslint-disable-next-line consistent-return
        return cardHasUserRegion || cardHasNoRegion;
      });
    }
    return returnValue;
  }

  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  onDataFetched(apiData) {
    apiData.cards = this.filterByUserRegion(apiData.cards);
  }

  getPartnerCardsHeader() {
    return html`
      <div class="partner-cards-header">
        <div class="partner-cards-title-wrapper">
          <h3 class="partner-cards-title">${this.blockData.title}</h3>
          ${this.blockData.pagination !== 'disable'
    ? html`<span
            class="partner-cards-cards-results"><strong>${this.cards?.length}</strong> ${this.blockData.localizedText['{{results}}']}</span>`
    : ''
}

        </div>
        <div class="partner-cards-sort-wrapper ${this.blockData.filtersPanel === 'disable' ? 'filters-disabled' : ''}">
          ${this.mobileView && this.blockData.filtersPanel !== 'disable'
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
              <div class="sort-wrapper ${this.blockData.pagination === 'disable' ? 'border-disabled' : ''}">
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

  shouldDisplayPagination() {
    return this.cards.length && this.blockData?.pagination !== 'disable';
  }

  get filtersLabel() {
    return Object.keys(this.selectedFilters).length > 0
      ? Object.values(this.selectedFilters).flat().map((item) => item.value).join(', ')
      : 'No Filters';
  }

  /* eslint-disable indent */
  render() {
    return html`
      ${this.fetchedData
      ? html`
          <div class="partner-cards ${this.blockData.filtersPanel === 'disable' ? 'filters-disabled' : ''}"
            daa-lh="Card Collection | Filters: ${processTrackingLabels(this.filtersLabel)} | Search Query: ${processTrackingLabels(this.searchTerm.trim() ? this.searchTerm : 'None')}"
          >
          ${this.blockData.filtersPanel === 'disable'
        ? ''
        : html`
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
                              <div class="title">${unsafeHTML(this.blockData.filterInfoBox.title)}</div>
                              ${unsafeHTML(this.blockData.filterInfoBox.description)}
                            </div>` : ''
          }
                        `
          : ''
        }
                  </div>
                </div>
              `
      }
          <div class="partner-cards-content">
            ${this.getPartnerCardsHeader()}
            <div class="partner-cards-collection ${this.blockData.filtersPanel === 'disable' ? 'layout-4-up' : ''}">
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
}
