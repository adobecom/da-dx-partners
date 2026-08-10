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
        "title": "Welcome And Session Context",
        "summary": "Joe Wax opens the roundtable, introduces the Marketo Engage product marketing team including Adrian Witten, Nikki Wang, Michael Smith, and Manish Shah, and explains this is a hand-picked strategic partner forum for feedback on FY25 innovation investments.",
        "timerange": "00:00:13.325 - 00:02:42.133"
      },
      {
        "title": "Addressing Marketo Engage Market Perception",
        "summary": "Adrian Witten addresses the market perception that Marketo Engage is going away, clarifying that Adobe is doubling down on Marketo investments and accelerating innovation despite the launch of Adobe Journey Optimizer B2B Edition.",
        "timerange": "00:02:44.255 - 00:06:28.495"
      },
      {
        "title": "Partner Opportunities From Marketo Innovation",
        "summary": "Manish Shah outlines three key partner opportunities: new services packages around Marketo innovations, re-engaging existing customers with new features, and higher win rates on net new opportunities against competitors.",
        "timerange": "00:06:29.788 - 00:08:53.117"
      },
      {
        "title": "Partner Communication Channels Poll",
        "summary": "Nikki Wang launches the first poll asking partners how they hear about new Marketo innovations. Results show Adobe Summit leads at 25%, followed by product roadmap webinars at 21%, with diverse engagement across channels.",
        "timerange": "00:08:54.295 - 00:12:45.293"
      },
      {
        "title": "Website Updates And Awareness Poll",
        "summary": "Adrian discusses working with the web team to improve business.adobe.com for surfacing innovations, noting new feature videos launched in September. A second poll is launched to gauge awareness of upcoming innovations.",
        "timerange": "00:12:51.107 - 00:14:14.418"
      },
      {
        "title": "Marketo Roadmap And AI Vision",
        "summary": "Nikki presents Marketo's roadmap focused on bringing Gen AI to improve three marketing pillars: channels, content, and data. She frames Marketo Engage as a digital foundation and marketing hub for mature customers.",
        "timerange": "00:14:14.458 - 00:17:14.0"
      },
      {
        "title": "Changing Buyer Expectations And AI Opportunity",
        "summary": "Nikki explains how the pandemic accelerated digital maturity, modern B2B buyers avoid forms and prefer digital surfaces, and AI has advanced to help marketers create content and conversations that meet these shifting expectations.",
        "timerange": "00:17:14.700 - 00:19:04.402"
      },
      {
        "title": "Upcoming Innovations Poll Results",
        "summary": "Poll results show the new email designer with Gen AI at 26% and Gen AI chat in-the-moment responses as the top awareness items. Nikki previews the new email designer, chat/webinar AI features, CRM connector improvements, and AEM assets live link.",
        "timerange": "00:19:04.782 - 00:21:12.635"
      },
      {
        "title": "Continuous Marketo Engage Innovation History",
        "summary": "Adrian highlights Marketo's continuous innovation since the Adobe acquisition, noting features like smart campaigns are constantly updated, and calls out executable campaigns and self-service flow steps as high-value but under-marketed features.",
        "timerange": "00:21:12.655 - 00:24:35.176"
      },
      {
        "title": "Analyst Recognition And Shared Adobe Innovation",
        "summary": "Adrian references IDC, Forrester, and Gartner Magic Quadrant leadership, then explains how Adobe now ports innovation across products, such as sharing the email editor between Marketo Engage and Adobe Journey Optimizer B2B and B2C editions.",
        "timerange": "00:24:35.196 - 00:26:54.908"
      },
      {
        "title": "Distinct Use Cases Across Adobe Products",
        "summary": "Adrian clarifies that while Marketo Engage, RCDP, and AJO B2B Edition share components, they have distinct use cases: Marketo for lead-based and account-based marketing, AJO for buying group marketing.",
        "timerange": "00:26:55.797 - 00:27:22.466"
      },
      {
        "title": "AI-Powered Innovations For Marketo Users",
        "summary": "Nikki details how AI unlocks lead-based journeys at scale through Gen AI chat features, email authoring, on-demand webinar summaries, and improved Salesforce CRM and Adobe Real-Time CDP connectors.",
        "timerange": "00:27:22.486 - 00:29:59.823"
      },
      {
        "title": "Discussion On Feature Availability And Licensing",
        "summary": "Danielle asks whether new features require additional Adobe product purchases. Nikki clarifies most innovations including the new email designer, Gen AI email, and CRM sync are available to all Marketo customers, with some usage limits.",
        "timerange": "00:30:00.129 - 00:35:09.428"
      },
      {
        "title": "Marketo-Only Sales Focus And AI Adoption Barriers",
        "summary": "Nikki confirms Adobe still has dedicated Marketo sales teams. Garrett raises enterprise customer barriers to AI adoption due to legal concerns, which Nikki acknowledges as valid feedback also heard from customers.",
        "timerange": "00:35:09.428 - 00:37:46.237"
      },
      {
        "title": "New Email Designer Deep Dive",
        "summary": "Nikki details the new email designer featuring modern templates, WYSIWYG editor, Gen AI content generation, reusable fragments, conditional content, and native connectors to AEM Assets, Adobe Firefly, and Adobe Express. Adobe IMS migration is required.",
        "timerange": "00:37:49.036 - 00:40:50.719"
      },
      {
        "title": "Email Designer Live Demo",
        "summary": "Mike demonstrates the new email designer in Marketo Design Studio, showing email creation, personalization tokens, drag-and-drop editing, AEM live connection, AI Assistant with prompt library, device previews, and simulation features.",
        "timerange": "00:40:51.480 - 00:45:44.798"
      },
      {
        "title": "Interactive Webinar Gen AI Features",
        "summary": "Adrian shares two stories about interactive webinar innovations: Gen AI automated chapter breaks and summaries from webinar transcripts which customers pushed to production during beta, and an engagement dashboard that shows in real-time who isn't paying attention.",
        "timerange": "00:45:47.000 - 00:48:42.275"
      },
      {
        "title": "Salesforce CRM Sync Enhancements",
        "summary": "Nikki introduces the live Salesforce Sync dashboard letting MOps admins identify sync backlogs themselves without contacting support, plus upcoming updates to reduce errors and improve reliability.",
        "timerange": "00:48:42.295 - 00:50:19.092"
      },
      {
        "title": "Feature Value Polls And IMS Migration",
        "summary": "Polls reveal partners rank the new email designer, CRM sync, and landing pages/forms as most valuable. Adrian and Manish encourage partners to email SPP help to migrate sandboxes from classic Marketo to the IMS instance.",
        "timerange": "00:50:19.810 - 00:55:32.838"
      },
      {
        "title": "Partner Feedback On Roadmap And Migration",
        "summary": "Tom, Cindy, and others share feedback: Gen AI email is a frequently asked question, velocity scripting migration is a concern, and Cindy notes that migration work may divert resources from ROI-driving customer projects.",
        "timerange": "00:55:33.559 - 00:59:59.093"
      },
      {
        "title": "Migration Support And Partner Enablement",
        "summary": "Nikki confirms the old and new email designers will run in parallel for over a year. Partners request that Adobe provide migration tooling that partners can leverage to help clients transition, similar to the IMS migration approach.",
        "timerange": "01:00:00.009 - 01:02:32.306"
      },
      {
        "title": "Wrap Up And Next Steps",
        "summary": "Manish closes by outlining next steps: sharing the recording and refined pitch deck via the Solution Partner Portal, encouraging continued questions through Adrian, Nikki, and himself, and thanking partners for their strategic feedback.",
        "timerange": "01:02:34.735 - 01:04:21.335"
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
              <div class="${this.chapters.length > 0 ? 'video-chapters visible' : 'video-chapters hidden'}">
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
