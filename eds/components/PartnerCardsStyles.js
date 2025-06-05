import { getLibs } from '../scripts/utils.js';

const miloLibs = getLibs();
const { css } = await import(`${miloLibs}/deps/lit-all.min.js`);

const borderColor = css`#eaeaea`;
const blueColor = css`#1473e6`;
const grayColor = css`#F5F5F5`;

export const partnerCardsStyles = css`
  h3, p, span, button, li, input {
    margin: 0;
    font-family: adobe-clean, Segoe UI, Roboto, sans-serif;
  }
  
  .partner-cards,
  .partner-cards *,
  .all-filters-wrapper-mobile,
  .all-filters-wrapper-mobile * {
    box-sizing: border-box;
  }
  
  .partner-cards {
    width: 100%;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 204px auto;
    gap: 32px;
  }
  
  @media screen and (max-width: 1200px) {
    .partner-cards {
      grid-template-columns: unset;
      display: grid;
      flex-direction: column;
      gap: 0;
    }
  }
  
  .partner-cards-sidebar {
    display: flex;
    flex-direction: column;
    width: 204px;
    max-width: 204px;
    margin-right: 32px;
    padding: 8px 16px 16px;
    border-radius: 4px;
    overflow: visible;
  }
  
  @media screen and (max-width: 1200px) {
    .partner-cards-sidebar {
      width: 100%;
      max-width: 100%;
      padding: 0;
    }
  }
  
  .partner-cards-sidebar .sidebar-header {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid ${borderColor};
    padding-bottom: 5px;
    margin-bottom: 20px;
    order: 1;
  }
  
  .partner-cards-sidebar .sidebar-title {
    color: #323232;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.1875rem;
  }
  
  .partner-cards-sidebar .sidebar-clear-btn {
    color: #9d9d9d;
    font-size: .875rem;
    line-height: 1rem;
    font-weight: 700;
    background-color: transparent;
    border: none;
    transition: color .3s ease-in-out;
  }
  
  .partner-cards-sidebar .sidebar-clear-btn:hover {
    cursor: pointer;
    color: ${blueColor};
  }
  
  .partner-cards-sidebar .search-wrapper {
    padding-bottom: 10px;
    order: 2;
  }
  
  .partner-cards-sidebar .sidebar-chosen-filters-wrapper {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    order: 3;
  }
  .partner-cards-sidebar .sidebar-info-box {
    order: 4;
    background-color: ${grayColor};
    font-size: 14px;
    font-family: inherit;
    margin-top: 24px;
    padding: 16px;
    line-height: 21px;
  }
  
  .partner-cards-sidebar .sidebar-info-box br {
    content: "";
    display: block;
  }
  .partner-cards-sidebar .sidebar-info-box .title {
    margin-bottom: 8px;
    font-size: 16px;
    font-weight: bold;
    line-height: 24px;
  }
  
  .partner-cards-sidebar .sidebar-chosen-filter-btn {
    background-color: transparent;
    border: 2px solid transparent;
    border-radius: 4px;
    font-size: .75rem;
    line-height: 1.375rem;
    color: #747474;
    margin-right: 7px;
    margin-bottom: 5px;
    padding: 0 20px 0 8px;
    word-break: break-word;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    position: relative;
    max-width: 100%;
    cursor: pointer;
  }
  
  .partner-cards-sidebar .sidebar-chosen-filter-btn:focus {
    border-color: ${blueColor};
  }
  
  .partner-cards-sidebar .sidebar-chosen-filter-btn:after {
    padding-left: 3px;
    content: "\\00d7";
    font-size: .875rem;
    position: absolute;
    right: 7px;
    top: 0;
    width: 10px;
  }
  
  .partner-cards-sidebar .sidebar-filters-wrapper {
    padding-top: 10px;
    order: 4;
  }
  
  .partner-cards-sidebar .filter {
    border-top: 1px solid ${borderColor};
    background-color: #fff;
    position: relative;
  }
  
  .partner-cards-sidebar .filter:last-child {
    border-bottom: 1px solid ${borderColor};
  }
  
  .partner-cards-sidebar .filter .filter-header {
    border: none;
    background-color: transparent;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    color: #464646;
    transition: color .3s ease-in-out;
    padding: 12px 5px 14px 0;
  }
  
  .partner-cards-sidebar .filter .filter-header:hover {
    cursor: pointer;
    color: #707070;
  }
  
  .partner-cards-sidebar .filter .filter-label {
    font-size: .875rem;
    line-height: 1rem;
    font-weight: 700;
    text-align: left;
    max-width: 122px;
  }
  
  .partner-cards-sidebar .filter .filter-chevron-icon {
    border: solid #bcbcbc;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 3px;
    transform: rotate(45deg);
    margin-top: 2px;
  }
  
  .partner-cards-sidebar .filter .filter-selected-tags-count-btn {
    position: absolute;
    top: 8px;
    right: 18px;
    border: none;
    background-color: ${blueColor};
    min-width: 24px;
    min-height: 24px;
    max-width: 34px;
    padding: 4px 5px;
    color: #fff;
    font-size: .875rem;
    line-height: .875rem;
    font-weight: 700;
    word-break: break-word;
    text-align: center;
    white-space: nowrap;
    text-overflow: ellipsis;
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
  }
  
  .partner-cards-sidebar .filter .filter-selected-tags-count-btn:focus {
    border: 2px solid #1492e6;
  }
  
  .partner-cards-sidebar .filter .filter-selected-tags-count-btn.hidden {
    display: none;
  }
  
  .partner-cards-sidebar .filter .filter-selected-tags-count-btn:hover .filter-selected-tags-total-num {
    display: none;
  }
  
  .partner-cards-sidebar .filter .filter-selected-tags-count-btn:hover::after {
    content: "\\00d7";
    font-size: 1rem;
  }
  
  .partner-cards-sidebar .filter.expanded .filter-chevron-icon {
    transform: rotate(-135deg);
    margin-top: 5px;
  }
  
  .partner-cards-sidebar .filter .filter-list {
    display: none;
    padding: 0;
    padding-bottom: 14px;
    margin: 0;
    list-style-type: none;
  }
  
  .partner-cards-sidebar .filter.expanded .filter-list {
    display: block;
  }
  
  .partner-cards-sidebar .filter-list li sp-checkbox {
    padding: 0 3px;
    font-size: .875rem;
    line-height: 1rem;
    width: 100%;
    overflow-wrap: anywhere;
  }
  
  .partner-cards-sidebar .filter-list li:hover {
    background-color: #2c2c2c0a;
  }
  
  .partner-cards-content {
    display: block;
    position: relative;
  }
  
  @media screen and (max-width: 1200px) {
    .partner-cards-content {
      width: 100%;
    }
  }
 
  .partner-cards-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 28px;
    min-height: 40px;
  }
  
  @media screen and (max-width: 1200px) {
    .partner-cards-header {
      flex-direction: column-reverse;
      padding-bottom: 16px;
    }
  }
  
  .partner-cards-header .partner-cards-title-wrapper {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .partner-cards-header .partner-cards-title-wrapper .partner-cards-title {
    color: #323232;
    font-size: 1.125rem;
    font-weight: 700;
    line-height: 1.375rem;
    word-break: break-word;
    padding-right: 5px;
    margin-right: 10px;
  }
  
  .partner-cards-header .partner-cards-title-wrapper .partner-cards-cards-results {
    padding: 4px 0;
    max-height: 3.9375rem;
    color: #505050;
    font-size: .875rem;
    line-height: 1.3125rem;
    min-width: 80px;
    text-transform: lowercase;
    text-align: right;
  }
  
  @media screen and (max-width: 1200px) {
    .partner-cards-header .partner-cards-title-wrapper .partner-cards-cards-results {
      border-right: none;
      margin-right: 0;
      padding-right: 0;
      text-align: right;
    }
  }
  
  .partner-cards-header .partner-cards-sort-wrapper {
    margin-right: -2px;
  }
  
  @media screen and (max-width: 1200px) {
    .partner-cards-header .partner-cards-sort-wrapper {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }
  
  .partner-cards-header .partner-cards-sort-wrapper .filters-btn-mobile {
    min-height: 34px;
    background-color: #f4f4f4;
    color: #323232;
    border: none;
    padding: 0;
    display: inline-flex;
    align-items: center;
    min-width: 89px;
    max-width: 100%;
    margin-bottom: 10px;
    padding: 0 0 0 11px;
    border-radius: 5px;
    font-size: .875rem;
    line-height: 1.875rem;
    font-weight: 700;
    word-break: break-word;
    text-align: left;
    text-transform: capitalize;
    cursor: pointer;
  }
  
 .partner-cards-header .partner-cards-sort-wrapper .filters-btn-mobile-icon {
    display: block;
    min-width: 18px;
    width: 18px;
    height: 18px;
    margin-right: 8px;
    background-color: #fff;
    background: no-repeat url(/eds/img/icons/filters.svg) 0 0;
  }
  
  .partner-cards-header .partner-cards-sort-wrapper .filters-btn-mobile-title {
    display: block;
    max-width: 100%;
    white-space: nowrap;
    text-overflow: ellipsis;
    padding-right: 7px;
    overflow: hidden;
  }
  
  .partner-cards-header .partner-cards-sort-wrapper .filters-btn-mobile-total {
    display: block;
    max-width: 40%;
    padding-left: 8px;
    padding-right: 7px;
    border-left: 1px solid #505050;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  
  .partner-cards-header .partner-cards-sort-wrapper .sort-wrapper {
    position: relative;
    border-left: 1px solid ${borderColor};
    margin-left: 20px;
    padding-left: 20px;
  }
  
  @media screen and (max-width: 1200px) {
    .partner-cards-header .partner-cards-sort-wrapper .sort-wrapper {
      border-left: none;
      padding-left: 0;
    }
  }
  
  .partner-cards-header .partner-cards-sort-wrapper .sort-btn {
    padding-right: 4px;
    padding-left: 0;
    width: 100%;
    max-width: 140px;
    background-color: #fff;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
  }
  
  .partner-cards-header .partner-cards-sort-wrapper .sort-btn .sort-btn-text {
    font-size: .875rem;
    line-height: 1.875rem;
    color: #505050;
    word-break: break-word;
    text-align: left;
    text-transform: capitalize;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .partner-cards-header .partner-cards-sort-wrapper .sort-btn .filter-chevron-icon {
    border: solid #505050;
    border-width: 0 1px 1px 0;
    display: inline-block;
    padding: 3px;
    transform: rotate(45deg);
    margin-left: 15px;
    margin-bottom: 2px;
  }
  
  .partner-cards-header .partner-cards-sort-wrapper .sort-list {
    display: none;
  }
  
  .partner-cards-header .partner-cards-sort-wrapper .sort-list.expanded {
    position: absolute;
    display: block;
    right: 0;
    top: 30px;
    z-index: 2;
    background-color: #fff;
    border-radius: 5px;
    border: 1px solid #eaeaea;
    box-shadow: 0 3px 15px rgba(80, 80, 80, .1);
    max-width: 200px;
    min-width: 150px;
    display: flex;
    flex-direction: column;
  }
  
  .partner-cards-header .partner-cards-sort-wrapper .sort-list .sort-item {
    background-color: #fff;
    border: none;
    padding: 10px 15px;
    text-align: left;
    cursor: pointer;
    color: #505050;
    text-transform: capitalize;
  }
  
  .partner-cards-header .partner-cards-sort-wrapper .sort-list .sort-item:first-child {
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
  }
  
  .partner-cards-header .partner-cards-sort-wrapper .sort-list .sort-item:last-child {
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
  }
  
  .partner-cards-header .partner-cards-sort-wrapper .sort-list .sort-item:hover {
    background-color: #f4f4f4;
  }
  
  .partner-cards-header .partner-cards-sort-wrapper .sort-list .sort-item.selected {
    color: ${blueColor};
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-10 -10 34 34' aria-hidden='true' role='img' fill='%231473e6' aria-label='Checkmark300' width='30' height='30' %3E%3Cpath d='M5.102 12.514a1.09 1.09 0 0 1-.834-.39L.988 8.19A1.085 1.085 0 0 1 2.656 6.8l2.421 2.906 6.243-7.947a1.085 1.085 0 0 1 1.707 1.34L5.955 12.1a1.09 1.09 0 0 1-.838.415z'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right;
  }

  .partner-cards-collection {
    display: grid;
    justify-content: center;
    width: 100%;
    max-width: 100%;
    grid-template-columns: repeat(auto-fit, minmax(300px, max-content));
    gap: 32px;
  }
  
  .partner-cards-collection .card-wrapper {
    min-height: 380px;
    width: 378px;
    max-width: 100%;
    position: relative;
  }

  .partner-cards-collection .single-partner-card--half-height {
    min-height: 208px;
  }
  
  .partner-cards-collection .no-results {
    padding-top: 20px;
    width: 100%;
    color: #505050;
    text-align: center;
  }
  
  .partner-cards-collection .no-results .no-results-title {
    font-size: 1.125rem;
    line-height: 1.6875rem;
    font-weight: 400;
    margin-bottom: 20px;
  }
  
  .partner-cards-collection .no-results .no-results-description {
    font-size: .875rem;
    line-height: 1.3125rem;
  }
  
  .progress-circle-wrapper {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 150px;
  }
  
  .pagination-wrapper {
    display: flex;
    align-items: center;
    font-size: 0.875rem;
    padding-top: 20px;
  }
  
  @media screen and (max-width: 1200px) {
    .pagination-wrapper {
      justify-content: center;
    }
  }
  
  .pagination-wrapper > * {
    padding: 5px 0;
  }
  
  .pagination-wrapper .pagination-total-results {
    font-weight: 700;
    text-transform: lowercase;
  }

  .pagination-wrapper .pagination-total-results span {
    font-weight: 500;
  }
  
  @media screen and (max-width: 1200px) {
    .pagination-wrapper .pagination-total-results {
      display: none;
    }
  }
  
  .all-filters-wrapper-mobile,
  .all-filters-wrapper-mobile.open {
    display: none;
  }
  
  @media screen and (max-width: 1200px) {
    .all-filters-wrapper-mobile.open {
      position: fixed;
      z-index: 10000000;
      display: flex;
      flex-direction: column;
      width: 100%;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #fff;
      height: 100vh;
      overflow: visible;
    }
  }
  
  .all-filters-wrapper-mobile .all-filters-header-mobile {
    display: flex;
    align-items: center;
    padding: 14px 12px;
    border-bottom: 1px solid #eaeaea;
  }
  
  .all-filters-wrapper-mobile .all-filters-header-back-btn-mobile {
    width: 32px;
    height: 32px;
    margin-right: 13px;
    font-size: 0;
    line-height: 0;
    border: none;
    border-radius: 50%;
    background: transparent url(/eds/img/icons/back.svg) no-repeat 50% 50%;
    outline: 0;
    cursor: pointer;
  }
  
  .all-filters-wrapper-mobile .all-filters-header-title-mobile {
    font-size: 1rem;
    line-height: 1.1875rem;
    font-weight: 400;
    color: #505050;
    font-style: normal;
    word-break: break-word;
    text-align: left;
  }
  
  .all-filters-wrapper-mobile .all-filters-header-title-mobile:first-letter {
    text-transform: uppercase;
  }
  
  .all-filters-wrapper-mobile .all-filters-list-mobile {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
    height: 100%;
  }
  
  .all-filters-wrapper-mobile .filter-wrapper-mobile {
    width: 100%;
    display: flex;
  }
  
  .filter-wrapper-mobile.expanded {
    position: fixed;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: 100%;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    margin: auto;
    z-index: 4;
    background-color: rgba(80, 80, 80, .8);
  }
  
  .filter-wrapper-mobile .filter-mobile {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    background-color: #fff;
    border-radius: 4px;
  }
  
  .filter-wrapper-mobile.expanded .filter-mobile {
    max-height: 90vh;
  }
  
  @media screen and (min-width: 769px) and (max-width: 1200px) {
     .filter-wrapper-mobile.expanded .filter-mobile {
        width: 70vw;
     }
  }
  
 @media screen and (max-width: 768px) {
   .filter-wrapper-mobile.expanded .filter-mobile {
      width: 100%;
      margin-left: 20px;
      margin-right: 20px;
   }
  }
  
  .filter-wrapper-mobile .filter-header-mobile {
    background-color: transparent;
    border: none;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    cursor: pointer;
    border-bottom: 1px solid #eaeaea;
  }
  
  .filter-wrapper-mobile.expanded .filter-header-mobile {
    padding: 20px;
    width: 100%;
  }
  
  .filter-wrapper-mobile .filter-header-content-mobile {
    width: calc(100% - 24px);
  }
  
  .filter-wrapper-mobile .filter-header-name-mobile {
    font-size: 1rem;
    line-height: 1.1875rem;
    font-weight: 700;
    color: #505050;
    word-break: break-word;
    text-align: left;
    text-transform: capitalize;
    text-decoration: none;
  }
  
  .filter-wrapper-mobile .filter-header-selected-tags-mobile {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
    padding-right: 18px;
    font-size: .875rem;
    line-height: 1rem;
    color: #959595;
  }
  
  .filter-wrapper-mobile.expanded .filter-header-selected-tags-mobile {
    display: none;
  }
  
  .filter-wrapper-mobile .filter-header-selected-tags-text-mobile {
    margin-top: 4px;
    padding-right: 12px;
    font-size: .875rem;
    line-height: 1rem;
    font-weight: 400;
    color: #959595;
    word-break: break-word;
    text-align: left;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  
  .filter-wrapper-mobile .filter-header-selected-tags-count-mobile {
    min-width: 30px;
  }
  
  .filter-wrapper-mobile .filter-header-chevron-icon {
    border: solid #bcbcbc;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 3px;
    transform: rotate(-45deg);
  }

  .filter-wrapper-mobile.expanded .filter-header-chevron-icon {
    display: none;
  }
  
  .filter-wrapper-mobile .filter-tags-mobile {
    display: none;
  }
  
  .filter-wrapper-mobile.expanded .filter-tags-mobile {
    width: 100%;
    list-style-type: none;
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 0;
    margin: 0;
    overflow-y: auto;
    height: 50vh;
  }
  
  .filter-wrapper-mobile.expanded .filter-tags-mobile li {
    padding: 0 20px;
  }
  
  .filter-wrapper-mobile.expanded .filter-tags-mobile li:hover {
    background-color: #2c2c2c0a;
  }
  
  .filter-wrapper-mobile.expanded .filter-tags-mobile sp-checkbox {
    width: 100%;
    overflow-wrap: anywhere;
  }
  
  .filter-wrapper-mobile .filter-footer-mobile-wrapper {
    display: none;
  }
  
  .filter-wrapper-mobile.expanded .filter-footer-mobile-wrapper {
  display: block;
    width: 100%;
    border-top: 1px solid #eaeaea;
  }
  
  .filter-wrapper-mobile.expanded .filter-footer-mobile {
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .filter-wrapper-mobile.expanded .filter-footer-buttons-mobile {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .all-filters-wrapper-mobile .all-filters-footer-mobile {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #eaeaea;
    padding: 16px 20px;
    position: sticky;
    bottom: env(safe-area-inset-bottom);
    background-color: #fff;
  }
  
  .all-filters-wrapper-mobile .all-filters-footer-results-mobile,
  .filter-wrapper-mobile .filter-footer-results-mobile {
    font-size: .875rem;
    line-height: 1rem;
    font-weight: 700;
    word-break: break-word;
    text-align: left;
  }
  
  .all-filters-wrapper-mobile .all-filters-footer-buttons-mobile {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  
  .all-filters-wrapper-mobile .all-filters-footer-clear-btn-mobile, 
  .filter-wrapper-mobile .filter-footer-clear-btn-mobile {
    border: none;
    background-color: transparent;
    color: ${blueColor};
    font-size: .875rem;
    line-height: 1rem;
    height: 1.2rem;
    font-weight: 700;
    word-break: break-word;
    margin-right: 17px;
    cursor: pointer;
    padding: 0;
    border-bottom: 2px solid transparent;
  }
  
  .all-filters-wrapper-mobile .all-filters-footer-clear-btn-mobile:focus {
    border-color: ${blueColor};
  }
  
  .filter-info {
    display: flex;
    margin: 0 15px 5px 0;
  }
  
  .info-icon {
    height: 18px;
    width: 18px;
    background-repeat: no-repeat;
    background-position: 50% 50%;
    background-size: cover;
    margin: 5px 10px 0 3px;
    flex-shrink: 0;
  }
  .filter-info-text {
    font-family: inherit;
    font-size: var(--type-body-xs-size);
    line-height: 17px;
  }
  .filter-wrapper-mobile .filter-info {
    display: none;
  }
  .filter-wrapper-mobile.expanded .filter-info {
    display: flex;
    width: 100%;
    margin: 0;
    padding: 10px 20px;
  }
  .filter-wrapper-mobile.expanded .info-icon {
    margin-top: 0;
    margin-left: 0;
  }
`;

export const partnerCardsLoadMoreStyles = css`
  .pagination-wrapper.pagination-wrapper-load-more {
    justify-content: center;
    flex-direction: column-reverse;
  }
  
  .pagination-wrapper-load-more .load-more-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: .875rem;
    line-height: 1.063rem;
    font-weight: 700;
    min-width: 60px;
    max-width: 100%;
    height: 32px;
    max-height: 32px;
    padding-left: 14px;
    padding-right: 14px;
    color: #222222;
    border: 2px solid #222222;
    border-radius: 16px;
    background-color: #ffffff00;
    cursor: pointer;
    transition: border-color .3s ease-in-out,background-color .3s ease-in-out;
  }
  @media (hover: hover) {
    .pagination-wrapper-load-more .load-more-btn:hover {
      text-decoration: none;
      border-color: #222222;
      background-color: #222222;
      color: #ffffff;
    }
  }
`;

export const partnerCardsPaginationStyles = css`
  .pagination-wrapper.pagination-wrapper-default {
    flex-wrap: wrap;
    justify-content: space-between;
  }

  @media screen and (max-width: 1200px) {
    .pagination-wrapper.pagination-wrapper-default {
      justify-content: center;
    }
  }

  .pagination-wrapper-default .pagination-pages-list button {
    border: none;
    background-color: transparent;
  }

  .pagination-wrapper-default .page-btn {
    position: relative;
    min-width: 32px;
    min-height: 32px;
    max-width: 70px;
    padding: 8px 10px;
    font-size: .875rem;
    line-height: .875rem;
    color: #4b4b4b;
    word-break: break-word;
    text-align: center;
    white-space: nowrap;
    text-overflow: ellipsis;
    border-radius: 16px;
    overflow: hidden;
  }

  .pagination-wrapper-default .pagination-prev-btn {
    padding-right: 10px;
    font-weight: 700;
  }

  .pagination-wrapper-default .pagination-next-btn {
    padding-left: 10px;
    font-weight: 700;
  }

  .pagination-wrapper-default .pagination-prev-btn:hover,
  .pagination-wrapper-default .pagination-next-btn:hover,
  .pagination-wrapper-default .page-btn:hover {
    cursor: pointer;
    text-decoration: underline;
    transition: all .3s;
  }

  .pagination-wrapper-default .pagination-prev-btn.disabled,
  .pagination-wrapper-default .pagination-prev-btn.disabled:hover,
  .pagination-wrapper-default .pagination-next-btn.disabled,
  .pagination-wrapper-default .pagination-next-btn.disabled:hover,
  .pagination-wrapper-default .page-btn.selected:hover {
    text-decoration: none;
    cursor: default;
  }

  .pagination-wrapper-default .pagination-prev-btn.disabled,
  .pagination-wrapper-default .pagination-next-btn.disabled {
    color: #9d9d9d;
  }

  .pagination-wrapper-default .page-btn.selected {
    background-color: #e5e5e5;
    border-radius: 50%;
  }
`;

export const partnerCardsDateFilterStyles = css`
  .date-filter-tag {
    background-color: transparent;
    border: none;
    padding: 0 6px;
    height: 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    cursor: pointer;
  }

  .date-filter-tag-label {
    width: calc(100% - 12px);
    font-size: .875rem;
    line-height: 1.3;
    text-align: left;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .date-filter-tag-checkmark {
    color: ${blueColor};
    width: 12px;
    height: 12px;
  }
`;

export const singlePartnerCardStyles = css`
  .single-partner-card * {
    box-sizing: border-box;
  }

  .single-partner-card, 
  .single-partner-card-half-height {
    display: flex;
    flex-direction: column;
    background-color: #fff;
    border: 1px solid ${borderColor};
    border-radius: 4px;
    overflow: hidden;
    width: 100%;
    height: 400px;
  }

  .single-partner-card--half-height {
    height: 208px;
    text-decoration: none;
  }

  .single-partner-card:hover {
    box-shadow: 0 3px 6px 0 rgba(0,0,0,.16);
    transition: box-shadow .3s ease-in-out;
  }

  .single-partner-card .card-header, 
  .single-partner-card--half-height {
    min-height: 192px;
    max-height: 192px;
    background-color: #323232;
    background-repeat: no-repeat;
    background-position: 50% 50%;
    background-size: cover;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    position: relative;
  }

  .single-partner-card--half-height {
    min-height: 208px;
    max-height: 208px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  .single-partner-card--half-height::after {
    content: '';
    position: absolute;
    inset: 0;
    background: transparent linear-gradient(180deg,rgba(0,0,0,.1) 10%,rgba(0,0,0,.8) 80%) 0 0 no-repeat;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;    
  }

  .single-partner-card:hover .card-header:after {
    opacity: 1;
  }

  .single-partner-card .card-header:after {
    position: absolute;
    content: "";
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    margin: auto;
    z-index: 0;
    background-color: rgba(0,0,0,.35);
    opacity: 0;
    transition: opacity .3s ease-in-out;
  }

  .single-partner-card .card-content {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: #fff;
    padding: 16px 16px 20px;
    height: 100%;
  }

  .single-partner-card .card-title, 
  .single-partner-card--half-height .card-title {
    color: #323232;
    font-size: 1.125rem;
    font-weight: 700;
    line-height: 1.375rem;
    word-break: break-word;
    max-height: 2.75rem;
    margin: 0 0 7px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    -webkit-line-clamp: 2;
  }

  .single-partner-card--half-height .card-title {
    color: #fff;
    z-index: 1;
    padding: 8px 24px 32px;
  }

  .single-partner-card .card-description {
    color: #505050;
    font-size: .875rem;
    line-height: 1.3125rem;
    font-weight: 400;
    word-break: break-word;
    margin: 0 0 14px;
    max-height: 3.9375rem;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    -webkit-line-clamp: 3;
  }

  .single-partner-card .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .single-partner-card .card-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: .875rem;
    line-height: 1.063rem;
    font-weight: 700;
    min-width: 60px;
    max-width: 100%;
    height: 28px;
    max-height: 32px;
    margin-left: 16px;
    padding-left: 14px;
    padding-right: 14px;
    text-decoration: none;
    color: #222222;
    border: 2px solid #222222;
    border-radius: 16px;
    background-color: #ffffff00;
    cursor: pointer;
    transition: border-color .3s ease-in-out,background-color .3s ease-in-out;
  }

  .single-partner-card .card-btn:hover {
    text-decoration: none;
    border-color: #222222;
    background-color: #222222;
    color: #ffffff;
  }

  .single-partner-card .card-date {
    color: #747474;
    font-size: .875rem;
    line-height: 1.3125rem;
    word-break: break-word;
    max-height: 3.9375rem;
    padding: 0;
  }
`;
