import { singlePartnerCardStyles } from './PartnerCardsStyles.js';
import { formatDate, getLibs, prodHosts } from '../scripts/utils.js';
import { transformCardUrl } from '../blocks/utils/utils.js';

const miloLibs = getLibs();
const { html, LitElement } = await import(`${miloLibs}/deps/lit-all.min.js`);

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
      <div class="single-partner-card">
        <div class="card-header" style="background-image: url(${transformCardUrl(this.data.styles?.backgroundImage)}), url(${transformCardUrl(DEFAULT_BACKGROUND_IMAGE_PATH)})">
        </div>
        <div class="card-content">
          <div class="card-text">
            <p class="card-title">${this.data.contentArea?.title !== 'card-metadata' ? this.data.contentArea?.title : ''}</p>
            <p class="card-description">${this.data.contentArea?.description}</p>
          </div>
          <div class="card-footer">
            <span class="card-date">${formatDate(this.data.cardDate, this.ietf)}</span>
            <a class="card-btn" href="${transformCardUrl(this.data.contentArea?.url)}" target="_blank" rel="nooopener noreferrer" >${this.data.footer[0]?.right[0]?.text}</a>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('single-partner-card', SinglePartnerCard);
