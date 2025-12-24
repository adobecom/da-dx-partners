import { getLibs } from '../../scripts/utils.js';
import { trainingPreviewStyles } from './TrainingPreviewStyles.js';

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

  createRenderRoot() {
    return this; // Use light DOM so React can access via document.getElementById
  }

  // eslint-disable-next-line class-methods-use-this
  firstUpdated() {
    const container = document.getElementById('root_content_outer_position_component');
    if (!container) {
      console.log('React mount container not found');
      return;
    }

    function addStyle(name) {
      if (!document.querySelector(`link[href="${name}"]`)) {
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = name;
        document.head.appendChild(linkElement);
      }
    }

    addStyle('/eds/blocks/training-preview/dist/css/gravitycommon.min.css');
    addStyle('/eds/blocks/training-preview/dist/css/gravitypublish.min.css');
    addStyle('/eds/blocks/training-preview/dist/css/cptraining.min.css');
    addStyle('/eds/blocks/training-preview/dist/css/dexterbasepublish.min.css');
    addStyle('/eds/blocks/training-preview/dist/css/dexterthemethree.min.css');

    // Inject the React bundle (once)
    if (!document.querySelector('script[src="/eds/blocks/training-preview/dist/js/cptraining.min.js"]')) {
      const script = document.createElement('script');
      script.src = '/eds/blocks/training-preview/dist/js/cptraining.min.js';
      script.type = 'text/javascript';
      script.async = true;
      document.body.appendChild(script); // Append to body, not shadowRoot
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    // fetch if needed
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    return html`<div class="training-preview-container"> <div id="root_content_outer_position_component"></div> </div> `;
  }
}
