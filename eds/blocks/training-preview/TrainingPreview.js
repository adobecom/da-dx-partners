import { getLibs } from '../../scripts/utils.js';
import { trainingPreviewStyles } from './TrainingPreviewStyles.js';
// test page http://localhost:3000/digitalexperience/drafts/sonja/trainings/preview
//https://mwpw-181343-tp--da-dx-partners--adobecom.aem.page/digitalexperience/drafts/sonja/trainings/preview
//https://mwpw-181343-tp--da-dx-partners--adobecom.aem.page/digitalexperience/drafts/sonja/trainings/learningprogram74197
// https://partners.stage.adobe.com/digitalexperience/drafts/sonja/trainings/learningprogram74197
const miloLibs = getLibs();
const { html, LitElement } = await import(`${miloLibs}/deps/lit-all.min.js`);
export default class TrainingPreview extends LitElement {
  static styles = [
    trainingPreviewStyles,
  ];

  static properties = { blockData: { type: Object } };

  // eslint-disable-next-line no-useless-constructor
  constructor() {
    super();
  }

  firstUpdated() {
    // Create container for React to mount into
    const container = document.createElement('div');
    container.id = 'root_content_outer_position_component';
    this.shadowRoot.appendChild(container);
    document.body.appendChild(container);

    // Inject the CSS file (if not already added globally)
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = '/eds/blocks/training-preview/dist/css/cptraining.min.css'; // adjust path
    document.head.appendChild(cssLink);

    // Load the React bundle script
    const script = document.createElement('script');
    script.src = '/eds/blocks/training-preview/dist/js/cptraining.min.js'; // adjust path
    script.type = 'text/javascript';
    script.async = true;
    this.shadowRoot.appendChild(script);
  }

  async connectedCallback() {
    super.connectedCallback();
    // fetch if needed
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    return html`<div class="training-preview-container">test </div> `;
  }
}
