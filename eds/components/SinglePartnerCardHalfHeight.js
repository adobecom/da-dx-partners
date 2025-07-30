import { singlePartnerCardStyles } from './PartnerCardsStyles.js';
import { formatDate, getLibs, prodHosts } from '../scripts/utils.js';
import { transformCardUrl } from '../blocks/utils/utils.js';

const miloLibs = getLibs();
const { html, LitElement } = await import(`${miloLibs}/deps/lit-all.min.js`);

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
        style="background-image: url(${transformCardUrl(this.data.styles?.backgroundImage)}), url(${transformCardUrl(DEFAULT_BACKGROUND_IMAGE_PATH)})"
      >
        <div class="card-title-wrapper">
          <p class="card-title">
            ${this.data.contentArea?.title !== 'card-metadata' ? this.data.contentArea?.title : ''}
          </p>
        </div>
      </a>
    `;
  }
}
customElements.define('single-partner-card-half-height', SinglePartnerCardHalfHeight);
