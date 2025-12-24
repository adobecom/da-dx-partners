import { singlePartnerCardStyles } from './PartnerCardsStyles.js';
import { formatDate, getLibs } from '../scripts/utils.js';
import { getConfig, transformCardUrl } from '../blocks/utils/utils.js';

import DOMPurify from '../libs/deps/purify-wrapper.js';

const miloLibs = getLibs();
const { html, LitElement, unsafeHTML } = await import(`${miloLibs}/deps/lit-all.min.js`);
const { processTrackingLabels } = await import(`${miloLibs}/martech/attributes.js`);

const DEFAULT_BACKGROUND_IMAGE_PATH = '/content/dam/solution/en/images/card-collection/sample_default.png';

class SinglePartnerCard extends LitElement {
  static properties = {
    data: { type: Object },
    ietf: { type: String },
    design: { type: String },
  };

  static styles = singlePartnerCardStyles;

  render() {
    return html`
      <div class="single-partner-card" data-dll-cardid="${this.data.id}">
        <div class="card-header" style="background-image: url(${transformCardUrl(this.data.styles?.backgroundImage)}), url(${transformCardUrl(DEFAULT_BACKGROUND_IMAGE_PATH)})">
        </div>
        <div class="card-content">
          <div class="card-text">
            <p class="card-title">${unsafeHTML(DOMPurify.sanitize(this.data.contentArea?.title !== 'card-metadata' ? this.data.contentArea?.title : ''))}</p>
            <p class="card-description">${unsafeHTML(DOMPurify.sanitize(this.data.contentArea?.description))}</p>
          </div>
          <div class="card-footer">
            <span class="card-date">${formatDate(this.data.cardDate, this.ietf)}</span>
            <a class="card-btn" daa-ll="${processTrackingLabels(this.data.footer[0]?.right[0]?.text, getConfig(), 30)}" href="${transformCardUrl(this.data.contentArea?.url)}" target="_blank" rel="nooopener noreferrer">${this.data.footer[0]?.right[0]?.text}</a>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('single-partner-card', SinglePartnerCard);
