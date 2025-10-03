import { getLibs } from '../../scripts/utils.js';

const miloLibs = getLibs();
const { css } = await import(`${miloLibs}/deps/lit-all.min.js`);

const borderColor = css`#eaeaea`;

// eslint-disable-next-line import/prefer-default-export
export const searchCardsStyles = css`
  .search-box-wrapper * {
    box-sizing: border-box;
  }
  
  .search-box-wrapper {
    background: transparent linear-gradient(96deg, #3D8BFF 0%, #9272FB 100%) 0% 0% no-repeat padding-box;
    margin-bottom: 30px;
    padding: 30px 0;
  }
  
  .content {
    display: block;
    max-width: var(--grid-container-width);
    margin: 0 auto;
  }
  
  .search-box-wrapper .search-box {
    background-color: #fff;
    padding: 20px;
    box-shadow: 0px 3px 6px #00000029;
    border: 1px solid #BCBCBC;
    border-radius: 12px;
  }

  .partner-cards {
    grid-template-columns: 269px auto;
  }

  @media screen and (max-width: 1200px) {
    .partner-cards {
      grid-template-columns: unset;
      display: grid;
      flex-direction: column;
      gap: 0;
    }
  }
  
  .search-box-wrapper .partner-cards-title {
    margin-bottom: 20px;
  }
  
  .partner-cards-sidebar {
    padding-left: 0;
    width: 269px;
    max-width: 269px;
  }

  @media screen and (max-width: 1200px) {
    .partner-cards-sidebar {
      width: 100%;
      max-width: 100%;
      padding: 0;
    }
  }
  
  .partner-cards-sidebar .sidebar-header {
    margin-bottom: 5px;
  }
  
  .partner-cards-header .partner-cards-title-wrapper {
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: bold;
  }
  
  .partner-cards-header .partner-cards-sort-wrapper .sort-wrapper {
    border-left : none;
  }
  
  .partner-cards-collection {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .partner-cards-collection .card-wrapper {
    min-height: 80px;
    width: 100%;
    border: 1px solid ${borderColor};
    border-radius: 4px;
    cursor: pointer;
  }
  
  .partner-cards-collection .card-wrapper:hover {
    box-shadow: 0px 2px 4px #00000029;
    border-color: #D3D3D3;
  }
  .suggestion-dialog-wrapper * {
    box-sizing: border-box;
  }
  .suggestion-dialog-wrapper {
    width: 100%;
    z-index: 10;
    background: transparent;
    border: none;
    max-width: var(--grid-container-width);
    padding: 5px 22px;
  }
  .suggestion-dialog-wrapper:focus-visible {
    outline: none
  }
  .suggestion-dialog-wrapper .suggestion-dialog {
    background-color: #fff;
    box-shadow: 0px 3px 6px #00000029;
    border: 1px solid #BCBCBC;
    border-radius: 4px;
    width: 100%;
  }
  .suggestion-dialog .option {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 14px;
    line-height: 1.6;
    padding: 5px 20px;
  }
  .suggestion-dialog .option-icon {
    flex-shrink: 0;
    height: 20px;
    width: 20px;
    background-repeat: no-repeat;
    background-position: 50% 50%;
    background-size: cover;
  }
  .suggestion-dialog .option:hover {
   color: blue;
  }
  .option span.bold {
    font-weight: bold;
  }
  .option.footer {
    color: blue;
  }
`;
