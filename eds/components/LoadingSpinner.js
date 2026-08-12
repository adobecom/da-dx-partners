import { getLibs } from '../scripts/utils.js';

const miloLibs = getLibs();
const { html, LitElement } = await import(`${miloLibs}/deps/lit-all.min.js`);

export default class LoadingSpinner extends LitElement {
  static properties = {
    text: { type: String },
    theme: { type: String },
  };

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    LoadingSpinner.loadStyles();
  }

  static loadStyles() {
    if (document.querySelector('link[href="/eds/components/LoadingSpinner.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/eds/components/LoadingSpinner.css';
    document.head.appendChild(link);
  }

  willUpdate() {
    const theme = this.theme || 'light';
    const trackColor = theme === 'dark' ? 'rgb(255 255 255 / 30%)' : 'rgb(0 0 0 / 10%)';
    const activeColor = theme === 'dark' ? 'var(--asset-preview-white, #fff)' : '#006bff';
    const textColor = theme === 'dark' ? 'var(--asset-preview-white, #fff)' : '#4b4b4b';
    this.style.setProperty('--spinner-track-color', trackColor);
    this.style.setProperty('--spinner-active-color', activeColor);
    this.style.setProperty('--spinner-text-color', textColor);
  }

  render() {
    return html`
      <div class="spinner" aria-hidden="true"></div>
      ${this.text ? html`<p class="spinner-text">${this.text}</p>` : ''}
    `;
  }
}

if (!customElements.get('loading-spinner')) {
  customElements.define('loading-spinner', LoadingSpinner);
}
