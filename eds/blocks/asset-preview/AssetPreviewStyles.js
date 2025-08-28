import { getLibs } from '../../scripts/utils.js';

const miloLibs = getLibs();
const { css } = await import(`${miloLibs}/deps/lit-all.min.js`);
const black = css`#2C2C2C`;
const white = css`#FFFFFF`;
const blue = css`#274DEA`;
// eslint-disable-next-line import/prefer-default-export
export const assetPreviewStyles = css`
  .asset-preview-block-container {
    display: flex;
    flex-direction: column;
    max-width: 1200px;
    margin: 0 auto;
    width: 83.4%;
    padding: 24px;
    font-family: 'Adobe Clean', adobe-clean, sans-serif;
  }

  .asset-preview-block-container .bold {
    font-weight: bold;
  }

  .asset-preview-block-header {
    width: 100%;
    margin: 0 auto;
    padding: 80px 0;
    font-size: 44px;
    font-weight: bold;
    line-height: 125%;
  }

  .asset-preview-block-header p {
    max-width: 1200px;
    padding: 0;
  }

  .asset-preview-block-details {
    font-size: 16px;
    line-height: 150%; /* 24px */
    display: flex;
    flex-direction: row;
    margin: 0 auto;
    width: 83.4%;
    max-width: 1200px;
    gap: 40px;
  }

  .asset-preview-block-details-left {
    width: 100%;
  }

  span.asset-preview-block-details-left-label {
    font-weight: bold;
  }

  .asset-preview-block-details-right {
    width: 100%;
    background-repeat: no-repeat;
    background-position: 50% 50%;
    background-size: 100% auto;
    aspect-ratio: 16/9;
    max-width: 600px;
  }

  .asset-preview-block-actions {
    display: flex;
    width: 83.4%;
    max-width: 1200px;
    gap: 24px;
    margin: 24px auto;
    align-items: center;
  }

  .asset-preview-block-actions button {
    border: 2px solid ${black};
    border-radius: 20px;
    padding: 5px 15px;
    cursor: pointer;
    font-style: normal;
    font-weight: 700;
    line-height: 19px; /* 126.667% */
    font-size: 16px;
  }

  .asset-preview-block-actions .outline {
    background-color: ${white};
    color: ${black}:
  }

  .asset-preview-block-actions .filled {
    background-color: ${black};
    color: ${white};
  }

  .asset-preview-block-actions .link {
    color: ${blue};
    text-decoration: underline;
    text-decoration-color: ${blue};
    font-weight: 700;
    text-align: center;
    font-size: 16px;
    font-style: normal;
    line-height: 150%; /* 24px */
    text-decoration-line: underline;
    text-decoration-style: solid;
    text-decoration-skip-ink: none;
    text-decoration-thickness: auto;
    text-underline-offset: auto;
    text-underline-position: from-font;
  }

  .asset-preview-block-actions button.filled:hover {
    background-color: ${white};
    color: ${black};
  }

  .asset-preview-block-actions button.outline:hover {
    background-color: ${black};
    color: ${white};
  }

  .asset-preview-block-actions button a {
    color: inherit;
    text-decoration: none;
  }

  .asset-preview-block-video .video-container.video-holder {
    display: flex;
    position: relative;
    height: 100%;
    width: fit-content;
    margin: auto;
    margin-bottom: 0;
  }

  .asset-preview-block-video .video-container.video-holder video {
    max-width: 100%;
    height: auto;
    object-fit: cover;
  }

  .asset-preview-block-video .video-container.video-holder .pause-play-wrapper {
    position: absolute;
    bottom: 2%;
    right: 2%;
    margin: 0;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    z-index: 3;
    padding: 3px;
    cursor: pointer;
    display: flex;
    width: fit-content;
    cursor: pointer;
  }

  .asset-preview-block-video .video-container.video-holder .pause-play-wrapper .offset-filler {
    display: inherit;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    border-radius: inherit;
    background: var(--color-gray-800);
  }
  
  :is(.video-container .pause-play-wrapper, .aside.split.split-left .split-image) img.accessibility-control,
  .brick.split.row.media-right .foreground .brick-media img.accessibility-control {
    width: inherit;
    height: inherit;
    margin: 0;
  }

  .asset-preview-block-video .video-container.video-holder .pause-play-wrapper .accessibility-control {
    width: inherit;
    height: inherit;
    margin: 0;
  }

  @media screen and (max-width: 600px) {
    .asset-preview-block-actions, .asset-preview-block-details {
      flex-direction: column;
    }

    .pause-play-wrapper {
      left: 2%;
    }
  }

  .play-icon {
    display: block;
  }

  .pause-icon {
    display: none;
  }

  .is-playing .play-icon {
    display: none;
  }

  .is-playing .pause-icon {
    display: block;
  }
`;
