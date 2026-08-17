export default class LoadingSpinner extends HTMLElement {
  static observedAttributes = ['text', 'theme'];

  connectedCallback() {
    this.applyTheme();
    this.render();
  }

  attributeChangedCallback() {
    this.applyTheme();
    this.render();
  }

  applyTheme() {
    const theme = this.getAttribute('theme') || 'light';
    const trackColor = theme === 'dark' ? 'rgb(255 255 255 / 30%)' : 'rgb(0 0 0 / 10%)';
    const activeColor = theme === 'dark' ? '#fff' : '#006bff';
    const textColor = theme === 'dark' ? '#fff' : '#4b4b4b';
    this.style.setProperty('--spinner-track-color', trackColor);
    this.style.setProperty('--spinner-active-color', activeColor);
    this.style.setProperty('--spinner-text-color', textColor);
  }

  render() {
    const text = this.getAttribute('text');
    this.innerHTML = `
      <div class="spinner" aria-hidden="true"></div>
      ${text ? `<p class="spinner-text">${text}</p>` : ''}
    `;
  }
}

if (!customElements.get('loading-spinner')) {
  customElements.define('loading-spinner', LoadingSpinner);
}
