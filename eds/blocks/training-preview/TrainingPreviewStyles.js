import { getLibs } from '../../scripts/utils.js';

const miloLibs = getLibs();
const { css } = await import(`${miloLibs}/deps/lit-all.min.js`);
// eslint-disable-next-line import/prefer-default-export
export const trainingPreviewStyles = css`
  .training-preview-container {
    background-color: #2b9af3;
  }
`;
