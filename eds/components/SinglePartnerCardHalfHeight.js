import { getLibs } from '../scripts/utils.js';
import { getConfig, transformCardUrl } from '../blocks/utils/utils.js';

import DOMPurify from '../libs/deps/purify-wrapper.js';
import { DEFAULT_BACKGROUND_IMAGE_PATH } from '../blocks/utils/dxConstants.js';
import { dispatchCustomEventOnLinkClick } from '../blocks/utils/analyticsUtils.js';

const miloLibs = getLibs();
const { html, LitElement, unsafeHTML } = await import(`${miloLibs}/deps/lit-all.min.js`);
const { processTrackingLabels } = await import(`${miloLibs}/martech/attributes.js`);

class SinglePartnerCardHalfHeight extends LitElement {
  createRenderRoot() { return this; }

  static properties = {
    data: { type: Object },
    design: { type: String },
  };

  constructor() {
    super();
    this.config = getConfig();
  }

  willUpdate(changedProps) {
    if (changedProps.has('data')) {
      this.title = processTrackingLabels(this.data.contentArea?.title !== 'card-metadata' ? this.data.contentArea?.title : '', this.config, 30);
      this.url = transformCardUrl(this.data.contentArea?.url);
    }
  }

  render() {
    return html`
      <a
        class="single-partner-card--half-height"
        href="${this.url}"
        @click=${(e) => dispatchCustomEventOnLinkClick(e, this.url.href, this.title)}
        target="_blank" rel="nooopener noreferrer"
        style="background-image: url(${transformCardUrl(this.data.styles?.backgroundImage)}), url(${transformCardUrl(DEFAULT_BACKGROUND_IMAGE_PATH)})"
        daa-ll="${this.title}"
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
