import { getLibs } from '../../scripts/utils.js';

const miloLibs = getLibs();
const { css } = await import(`${miloLibs}/deps/lit-all.min.js`);

export const partnershipProgressStyles = css`
  :host {
    display: block;
    font-family: var(
            --spectrum-alias-body-text-font-family,
            'Adobe Clean',
            sans-serif
    );
    color: #2c2c2c;
    font-size: 14px;
    line-height: 1.4;
    --pp-label-column-width: 210px;
  }

  .partnership-progress-container {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
    max-width: 800px;
    margin: 0 auto;
  }

  @media (max-width: 800px) {
    .partnership-progress-container {
      grid-template-columns: 1fr;
      max-width: 400px;
    }
  }

  .partnership-progress-track {
    padding: 0 16px 16px;
  }

  .partnership-progress-track-title-wrapper {
    background: #fafafa;
    margin: 0 -16px;
    padding: 12px 16px 4px 16px;
    border-bottom: 1px solid #e1e1e1;
  }

  .partnership-progress-track-title {
    font-weight: 700;
  }

  .partnership-progress-rows {
    margin-top: 0;
  }

  .partnership-progress-header-row {
    display: grid;
    grid-template-columns: minmax(0, var(--pp-label-column-width))
                           minmax(0, 1fr);
    align-items: center;
    padding: 10px 16px;
    margin: 0 -16px;
    border-bottom: 1px solid #e1e1e1;
    column-gap: 32px;
  }

  .partnership-progress-header-row span:first-child {
    font-weight: 700;
  }

  .partnership-progress-header-row span:last-child {
    text-transform: uppercase;
    font-weight: 400;
    white-space: nowrap;
  }

  .partnership-progress-metric-row {
    display: grid;
    grid-template-columns: minmax(0, var(--pp-label-column-width))
                           minmax(0, 1fr);
    align-items: center;
    column-gap: 32px;
    padding: 12px 16px;
    margin: 0 -16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .partnership-progress-metric-label {
    font-weight: 400;
  }

  .partnership-progress-metric-bar {
    width: 100%;
  }

  @media (max-width: 600px) {
    .metric-row,
    .header-row {
      grid-template-columns: 1fr;
      column-gap: 0;
    }

    .metric-bar {
      width: 100%;
    }
  }
  
  .partnership-progress-bar-wrapper {
    width: 100%;
  }

  .partnership-progress-track-bar {
    position: relative;
    width: 100%;
    height: 8px;
    border-radius: 999px;
    background-color: #e6e6e6;
    overflow: hidden;
  }

  .partnership-progress-fill {
    position: relative;
    height: 100%;
    border-radius: inherit;
    background-color: #2680ff;
    transform-origin: left center;
    transition: width 120ms ease-out;
    width: 0;
  }

  .partnership-progress-state {
    padding: 16px;
    text-align: center;
    color: #6e6e6e;
    font-size: 13px;
  }

  .partnership-progress-state--error {
    color: #c9252d;
  }

  .progress-circle-wrapper {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 150px;
  }
`;
