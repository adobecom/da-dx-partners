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
    isVideoPlaying: { type: Boolean, reflect: true },
    isLoading: { type: Boolean, reflect: true },
    isVideoLoading: { type: Boolean, reflect: true },
    assetPartnerLevel: { type: Array },
    pdfPreviewUrl: { type: String },
    chapters: { type: Object },
  };

  constructor() {
    super();
    this.assetHasData = false;
    this.tags = [];
    this.allAssetTags = [];
    this.allCaaSTags = [];
    this.isVideoPlaying = false;
    this.isVideo = false;
    this.isLoading = true;
    this.isVideoLoading = false;
    this.assetPartnerLevel = [];
    this.pdfPreviewUrl = '';
  }

  createRenderRoot() {
    return this;
  }

  // eslint-disable-next-line class-methods-use-this
  get _video() {
    return document.querySelector('video');
  }

  playVideo() {
    if (this._video) {
      const videoContainer = this._video.closest('.asset-preview-block-video');
      window.scrollTo({ top: videoContainer.offsetTop, behavior: 'smooth' });
      this._video.play();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  timeToSeconds(time) {
    const [hours, minutes, seconds] = time.split(':');

    return (
      Number(hours) * 3600
      + Number(minutes) * 60
      + Number(seconds)
    );
  }

  seekTo(time) {
    const seconds = this.timeToSeconds(time.split('-')[0].trim());
    // const video = this.videoRef.value;
    const video = this._video;

    if (!video) return;

    video.currentTime = seconds;
    video.play();
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
    // for domain we use what is in  window.location.href
    // (this assumes that on cards we have partners.stage.adobe.com or partners.adobe.com
    // on prod caas index we would have only have prod assets, so asset metadata
    // would always be found on prod
    // for stage, we will display also some assets from qa01 or dev02,
    // but will always fetch asset metadata from stage
    // so we should delete assets from lower env if they make us problem on stage
    const mappedAssetUrl = this.getRealAssetUrl();
    if (!mappedAssetUrl) return;
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
      ?.map((level) => DOMPurify.sanitize(level.toLowerCase()));
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
    this.chapters = assetMetadata.chapters || [];
    this.chapters = [
      {
        "title": "Session Kickoff And Introductions",
        "summary": "Joe Wax opens the session, introduces Adobe team members Adrian Witten, Nikki Wang, Michael Smith, and Manish Shah, and frames the roundtable as a strategic forum for top Marketo partners to weigh in on FY25 vision.",
        "timerange": "00:00:13.325 - 00:02:42.428"
      },
      {
        "title": "Addressing Marketo Engage Perception",
        "summary": "Adrian Witten addresses the market perception that Marketo Engage is going away, clarifying Adobe is doubling down on investments and accelerating innovation despite focus on AEP and AJO B2B Edition.",
        "timerange": "00:02:44.255 - 00:06:28.495"
      },
      {
        "title": "Partner Opportunities Overview",
        "summary": "Manish Shah outlines three partner opportunities from Marketo innovation: new services packages, re-engaging existing customers with new features, and higher win rates on net new opportunities against competitors.",
        "timerange": "00:06:29.788 - 00:07:33.117"
      },
      {
        "title": "Poll On Innovation Awareness Channels",
        "summary": "First poll asks partners how they hear about Marketo innovations. Top responses were Adobe Summit (25%) and Product Roadmap Webinars (21%), with SPP and partner communications also noted.",
        "timerange": "00:07:34.295 - 00:11:15.199"
      },
      {
        "title": "Marketo Roadmap And AI Vision",
        "summary": "Nikki Wang presents Marketo's roadmap focused on bringing Gen AI to three pillars: channels, content, and data. She explains how AI reduces hours to minutes and addresses changing buyer expectations post-pandemic.",
        "timerange": "00:11:16.245 - 00:18:56.185"
      },
      {
        "title": "Continuous Innovation And Shared Components",
        "summary": "Adrian reviews Marketo's ongoing innovation including smart campaigns updates, executable campaigns, and self-service flow steps. She explains how shared components across Adobe products like the email editor accelerate development for both Marketo and AJO B2B.",
        "timerange": "00:18:56.205 - 00:22:22.466"
      },
      {
        "title": "AI-Powered Marketo Engage Innovations",
        "summary": "Nikki details how AI unlocks lead-based journeys through Gen AI chat features, email authoring, improved Salesforce CRM connector, and Adobe real-time CDP connector improvements.",
        "timerange": "00:22:22.486 - 00:25:20.418"
      },
      {
        "title": "Discussion On Marketo Feature Access",
        "summary": "Danielle asks whether new features require additional Adobe product purchases. Nikki clarifies innovations like the new email designer, CRM sync, and Gen AI email are available to all Marketo customers, with some requiring legal terms.",
        "timerange": "00:25:20.955 - 00:29:09.394"
      },
      {
        "title": "AI Adoption Barriers Feedback",
        "summary": "Garrett raises concerns about enterprise customers facing internal legal and approval barriers to AI adoption. Nikki acknowledges this feedback, noting smaller customers embrace Gen AI more readily than larger brands.",
        "timerange": "00:29:16.403 - 00:32:16.547"
      },
      {
        "title": "New Email Designer Overview",
        "summary": "Nikki introduces the new email designer with modern templates, WYSIWYG editor, Gen AI content generation, reusable fragments, conditional content, native AEM Assets and Firefly connectors, and Adobe Express integration.",
        "timerange": "00:32:29.657 - 00:36:50.685"
      },
      {
        "title": "Email Designer Live Demo",
        "summary": "Mike Rusk demos the new email designer inside Marketo Design Studio, showcasing template selection, drag-and-drop editing, tokenization, AI Assistant prompt library, responsive previews, and upcoming conditional content and fragments.",
        "timerange": "00:36:51.446 - 00:41:41.151"
      },
      {
        "title": "Interactive Webinar Gen AI Features",
        "summary": "Adrian shares stories about Gen AI features for on-demand webinars that create chapters and summaries from transcripts, plus the engagement dashboard that tracks real-time attendee attention.",
        "timerange": "00:41:42.172 - 00:44:26.916"
      },
      {
        "title": "Salesforce CRM Sync Enhancements",
        "summary": "Nikki presents the newly launched Salesforce Sync dashboard, allowing MOPS admins to identify record sync backlogs and access best practices without contacting support, plus upcoming error reduction improvements.",
        "timerange": "00:44:26.956 - 00:45:24.258"
      },
      {
        "title": "Innovation Value Polls",
        "summary": "Two polls gauge which innovations partners and their customers find most valuable. New email designer led responses, followed by CRM sync and landing pages/forms, matching customer feedback trends.",
        "timerange": "00:45:25.891 - 00:47:50.969"
      },
      {
        "title": "IMS Migration Reminder",
        "summary": "Adrian and Manish remind partners to migrate sandboxes to Adobe Identity Management System to access new features. Manish provides the SPP help email process for initiating migration for classic Marketo Engage instances.",
        "timerange": "00:47:55.228 - 00:53:32.832"
      },
      {
        "title": "Partner Feedback On Roadmap",
        "summary": "Tom and Cindy share reactions praising the Gen AI email and Salesforce sync features. Concerns raised about velocity script migration, template redesign efforts, and whether migration projects positively impact partner practices versus delaying customer ROI work.",
        "timerange": "00:53:34.514 - 00:59:49.743"
      },
      {
        "title": "Migration Tooling Discussion",
        "summary": "Nikki confirms the PM team is working on tools to help migrate customers from the old to new email designer. Partners request the ability to perform migrations themselves, similar to the IMS migration approach.",
        "timerange": "00:59:49.743 - 01:00:57.622"
      },
      {
        "title": "Wrap-Up And Next Steps",
        "summary": "Joe wraps up, thanking partners and outlining next steps: sharing the recording and cleaned-up presentation deck via the Solution Partner Portal, with continued Q&A available through Manish, Adrian, and Nikki.",
        "timerange": "01:01:02.841 - 01:01:45.453"
      }
    ];
  }

  // eslint-disable-next-line class-methods-use-this
  getRealAssetUrl() {
    const assetMetadataPath = window.location.href.replace(DIGITALEXPERIENCE_PREVIEW_PATH, PX_ASSETS_PREVIEW_PATH).replace('.html', '/_jcr_content/metadata.assetmetadata.json');
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
            ${this.size ? html`<p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Size}}']}: </span class="bold">${unsafeHTML(this.size)}</p>` : ''}

            ${!this.isRestrictedAssetForUser() ? html`
              <div class="asset-preview-block-actions" daa-lh="Asset preview block actions">
                ${this.isPreviewEnabled(this.getFileTypeFromTag()) ? html`<button
                  class="outline" ><a target="_blank" rel="noopener noreferrer" href="${this.getDownloadUrl()}" daa-ll="View"> View </a></button>` : ''}
                ${!this.isVideo ? html`<button class="filled"><a download="${this.title}" href="${this.getDownloadUrl()}" daa-ll="${this.blockData.localizedText[`{{${this.getLabelBasedOnFileExtension(this.url)}}}`]}">${this.blockData.localizedText[`{{${this.getLabelBasedOnFileExtension(this.url)}}}`]}</a></button>` : ''}
                ${this.webinarPresentation ? html`
                  <button class="filled"><a  download="${`${this.title}_presentation`}" href="${this.getWebinarPresentationDownloadUrl()}" daa-ll="${this.blockData.localizedText[`{{${this.getLabelBasedOnFileExtension(this.webinarPresentation)}}}`]}">${this.blockData.localizedText[`{{${this.getLabelBasedOnFileExtension(this.webinarPresentation)}}}`]}</a></button>
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
              : html`<img src="${transformCardUrl(this.previewImage)}" @error="${this._handleImgError}"/>`
            }
          </div>
        </div>

        ${this.isVideo && !this.isRestrictedAssetForUser() ? html`
            <div class="asset-preview-block-video">
              <div class="video-container video-holder">
                ${this.isVideoLoading ? html`
                  <div class="video-loading-overlay">
                    <div class="video-loading-spinner"></div>
                  </div>
                ` : ''}

                <video
                  preload="auto"
                  @play="${() => { this.isVideoPlaying = true; }}"
                  @pause="${() => { this.isVideoPlaying = false; }}"
                  @loadstart="${() => { this.isVideoLoading = true; }}"
                  @canplay="${() => { this.isVideoLoading = false; }}"
                  @error="${() => { this.isVideoLoading = false; }}"
                  playsinline=""
                  loop=""
                  data-video-source="${this.getDownloadUrl()}"
                  oncontextmenu="return false;"
                  controls
                  controlsList="nodownload"
                >
                  <source src="${this.getDownloadUrl()}" type="${this.fileType}">
                  <source src="${this.getDownloadUrl()}" type="video/mp4">
                </video>
              </div>
              <div class="video-chapters">
                ${this.chapters.length > 0 ? this.renderChapters() : ''}
              </div>
            </div>`
          : ''}` : html`<div class="asset-preview-block-header">${this.isLoading ? this.blockData.localizedText['{{Loading data}}'] : this.blockData.localizedText['{{Asset data not found}}']}</div>`}
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
    // we should always have only one file format tag since it is added based on file type
    // or we should use this.fileType but this has some ugly values (see
    // https://git.corp.adobe.com/wcms/gravity/blob/develop/app-configuration/core/src/main/java/com/adobe/wcm/configuration/utils/CaaSContentDXUtils.java#L52
    if (this.fileFormatTags && this.fileFormatTags.length) { return this.fileFormatTags[0].title; }
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

  // eslint-disable-next-line class-methods-use-this
  formatTime(time) {
    const starttime = time.split('-')[0].trim();
    return starttime;
  }

  renderChapters() {
    return this.chapters.map((chapter) => html`
      <div class="chapter" @click="${() => this.seekTo(chapter.timerange)}">
        <div class="chapter-time">${this.formatTime(chapter.timerange)}</div>
        <div class="chapter-title">${chapter.title}</div>
        <div class="chapter-summary">${chapter.summary}</div>
      </div>
    `);
  }
}
