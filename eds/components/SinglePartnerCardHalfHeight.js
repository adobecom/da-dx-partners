import { singlePartnerCardStyles } from './PartnerCardsStyles.js';
import { formatDate, getLibs, prodHosts } from '../scripts/utils.js';
import { transformCardUrl } from '../blocks/utils/utils.js';

const miloLibs = getLibs();
const { html, LitElement } = await import(`${miloLibs}/deps/lit-all.min.js`);

const DEFAULT_BACKGROUND_IMAGE_PATH = '/content/dam/solution/en/images/card-collection/sample_default.png';
const KB_TAG = 'caas:adobe-partners/collections/knowledge-base';

class SinglePartnerCardHalfHeight extends LitElement {
  static properties = {
    data: { type: Object },
    design: { type: String },
  };

  static styles = singlePartnerCardStyles;

  get imageUrl() {
    const isKB = this.data?.tags.some((tag) => tag.id === KB_TAG);
    return isKB ? this.data.styles?.backgroundImage : `${new URL(this.data.styles?.backgroundImage).pathname}?width=400&format=webp&optimize=small`;
  }

  checkBackgroundImage(element) {
    const url = this.imageUrl;
    const img = new Image();

    const isProd = prodHosts.includes(window.location.host);
    const defaultBackgroundImageOrigin = `https://partners.${isProd ? '' : 'stage.'}adobe.com`;
    const defaultBackgroundImageUrl = `${defaultBackgroundImageOrigin}${DEFAULT_BACKGROUND_IMAGE_PATH}`;

    img.onerror = () => {
      element.style.backgroundImage = `url(${defaultBackgroundImageUrl})`;
    };

    img.src = url;
  }

  firstUpdated() {
    this.checkBackgroundImage(this.shadowRoot.querySelector(`.${this.design}`));
  }

  render() {
    return html`
      <a
        class="single-partner-card--half-height"
        href="${transformCardUrl(this.data.contentArea?.url)}"
        style="background-image: url(${this.imageUrl})"
        alt="${this.data.styles?.backgroundAltText}"
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
