import searchCardStyles from './SearchCardStyles.js';
import { formatDate, getLibs } from '../scripts/utils.js';
import { setDownloadParam, getConfig, replaceText } from '../blocks/utils/utils.js';

const miloLibs = getLibs();
const config = getConfig();
const { html, repeat, LitElement, until } = await import(`${miloLibs}/deps/lit-all.min.js`);

class SearchCard extends LitElement {
  static properties = {
    data: { type: Object },
    localizedText: { type: Object },
    ietf: { type: String },
  };

  static styles = searchCardStyles;

  get cardTags() {
    const tags = this.data.arbitrary;
    if (!tags.length) return;
    // eslint-disable-next-line consistent-return
    return html`${repeat(
      tags,
      (tag) => tag.key,
      (tag) => {
        const key = Object.values(tag)[0];
        const wrappedKey = `{{${key}}}`;
        return html`${until(
          // eslint-disable-next-line no-confusing-arrow
          replaceText(wrappedKey, config).then((res) => res ? html`<span class="card-tag">${res}</span>` : html``),
          html``,
        )}`;
      },
    )}`;
  }

  // eslint-disable-next-line class-methods-use-this
  toggleCard(searchCard) {
    searchCard.classList.toggle('expanded');
  }

  // eslint-disable-next-line class-methods-use-this
  isDownloadDisabled(fileType) {
    const disabledTypes = ['html', 'announcement'];
    return disabledTypes.includes(fileType);
  }

  // eslint-disable-next-line class-methods-use-this
  isPreviewEnabled(fileType) {
    const enabledTypes = ['pdf', 'html', 'announcement'];
    return enabledTypes.includes(fileType);
  }

  // eslint-disable-next-line class-methods-use-this
  getFileType(type) {
    const supportedFileTypes = ['excel', 'pdf', 'powerpoint', 'video', 'word', 'zip', 'html', 'announcement'];
    return supportedFileTypes.includes(type) ? type : 'default';
  }

  /* eslint-disable indent */
  render() {
    return html`
      <div class="search-card" @click=${(e) => this.toggleCard(e.currentTarget)}>
        <div class="card-header">
          <div class="card-title-wrapper">
            <span class="card-chevron-icon"></span>
            <div class="file-icon" style="background-image: url('/eds/img/icons/${this.getFileType(this.data.contentArea?.type)}.svg')"></div>
            <span class="card-title">${this.data.contentArea?.title !== 'card-metadata' ? this.data.contentArea?.title : ''}</span>
          </div>
          <div class="card-icons">
            <sp-theme theme="spectrum" color="light" scale="medium">
              <sp-action-button @click=${(e) => e.stopPropagation()} ?disabled=${this.isDownloadDisabled(this.data.contentArea?.type)} href="${setDownloadParam(this.data.contentArea?.url)}" download="${this.data.contentArea?.title}" aria-label="${this.localizedText['{{download}}']}"><sp-icon-download /></sp-action-button>
              ${this.isPreviewEnabled(this.data.contentArea?.type)
                ? html`<sp-action-button @click=${(e) => e.stopPropagation()} href="${this.data.contentArea?.url}" target="_blank" aria-label="${this.localizedText['{{open-in}}']}"><sp-icon-open-in /></sp-action-button>`
                : html`<sp-action-button disabled selected aria-label="${this.localizedText['{{open-in-disabled}}']}"><sp-icon-open-in /></sp-action-button>`
              }
            </sp-theme>
          </div>
        </div>

        <div class="card-content">
          ${this.data.styles?.backgroundImage
            ? html`<div class="card-img" style="background-image: url('${this.data.styles?.backgroundImage}')" alt="${this.data.styles?.backgroundAltText}"></div>`
            : ''
          }
          <div class="card-text">
            <span class="card-date">${this.localizedText['{{last-modified}}']}: ${formatDate(this.data.cardDate, this.ietf)}
          ${this.data.contentArea?.type !== 'html' && this.data.contentArea?.type !== 'announcement'
        ? html`<span class="card-size">${this.localizedText['{{size}}']}: ${this.data.contentArea?.size}</span>`
        : ''
      }
            </span>
            <p class="card-description">${this.data.contentArea?.description}</p>
            <div class="card-tags-wrapper">${this.cardTags}</div>
          </div>
        </div>
      </div>
    `;
  }
  /* eslint-enable indent */
}
customElements.define('search-card', SearchCard);
