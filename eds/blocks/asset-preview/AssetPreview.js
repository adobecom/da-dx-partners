/* eslint-disable no-underscore-dangle */
import { CAAS_TAGS_URL, getLibs, prodHosts } from '../../scripts/utils.js';
import {
  PARTNERS_PROD_DOMAIN,
  PARTNERS_STAGE_DOMAIN,
  transformCardUrl,
} from '../utils/utils.js';
import {
  DEFAULT_BACKGROUND_IMAGE_PATH,
  DIGITALEXPERIENCE_PREVIEW_PATH, FILE_EXTENSION_TO_DOWNLOAD_LABEL,
  PARTNER_LEVEL, PX_ASSETS_PREVIEW_PATH,
} from '../utils/dxConstants.js';

import DOMPurify from '../../libs/deps/purify-wrapper.js';

const miloLibs = getLibs();
const { html, LitElement, unsafeHTML } = await import(`${miloLibs}/deps/lit-all.min.js`);
await import('../../components/VideoPlayer.js');

const PDF_RENDER_DIV_ID = 'adobe-dc-view';
const DEFAULT_BACK_BTN_LABEL = 'Back to previous';

export default class AssetPreview extends LitElement {
  static properties = {
    blockData: { type: Object },
    title: { type: String },
    summary: { type: String },
    description: { type: String },
    fileType: { type: String },
    url: { type: String },
    tags: { type: Array },
    allAssetTags: { type: Array },
    ctaText: { type: String },
    backButtonUrl: { type: String },
    backButtonLabel: { type: String },
    createdDate: { type: Date },
    assetHasData: { type: Boolean },
    isLoading: { type: Boolean, reflect: true },
    isVideoLoading: { type: Boolean, reflect: true },
    assetPartnerLevel: { type: Array },
    pdfPreviewUrl: { type: String },
    chapters: { type: Array },
  };

  constructor() {
    super();
    this.assetHasData = false;
    this.tags = [];
    this.allAssetTags = [];
    this.allCaaSTags = [];
    this.isVideo = false;
    this.isLoading = true;
    this.isVideoLoading = false;
    this.assetPartnerLevel = [];
    this.pdfPreviewUrl = '';
    this.chapters = [];
  }

  createRenderRoot() {
    return this;
  }

  async playVideo() {
    const player = this.querySelector('video-player');
    if (!player) return;

    window.scrollTo({ top: player.offsetTop, behavior: 'smooth' });
    try {
      await player.play();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to play video:', error);
    }
  }

  handleVideoLoadingChange(event) {
    this.isVideoLoading = event.detail.loading;
  }

  async connectedCallback() {
    super.connectedCallback();
    this.setBlockData();
    try {
      const caasTagsResponse = await fetch(
        CAAS_TAGS_URL,
      );
      if (!caasTagsResponse.ok) {
        throw new Error(`Get caas tags HTTP error! Status: ${caasTagsResponse.status}`);
      }
      this.allCaaSTags = await caasTagsResponse.json();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('error', error);
    }
    await this.getAssetMetadata();
    await this.updateComplete;
    const target = document.querySelector('.asset-preview-block-details-left');

    if (target && this.isRestrictedAssetForUser()) {
      target.appendChild(this.fragment);
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('pdfPreviewUrl') && this.pdfPreviewUrl) {
      if (!this.isRestrictedAssetForUser()) {
        this.loadPdfViewer();
      }
    }
  }

  async loadPdfViewer() {
    try {
      // Check if the PDF URL is reachable first
      const res = await fetch(this.pdfPreviewUrl, { method: 'HEAD' });
      const contentType = res.headers.get('Content-Type');

      if (!res.ok || !contentType?.includes('application/pdf')) {
        this.pdfPreviewUrl = '';
        return;
      }

      const { default: initPdfViewer } = await import('../../components/PdfViewer.js');
      await initPdfViewer({
        url: this.pdfPreviewUrl,
        fileName: `${this.title}.pdf`,
        divId: PDF_RENDER_DIV_ID,
        pdfEmbedMode: this.blockData.pdfEmbedMode,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(`PDF viewer failed to load, falling back to preview image: ${e.message}`);
      this.pdfPreviewUrl = '';
    }
  }

  addDynamicKeyForLocalization(key) {
    const localizationKey = `{{${key}}}`;
    if (!this.blockData.localizedText[localizationKey]) {
      this.blockData.localizedText[localizationKey] = key;
    }
  }

  setBlockData() {
    this.fragment = document.querySelector('.fragment');
    this.blockData = { ...this.blockData };

    const blockDataActions = {
      'back-button-url': (cols) => {
        const [backButtonUrlEl] = cols;
        this.blockData.backButtonUrl = backButtonUrlEl.innerText.trim();
      },
      'back-button-label': (cols) => {
        const [backButtonLabelEl] = cols;
        this.blockData.backButtonLabel = backButtonLabelEl.innerText.trim();
        this.addDynamicKeyForLocalization(this.blockData.backButtonLabel);
      },
      'pdf-embed-mode': (cols) => {
        const [pdfEmbedModeEl] = cols;
        this.blockData.pdfEmbedMode = pdfEmbedModeEl?.innerText.trim().toLowerCase().replace(/ /g, '-');
      },
    };
    const rows = Array.from(this.blockData.tableData);
    rows.forEach((row) => {
      const cols = Array.from(row.children);
      const rowTitle = cols[0].innerText.trim().toLowerCase().replace(/ /g, '-');
      const colsContent = cols.slice(1);
      if (blockDataActions[rowTitle]) blockDataActions[rowTitle](colsContent);
    });
  }

  async getAssetMetadata() {
    // For domain we use what is in window.location.href.
    // This assumes cards use partners.stage.adobe.com or partners.adobe.com.
    // Production assets are fetched from production.
    // Stage may display QA or development assets, but metadata is fetched from stage.
    const mappedAssetUrl = this.getRealAssetUrl();
    if (!mappedAssetUrl) {
      this.isLoading = false;
      return;
    }

    try {
      await fetch(mappedAssetUrl).then(async (res) => {
        if (res && res.status === 200) {
          const assetMetadata = await res.json();
          await this.setData(assetMetadata);
        }
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(`Error on fetch of asset ${mappedAssetUrl} :`, e);
    }
    this.isLoading = false;
  }

  async setData(assetMetadata) {
    const metadataChapters = assetMetadata.chapters || [];
    this.chapters = Array.isArray(metadataChapters) ? metadataChapters : [metadataChapters];

    this.isVideoLoading = false;

    this.title = DOMPurify.sanitize(assetMetadata.title);
    document.title = DOMPurify.sanitize(assetMetadata.title);
    this.summary = DOMPurify.sanitize(assetMetadata.summary)
      || DOMPurify.sanitize(assetMetadata.description);
    this.fileType = DOMPurify.sanitize(assetMetadata.fileType);
    this.url = DOMPurify.sanitize(assetMetadata.url);
    this.webinarPresentation = DOMPurify.sanitize(assetMetadata.webinarPresentation);
    this.previewImage = DOMPurify.sanitize(assetMetadata.previewImage);
    this.blockData.pdfEmbedMode = DOMPurify.sanitize(this.blockData.pdfEmbedMode) || 'full-window';
    this.backButtonUrl = DOMPurify.sanitize(this.blockData.backButtonUrl);
    this.backButtonLabel = DOMPurify.sanitize(
      this.blockData.backButtonLabel || DEFAULT_BACK_BTN_LABEL,
    );
    this.tags = assetMetadata.tags
      ? this.getTagsDisplayValues(this.allCaaSTags, assetMetadata.tags) : [];
    this.allAssetTags = assetMetadata.tags;
    this.ctaText = DOMPurify.sanitize(assetMetadata.ctaText);
    this.size = DOMPurify.sanitize(this.getSizeInMb(assetMetadata.size));
    this.assetPartnerLevel = assetMetadata.partnerLevel
      ?.map((level) => DOMPurify.sanitize(level.toLowerCase())) || [];
    this.createdDate = (() => {
      if (!assetMetadata.createdDate) return '';

      try {
        const date = new Date(assetMetadata.createdDate);
        return date.toLocaleDateString('en-US');
      } catch (error) {
        return '';
      }
    })();
    this.audienceTags = assetMetadata.tags ? this.getTagChildTagsObjects(assetMetadata.tags, this.allCaaSTags, 'caas:audience') : [];
    this.fileFormatTags = assetMetadata.tags ? this.getTagChildTagsObjects(assetMetadata.tags, this.allCaaSTags, 'caas:file-format') : [];
    this.pdfPreviewUrl = DOMPurify.sanitize(assetMetadata.pdfPreviewUrl);
    this.isVideo = this.fileFormatTags && this.fileFormatTags.length && this.fileFormatTags[0].tagId === 'caas:file-format/video';
    if (!assetMetadata.title || !assetMetadata.url) {
      this.assetHasData = false;
    } else {
      this.assetHasData = true;
    }
    this.aemPath = DOMPurify.sanitize(assetMetadata.aemPath);
  }

  // eslint-disable-next-line class-methods-use-this
  getRealAssetUrl() {
    const assetMetadataPath = window.location.href.replace(DIGITALEXPERIENCE_PREVIEW_PATH, PX_ASSETS_PREVIEW_PATH).replace('.html', '/_jcr_content/metadata.assetmetadata.json');
    try {
      const url = new URL(assetMetadataPath);
      const isProd = prodHosts.includes(window.location.host);
      url.hostname = isProd ? PARTNERS_PROD_DOMAIN : PARTNERS_STAGE_DOMAIN;
      url.port = '';
      url.searchParams.delete('chapter');
      url.searchParams.delete('t');
      return url;
    } catch (error) {
      return null;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  _handleImgError = (e) => {
    // eslint-disable-next-line no-console
    console.log('error', e);
    const img = e.currentTarget;
    img.src = transformCardUrl(DEFAULT_BACKGROUND_IMAGE_PATH);
  };

  render() {
    return html`<div class="asset-preview-block-container" daa-lh="Asset preview container | ${this.title}">
      ${this.assetHasData && !this.isLoading ? html`
          <div class="asset-preview-block-header"><p>${this.blockData.localizedText['{{Asset detail}}']}: ${unsafeHTML(this.title)}  ${this.getFileTypeFromTag() ? `(${this.getFileTypeFromTag()})` : ''}</p></div>
          <div class="asset-preview-block-details ">
            <div class="asset-preview-block-details-left">
              ${this.createdDate ? html`<p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Date}}']}: </span>${this.createdDate}</p>` : ''}
              ${this.getTagsTitlesString(this.audienceTags) ? html`<p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Audience}}']}: </span>${unsafeHTML(this.getTagsTitlesString(this.audienceTags))}</p>` : ''}
              ${this.summary ? html`<p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Summary}}']}: </span>${unsafeHTML(this.summary)}</p>` : ''}
              ${this.getTagsTitlesString(this.fileFormatTags) ? html`<p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Type}}']}: </span>${unsafeHTML(this.getTagsTitlesString(this.fileFormatTags))}</p>` : ''}
              ${this.getTagsTitlesString(this.tags) ? html`<p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Tags}}']}: </span>${unsafeHTML(this.getTagsTitlesString(this.tags))}</p>` : ''}
              ${this.size ? html`<p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Size}}']}: </span>${unsafeHTML(this.size)}</p>` : ''}

              ${!this.isRestrictedAssetForUser() ? html`
              <div class="asset-preview-block-actions" daa-lh="Asset preview block actions">
                ${this.isPreviewEnabled(this.getFileTypeFromTag()) ? html`<button
                  class="outline" ><a target="_blank" rel="noopener noreferrer" href="${this.getDownloadUrl()}" daa-ll="View"> View </a></button>` : ''}
                  ${!this.isVideo ? html`<button class="filled"><a download="${this.title}" href="${this.getDownloadUrl()}" daa-ll="${this.blockData.localizedText[`{{${this.getLabelBasedOnFileExtension(this.url)}}}`]}">${this.blockData.localizedText[`{{${this.getLabelBasedOnFileExtension(this.url)}}}`]}</a></button>` : ''}
                  ${this.webinarPresentation ? html`
                    <button class="filled"><a download="${`${this.title}_presentation`}" href="${this.getWebinarPresentationDownloadUrl()}" daa-ll="${this.blockData.localizedText[`{{${this.getLabelBasedOnFileExtension(this.webinarPresentation)}}}`]}">${this.blockData.localizedText[`{{${this.getLabelBasedOnFileExtension(this.webinarPresentation)}}}`]}</a></button>
                  ` : ''}

                  ${this.isVideo ? html`
                    <button @click="${() => this.playVideo()}" class="filled" ?disabled="${this.isVideoLoading}">
                      <span>${this.blockData.localizedText['{{Watch Video}}']}</span>
                    </button>
                  ` : ''}

                  ${this.backButtonUrl ? html`<a
                  class="link" href="${this.backButtonUrl}" daa-ll="${this.blockData.localizedText[`{{${this.backButtonLabel}}}`]}">${this.blockData.localizedText[`{{${this.backButtonLabel}}}`]}</a>` : ''}
                </div>` : ''}
            </div>

            <div class="asset-preview-block-details-right">
            ${this.pdfPreviewUrl && !this.isRestrictedAssetForUser()
    ? html`<div id="${PDF_RENDER_DIV_ID}" class="asset-preview-pdf-viewer"></div>`
    : html`<img src="${transformCardUrl(this.previewImage)}" @error="${this._handleImgError}"/>`}
            </div>
          </div>

          ${this.isVideo && !this.isRestrictedAssetForUser() ? html`
            <video-player
              .src="${this.getDownloadUrl()}"
              .fileType="${this.fileType}"
              .chapters="${this.chapters}"
              @loading-change="${this.handleVideoLoadingChange}"
            ></video-player>
          ` : ''}
        ` : html`
          <div class="asset-preview-block-header">
            ${this.isLoading
    ? this.blockData.localizedText['{{Loading data}}']
    : this.blockData.localizedText['{{Asset data not found}}']}
          </div>
        `}
      </div>
    `;
  }

  // eslint-disable-next-line class-methods-use-this
  isPreviewEnabled(fileType) {
    const enabledTypes = ['PDF'];
    return enabledTypes.includes(fileType);
  }

  // eslint-disable-next-line class-methods-use-this
  getSizeInMb(size) {
    const sizeInMb = Number(size / (1000 * 1000)).toFixed(1);
    const sizeInKb = Number(size / 1000).toFixed(1);
    return sizeInMb >= 1 ? `${sizeInMb} MB` : `${sizeInKb} KB`;
  }

  getTagsDisplayValues(allTags, tags) {
    const tagsArray = [];
    tags.forEach((tag) => {
      const tagObject = this.findTagByPath(this.allCaaSTags.namespaces.caas.tags, tag)
        || { tagId: tag, title: tag };
      tagsArray.push({ tagId: tag, title: tagObject.title });
    });
    return tagsArray;
  }

  // eslint-disable-next-line class-methods-use-this
  findTagByPath(caasTags, tag) {
    const tagParts = tag.split('caas:')[1].split('/');
    let caasPointer = caasTags;
    // eslint-disable-next-line consistent-return
    tagParts.forEach((tagPart, i) => {
      if (!caasPointer) return null;
      if (tagParts.length - 1 > i) {
        caasPointer = caasPointer[tagPart]?.tags;
      } else {
        caasPointer = caasPointer[tagPart];
      }
    });
    return caasPointer;
  }

  getTagChildTagsObjects(tags, allTags, rootTag) {
    if (!tags) return [];
    const filteredTags = tags.filter((t) => t.startsWith(rootTag));
    const tagsArray = [];
    filteredTags.forEach((tag) => {
      const tagObject = this.findTagByPath(this.allCaaSTags.namespaces.caas.tags, tag)
        || { tagId: tag, title: tag };
      tagsArray.push({
        tagId: DOMPurify.sanitize(tag),
        title: DOMPurify.sanitize(tagObject.title),
      });
    });
    return tagsArray;
  }

  getFileTypeFromTag() {
    // We should always have only one file format tag, added based on file type.
    // this.fileType can contain values unsuitable for display.
    // https://git.corp.adobe.com/wcms/gravity/blob/develop/app-configuration/core/src/main/java/com/adobe/wcm/configuration/utils/CaaSContentDXUtils.java#L52
    if (this.fileFormatTags && this.fileFormatTags.length) {
      return this.fileFormatTags[0].title;
    }
    return '';
  }

  // eslint-disable-next-line class-methods-use-this
  getTagsTitlesString(tags) {
    return tags?.map((tag) => DOMPurify.sanitize(tag.title)).join(', ');
  }

  getDownloadUrl() {
    if (!this.url) return '#';
    return this.url;
  }

  getWebinarPresentationDownloadUrl() {
    if (!this.webinarPresentation) return '#';
    return this.webinarPresentation;
  }

  isRestrictedAssetForUser() {
    return !(!this.assetPartnerLevel.length
      || this.assetPartnerLevel.includes('public')
      || this.assetPartnerLevel.includes(PARTNER_LEVEL));
  }

  // eslint-disable-next-line class-methods-use-this
  getLabelBasedOnFileExtension(url) {
    try {
      const { pathname } = new URL(url);
      const fileName = pathname.split('/').pop();
      const parts = fileName.split('.');
      const extension = parts.length > 1 ? parts.pop() : '';

      return FILE_EXTENSION_TO_DOWNLOAD_LABEL[extension] || 'Download';
    } catch (error) {
      return 'Download';
    }
  }
}
