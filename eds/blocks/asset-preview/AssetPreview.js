import { CAAS_TAGS_URL, getLibs, prodHosts } from '../../scripts/utils.js';
import { assetPreviewStyles } from './AssetPreviewStyles.js';
import {
  PARTNERS_PROD_DOMAIN,
  PARTNERS_STAGE_DOMAIN,
  setDownloadParam,
  transformCardUrl,
} from '../utils/utils.js';
import {
  PARTNER_LEVEL,
  PX_PARTNER_LEVELS,
  PX_PARTNER_LEVELS_ROOT,
} from '../utils/dxConstants.js';

const DEFAULT_BACKGROUND_IMAGE_PATH = '/content/dam/solution/en/images/card-collection/sample_default.png';

const miloLibs = getLibs();
const { html, LitElement } = await import(`${miloLibs}/deps/lit-all.min.js`);
export default class AssetPreview extends LitElement {
  static styles = [
    assetPreviewStyles,
  ];

  static properties = {
    blockData: { type: Object },
    title: { type: String },
    summary: { type: String },
    description: { type: String },
    fileType: { type: String },
    url: { type: String },
    thumbnailUrl: { type: String },
    tags: { type: Array },
    allAssetTags: { type: Array },
    ctaText: { type: String },
    backButtonUrl: { type: String },
    createdDate: { type: Date },
    assetExist: { type: Boolean },
    isVideoPlaying: { type: Boolean, reflect: true },
  };

  constructor() {
    super();
    this.assetExist = false;
    this.tags = [];
    this.allAssetTags = [];
    this.allCaaSTags = [];
    this.isVideoPlaying = false;
    this.isVideo = false;
  }

  // eslint-disable-next-line no-underscore-dangle
  get _video() {
    return this.shadowRoot.querySelector('video');
  }

  togglePlay() {
    // eslint-disable-next-line no-underscore-dangle
    if (this._video && this._video.paused) {
      // eslint-disable-next-line no-underscore-dangle
      this._video.play();

      // eslint-disable-next-line no-underscore-dangle
    } else if (this._video) {
      // eslint-disable-next-line no-underscore-dangle
      this._video.pause();
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    this.setBlockData();
    this.allCaaSTags = await fetch(CAAS_TAGS_URL).then((res) => res.json());
    await this.getAssetMetadata();
  }

  setBlockData() {
    this.blockData = { ...this.blockData };

    const blockDataActions = {
      'back-button-url': (cols) => {
        const [backButtonUrlEl] = cols;
        this.blockData.backButtonUrl = backButtonUrlEl.innerText.trim();
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
  // for domain we use what is in  window.location.href
    // (this assumes that on cards we have partners.stage.adobe.com or partners.adobe.com
    // on prod caas index we would have only have prod assets, so asset metadata
    // would always be found on prod
    // for stage, we will display also some assets from qa01 or dev02,
    // but will always fetch asset metadata from stage
    // so we should delete assets from lower env if they make us problem on stage
    const mappedAssetUrl = this.getRealAssetUrl();
    if(!mappedAssetUrl) return;
    try {
      await fetch(mappedAssetUrl).then(async (res) => {
        if (res && res.status === 200) {
          const assetMetadata = await res.json();
          await this.setData(assetMetadata);
        }
      });
    } catch (e) {
      console.log(`Error on fetch of asset ${mappedAssetUrl} :`, error);
    }
  }

  async setData(assetMetadata) {
    this.title = assetMetadata.title;
    this.summary = assetMetadata.summary;
    this.description = assetMetadata.description;
    this.fileType = assetMetadata.fileType;
    this.url = assetMetadata.url;
    this.thumbnailUrl = assetMetadata.thumbnailUrl;
    this.backButtonUrl = this.blockData.backButtonUrl;
    this.tags = assetMetadata.tags
      ? this.getTagsDisplayValues(this.allCaaSTags, assetMetadata.tags) : [];
    this.allAssetTags = assetMetadata.tags;
    this.ctaText = assetMetadata.ctaText;
    this.size = this.getSizeInMb(assetMetadata.size);
    this.createdDate = (() => {
      if (!assetMetadata.createdDate) return null;
      const date = new Date(assetMetadata.createdDate);
      return !isNaN(date.getTime()) ? date.toLocaleDateString('en-US') : null;
    })();
    this.audienceTags = assetMetadata.tags ? this.getTagChildTagsObjects(assetMetadata.tags, this.allCaaSTags, 'caas:audience') : [];
    this.fileFormatTags = assetMetadata.tags ? this.getTagChildTagsObjects(assetMetadata.tags, this.allCaaSTags, 'caas:file-format') : [];
    this.isVideo = this.fileFormatTags && this.fileFormatTags[0].tagId === 'caas:file-format/video';
    this.assetExist = true;
  }

  // eslint-disable-next-line class-methods-use-this
  getRealAssetUrl() {
    const assetMetadataPath = window.location.href.replace('/digitalexperience/preview/', '/content/dam/solution/en/').concat('.assetmetadata.json');
    try {
      const url = new URL(assetMetadataPath);
      const isProd = prodHosts.includes(window.location.host);
      url.hostname = isProd ? PARTNERS_PROD_DOMAIN : PARTNERS_STAGE_DOMAIN;
      url.port = '';
      return url;
    } catch (error) {
      return null;
    }
  }

  render() {
    return html`<div class="asset-preview-block-container">
      ${this.assetExist ? html`
          <div class="asset-preview-block-header">${this.blockData.localizedText['{{Asset detail}}']}: ${this.title}  (${this.getFileTypeFromTag()})</div>
          <div class="asset-preview-block-details ">
            <div class="asset-preview-block-details-left">
              <p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Date}}']}: </span>${this.createdDate}</p>
              <p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Audience}}']}: </span>${this.getTagsTitlesString(this.audienceTags)}</p>
              <p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Summary}}']}: </span>${this.isVideo ? this.description : this.summary || this.description}</p>
              <p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Type}}']}: </span>${this.getTagsTitlesString(this.fileFormatTags)}</p>
              <p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Tags}}']}: </span>${this.getTagsTitlesString(this.tags)}</p>
              <p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Size}}']}: </span class="bold">${this.size}</p>
            </div>
            <div class="asset-preview-block-details-right"
                 style="background-image:
                  url(${transformCardUrl(this.thumbnailUrl)}),
                   url(${transformCardUrl(DEFAULT_BACKGROUND_IMAGE_PATH)})"
            >
            </div>
         </div>
         
         
          ${!this.isRestrictedAssetForUser() ? html`
              <div class="asset-preview-block-actions">
              ${this.isPreviewEnabled(this.getFileTypeFromTag()) ? html`<button 
                class="outline" ><a target="_blank" rel="noopener noreferrer" href="${this.url}"> View </a></button>` : ''}
                <button class="filled" download="${this.title}"><a href="${this.getDownloadUrl()}">${this.blockData.localizedText['{{Download}}']}</a></button>
              ${this.backButtonUrl ? html`<a 
                class="link" href="${this.backButtonUrl}">${this.blockData.localizedText['{{Back to previous}}']}</a>` : ''}
              </div>` : ''}
  
        ${this.isVideo && !this.isRestrictedAssetForUser() ? html`
        <div class="asset-preview-block-video">
          <div class="video-container video-holder">
            <video  
              playsinline="" autoplay muted="" loop="" data-video-source="${this.getDownloadUrl()}"><source src="${this.getDownloadUrl()}" type="video/mp4"></video>
            <a @click="${() => this.togglePlay()}" class="pause-play-wrapper" title="Pause motion 3" aria-label="Pause motion 3 " role="button" tabindex="0" aria-pressed="true" video-index="3" daa-ll="Pause motion-1--">
              <div class="${this._video?.paused ? 'is-playing' : ''} offset-filler" >
                <img class="accessibility-control pause-icon" alt="Pause motion" src="https://milo.adobe.com/federal/assets/svgs/accessibility-pause.svg">
                <img class="accessibility-control play-icon" alt="Play motion" src="https://milo.adobe.com/federal/assets/svgs/accessibility-play.svg">
              </div>
            </a>
          </div>
        </div>`
    : ''}` : html`<div class="asset-preview-block-header">${this.blockData.localizedText['{{Asset not found}}']}</div>`}
    `;
  }

  // eslint-disable-next-line class-methods-use-this
  isPreviewEnabled(fileType) {
    const enabledTypes = ['PDF'];
    return enabledTypes.includes(fileType);
  }

  // eslint-disable-next-line class-methods-use-this
  getSizeInMb(size) {
    if (!size || isNaN(Number(size))) return '';
    const sizeInMb = Number(size / (1024 * 1024)).toFixed(2);
    const sizeInKb = Number(size / 1024).toFixed(2);
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
    tagParts.forEach((tagPart, i) => {
      if (tagParts.length - 1 > i) {
        caasPointer = caasPointer[tagPart].tags;
      } else {
        caasPointer = caasPointer[tagPart];
      }
    });
    return caasPointer || null;
  }

  getTagChildTagsObjects(tags, allTags, rootTag) {
    const filteredTags = tags.filter((t) => t.startsWith(rootTag));
    const tagsArray = [];
    filteredTags.forEach((tag) => {
      const tagObject = this.findTagByPath(this.allCaaSTags.namespaces.caas.tags, tag)
        || { tagId: tag, title: tag };
      tagsArray.push({ tagId: tag, title: tagObject.title });
    });
    return tagsArray;
  }

  getFileTypeFromTag() {
    // we should always have only one file format tag since it is added based on file type
    // or we should use this.fileType but this has some ugly values (see
    // https://git.corp.adobe.com/wcms/gravity/blob/develop/app-configuration/core/src/main/java/com/adobe/wcm/configuration/utils/CaaSContentDXUtils.java#L52
    if (this.fileFormatTags && this.fileFormatTags.length) { return this.fileFormatTags[0].title; }
    return '';
  }

  getTagsTitlesString(tags) {
    return tags?.map((tag, i) => `${tag.title}${this.tags.length - 1 > i ? ', ' : ''}`);
  }

  getDownloadUrl() {
    return setDownloadParam(
      this.url,
    );
  }

  isRestrictedAssetForUser() {
    const assetPxPartnerLevels = this.getTagChildTagsObjects(
      this.allAssetTags,
      this.allCaaSTags,
      PX_PARTNER_LEVELS_ROOT,
    ).map((t) => t.tagId);
    const userPartnerLevel = PARTNER_LEVEL ? PX_PARTNER_LEVELS[PARTNER_LEVEL.toUpperCase()] : '';
    if (!assetPxPartnerLevels.length
      || assetPxPartnerLevels.includes(PX_PARTNER_LEVELS.PUBLIC)
      || assetPxPartnerLevels.includes(userPartnerLevel)) {
      return false;
    }
    return true;
  }
}
