import { singlePartnerCardStyles } from './PartnerCardsStyles.js';
import { getLibs, processTrackingLabels } from '../scripts/utils.js';
import { getConfig, transformCardUrl } from '../blocks/utils/utils.js';

import DOMPurify from '../libs/deps/purify-wrapper.js';

const miloLibs = getLibs();
const { html, LitElement, unsafeHTML } = await import(`${miloLibs}/deps/lit-all.min.js`);

const DEFAULT_BACKGROUND_IMAGE_PATH = '/content/dam/solution/en/images/card-collection/sample_default.png';

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
        data-dll-cardid="${this.data.id}"
        style="background-image: url(${transformCardUrl(this.data.styles?.backgroundImage)}), url(${transformCardUrl(DEFAULT_BACKGROUND_IMAGE_PATH)})"
        daa-ll="${processTrackingLabels(unsafeHTML(DOMPurify.sanitize(this.data.contentArea?.title !== 'card-metadata' ? this.data.contentArea?.title : '')), getConfig(), 20)}"
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
