import { singlePartnerCardStyles } from './PartnerCardsStyles.js';
import { getLibs } from '../scripts/utils.js';
import { getConfig, transformCardUrl } from '../blocks/utils/utils.js';

import DOMPurify from '../libs/deps/purify-wrapper.js';
import { DEFAULT_BACKGROUND_IMAGE_PATH } from '../blocks/utils/dxConstants.js';

const miloLibs = getLibs();
const { html, LitElement, unsafeHTML } = await import(`${miloLibs}/deps/lit-all.min.js`);
const { processTrackingLabels } = await import(`${miloLibs}/martech/attributes.js`);

class SinglePartnerCardHalfHeight extends LitElement {
  static properties = {
    data: { type: Object },
    design: { type: String },
  };

  static styles = singlePartnerCardStyles;


  render() {
    return html`
      <a
        class="single-partner-card--half-height"
        href="${transformCardUrl(this.data.contentArea?.url)}"
        target="_blank" rel="nooopener noreferrer"
        style="background-image: url(${transformCardUrl(this.data.styles?.backgroundImage)}), url(${transformCardUrl(DEFAULT_BACKGROUND_IMAGE_PATH)})"
        daa-ll="${processTrackingLabels(this.data.contentArea?.title !== 'card-metadata' ? this.data.contentArea?.title : '', getConfig(), 30)}"
      >
        <div class="card-title-wrapper">
          <p class="card-title">
            ${unsafeHTML(DOMPurify.sanitize(this.data.contentArea?.title !== 'card-metadata' ? this.data.contentArea?.title : ''))}
          </p>
        </div>
      </a>
    `;
  }
}
customElements.define('single-partner-card-half-height', SinglePartnerCardHalfHeight);
