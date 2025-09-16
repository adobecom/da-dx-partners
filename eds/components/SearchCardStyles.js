import { getLibs } from '../scripts/utils.js';

const miloLibs = getLibs();
const { css } = await import(`${miloLibs}/deps/lit-all.min.js`);

const searchCardStyles = css`
  .search-card * {
    box-sizing: border-box;
  }
  
  .search-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 16px;
  }
  
  .search-card .card-header {
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .card-header .card-title-wrapper {
    display: flex;
    align-items: center;
  }
  
  .card-title-wrapper .card-chevron-icon {
    border: solid #747474;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 3px;
    transform: rotate(-45deg);
    width: 5px;
    height: 5px;
  }
  
  .card-title-wrapper .file-icon {
    height: 40px;
    width: 40px;
    background-repeat: no-repeat;
    background-position: 50% 50%;
    background-size: cover;
    margin: 0 20px;
    flex-shrink: 0;
  }
  
  .card-title-wrapper .card-title {
    font-size: 16px;
    font-weight: bold;
  }
  
  .card-header .card-icons {
    z-index: 1;
    flex-shrink: 0;
  }
  
  .search-card .card-content {
    display:none;
  }
  
  .search-card.expanded .card-content {
    display: flex;
    padding-top: 20px;
  }
  
  .search-card.expanded .card-title-wrapper .card-chevron-icon {
    transform: rotate(45deg);
  }
  
  .card-content .card-img {
    height: 161px;
    width: 132px;
    background-color: #E2DFDF;
    background-repeat: no-repeat;
    background-position: 50% 50%;
    background-size: cover;
    margin-right: 30px;
  }
  
  .card-content .card-text {
  }
  
  .card-text .card-date {
    font-size: 11px;
    font-weight: bold;
    text-transform: uppercase;
    color: #747474;
    letter-spacing: 0.66px;
  }
  
  .card-text .card-size {
    padding-left: 5px;
  }
  
  .card-text .card-size::before {
    content: ' \\00B7';
    padding-right: 5px;
    font-size: 16px;
  }
  
  .card-text .card-description {
    font-size: 14px;
    color: #505050;
    margin: 0 0 6px;
  }
  
  .card-text .card-tags-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  
  .card-tags-wrapper .card-tag {
    border: 1px solid #6D6D6D;
    border-radius: 4px;
    padding: 0 5px;
    color: #464646;
    font-size: 12px;
  }
  
  .card-tags-wrapper .card-tag:first-letter {
    text-transform: uppercase;
  }
  
  @media screen and (max-width: 768px) {
    .search-card .card-header {
      height: 89px;
      flex-direction: column;
      align-items: flex-start;
    } 
   .search-card .card-content {
      padding-left: 30px;
    }
   .search-card .card-icons {
     padding-left: 30px;
   }
    .search-card .card-title {
     display: -webkit-box;
     -webkit-box-orient: vertical;
     overflow: hidden;
     text-overflow: ellipsis;
     -webkit-line-clamp: 2;
   }
  }
`;

export default searchCardStyles;
