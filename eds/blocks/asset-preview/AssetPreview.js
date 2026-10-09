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

const chapters = [
  {
    title: 'Welcome And Speaker Introductions',
    summary: 'Natalie Niehoff welcomes attendees to the AJO Loyalty Go-To-Market Launch webinar and introduces Tyler Hogan, Kira Fawcett, and Daniel Vivas from the product marketing and management teams.',
    timerange: '00:00:01.001 - 00:01:31.625',
  },
  {
    title: 'Agenda And Session Goals',
    summary: 'Tyler outlines the agenda covering product overview, demo, use cases, and FAQs, aiming for partners to confidently discuss Adobe\'s loyalty strategy and value with customers.',
    timerange: '00:01:31.625 - 00:02:22.906',
  },
  {
    title: 'Why Partners Should Be Excited',
    summary: 'Tyler explains the market shift driven by rising acquisition costs and AI disruption, introduces the loyalty leader persona, and highlights AJO Loyalty as a standalone offering with strong market demand.',
    timerange: '00:02:22.906 - 00:05:22.223',
  },
  {
    title: 'Market Headwinds And Loyalty Importance',
    summary: 'Discussion of Gartner and Bain data showing declining organic search, rising acquisition costs, and 78% of retail executives believing generative AI will weaken brand loyalty, positioning loyalty as a strategic asset.',
    timerange: '00:05:22.959 - 00:07:12.258',
  },
  {
    title: 'Evolution Of Loyalty Programs',
    summary: 'Tyler traces loyalty\'s evolution from transactional point systems through experiential gamification to the future vision of loyalty as an AI-powered growth engine capturing zero-party data.',
    timerange: '00:07:14.346 - 00:08:53.278',
  },
  {
    title: 'Blockers To Modern Loyalty',
    summary: 'Four key blockers are outlined: fragmented data, static programs, operational silos and lag, and underutilization of AI, with 60% of loyalty spend going to manual services.',
    timerange: '00:08:53.778 - 00:11:32.270',
  },
  {
    title: 'Current Loyalty Solution Approaches',
    summary: 'Tyler reviews three approaches brands take today: in-house solutions, pure-play loyalty management platforms, and enterprise ecosystems, identifying gaps in personalization, orchestration, and agentic AI.',
    timerange: '00:11:33.132 - 00:13:27.365',
  },
  {
    title: 'Introducing AJO Loyalty',
    summary: 'Tyler introduces Adobe Journey Optimizer Loyalty as an AI-first orchestration app built on AEP with three core capabilities: agentic AI, personalized gamification, and unified loyalty data.',
    timerange: '00:13:32.412 - 00:14:29.143',
  },
  {
    title: 'Agentic AI Capabilities',
    summary: 'Deep dive into always-on agentic AI that identifies high-value members, flags churn risks, recommends tactics, and measures incremental ROI tied to customer lifetime value and AOV.',
    timerange: '00:14:30.453 - 00:15:47.013',
  },
  {
    title: 'Personalized Gamification',
    summary: 'Overview of the no-code personalized gamification capability enabling one-to-one challenges that adapt to member behavior, lifecycle stage, and preferences with cross-channel messaging orchestration.',
    timerange: '00:15:50.194 - 00:16:53.814',
  },
  {
    title: 'Integration With Existing Loyalty Stack',
    summary: 'Tyler emphasizes AJO Loyalty complements existing loyalty infrastructure via custom integrations and connectors, with the loyalty management platform remaining the system of record while AJO orchestrates experiences.',
    timerange: '00:16:53.814 - 00:18:45.641',
  },
  {
    title: 'Roadmap Preview By Kira',
    summary: 'Kira previews upcoming enhancements including integration with decisioning and experimentation, positioning this launch as the beginning of a broader roadmap.',
    timerange: '00:18:49.554 - 00:19:22.525',
  },
  {
    title: 'Demo Introduction And AI Agent',
    summary: 'Kira begins the demo in AJO Loyalty, showing the insights section with anomaly detection and demonstrates coworker agent skills to create a “Mad About Matcha” challenge via prompts.',
    timerange: '00:19:24.051 - 00:24:51.846',
  },
  {
    title: 'Form-Based Challenge Creation',
    summary: 'Daniel walks through form-based challenge creation, showing three challenge types and reviews the general setup including AEP audiences and manual opt-in or event triggers.',
    timerange: '00:24:52.688 - 00:29:59.923',
  },
  {
    title: 'Challenge Structure And Tasks',
    summary: 'Daniel demonstrates the structure section, creating tasks with activity types including purchase, spend, and custom events tied to AEP experience events, with SKU-level or product group eligibility.',
    timerange: '00:30:15.493 - 00:33:31.707',
  },
  {
    title: 'Rewards Configuration',
    summary: 'Daniel explains reward setup, connecting to partner endpoints like Capillary via API to issue points upon challenge completion, with plans for multiple reward types like points and miles later in the year.',
    timerange: '00:33:34.117 - 00:34:57.325',
  },
  {
    title: 'Content And Messaging Orchestration',
    summary: 'Daniel demonstrates content creation via AJO content cards and code-based experiences, plus messaging orchestration across six AJO channels at launch, in-progress, and end phases of the challenge.',
    timerange: '00:34:57.325 - 00:38:15.274',
  },
  {
    title: 'Auto-Generated Journey',
    summary: 'Daniel shows how AJO Loyalty auto-generates a journey from the configured challenge, including read audience, content card, and messaging nodes, with full journey features like dry run and experimentation available.',
    timerange: '00:38:17.711 - 00:39:40.222',
  },
  {
    title: 'Loyalty Admin Section',
    summary: 'Daniel walks through the admin section for configuring reward providers, event definitions for custom events, and product inventory uploads to simplify marketer workflows.',
    timerange: '00:39:40.883 - 00:41:12.249',
  },
  {
    title: 'Reporting Powered By CJA',
    summary: 'Daniel explains the CJA-backed reporting section providing out-of-the-box per-challenge reports, with data available for deeper CJA analysis if customers have CJA licensed.',
    timerange: '00:41:14.035 - 00:42:34.348',
  },
  {
    title: 'Customer Zero Case Study',
    summary: 'Daniel shares how AJO Loyalty was born from a customer needing sub-two-second challenge task delivery at fuel pumps, launching 12-14 million challenges with less than two-second latency where journeys couldn’t scale.',
    timerange: '00:42:35.543 - 00:46:36.350',
  },
  {
    title: 'Use Cases Across Verticals',
    summary: 'Tyler covers use cases including identifying high-propensity members, gamifying onboarding, driving purchase behaviors, incentivizing zero-party data capture, and personalizing reward amounts based on CLV.',
    timerange: '00:46:36.370 - 00:49:33.298',
  },
  {
    title: 'Ideal Customers And Personas',
    summary: 'Tyler identifies top verticals and target personas including loyalty program owners, CRM and lifecycle marketing leaders.',
    timerange: '00:49:33.358 - 00:50:35.556',
  },
  {
    title: 'Pricing And Packaging',
    summary: 'AJO Loyalty is a new base SKU chargeable on engagement profiles, sold standalone or as add-on, with included agentic features, though not yet compatible with healthcare and privacy security shields.',
    timerange: '00:50:35.556 - 00:52:00.840',
  },
  {
    title: 'Product Roadmap',
    summary: 'Tyler previews roadmap investments including expansion to all 14 AJO channels, decisioning and experimentation integration, coupon codes, brand concierge integration, and additional agentic skills.',
    timerange: '00:52:01.275 - 00:54:27.977',
  },
  {
    title: 'Resources And Enablement',
    summary: 'Tyler shares available resources on Partner Experience Hub including FAQ, pitch deck, verticalized decks, demo hub assets, virtual tour, and Experience League documentation.',
    timerange: '00:54:29.907 - 00:55:59.122',
  },
  {
    title: 'Q&A And Closing',
    summary: 'Team addresses questions on journey exclusion criteria and reward endpoint standards before Natalie closes the session.',
    timerange: '00:56:08.820 - 00:58:11.273',
  },
];

const miloLibs = getLibs();
const { html, LitElement, unsafeHTML } = await import(`${miloLibs}/deps/lit-all.min.js`);
const { loadStyle } = await import(`${miloLibs}/utils/utils.js`);
await Promise.all([
  import('../../components/LoadingSpinner.js'),
  loadStyle('/eds/components/LoadingSpinner.css'),
]);
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
    selectedChapterIndex: { type: Number },
    currentTime: { type: Number },
    sharedChapterIndex: { type: Number },
    videoDuration: { type: Number },
    videoVolume: { type: Number },
    videoMuted: { type: Boolean },
    playbackSpeed: { type: Number },
    chaptersVisible: { type: Boolean },
    settingsMenuOpen: { type: Boolean },
    volumeExpanded: { type: Boolean },
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
    this.selectedChapterIndex = 0;
    this.currentTime = 0;
    this.sharedChapterIndex = -1;
    this.shareResetTimer = null;
    this.videoDuration = 0;
    this.videoVolume = 1;
    this.videoMuted = false;
    this.playbackSpeed = 1;
    this.chaptersVisible = true;
    this.settingsMenuOpen = false;
    this.volumeExpanded = false;
    this.restoreChapterFromUrl();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.shareResetTimer);
    if (this.chaptersTrackUrl) URL.revokeObjectURL(this.chaptersTrackUrl);
    this.chaptersTrackUrl = null;
  }

  createRenderRoot() {
    return this;
  }

  // eslint-disable-next-line class-methods-use-this
  get _video() {
    return this.querySelector('video') || (!this.isConnected && document.querySelector('video'));
  }

  playVideo() {
    if (this._video) {
      const videoContainer = this._video.closest('.asset-preview-block-video');
      window.scrollTo({ top: videoContainer.offsetTop, behavior: 'smooth' });
      this._video.play();
    }
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

  // eslint-disable-next-line class-methods-use-this
  timecodeToSeconds(timecode) {
    const [hours, minutes, seconds] = timecode.split(':');
    return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
  }

  // eslint-disable-next-line class-methods-use-this
  getStartTime(timerange) {
    return timerange.split(' - ')[0];
  }

  getChapterProgress(index) {
    if (index !== this.selectedChapterIndex) return 0;

    const [startTime, endTime] = chapters[index].timerange.split(' - ');
    const start = this.timecodeToSeconds(startTime);
    const end = this.timecodeToSeconds(endTime);
    const progress = ((this.currentTime - start) / (end - start)) * 100;

    return Math.max(0, Math.min(100, progress));
  }

  handleVideoTimeUpdate(event) {
    const video = event.currentTarget;
    this.currentTime = video.currentTime;
    this.videoDuration = Number.isFinite(video.duration) ? video.duration : 0;
    const index = chapters.findIndex((chapter, chapterIndex) => {
      const next = chapters[chapterIndex + 1];
      return video.currentTime >= this.timecodeToSeconds(this.getStartTime(chapter.timerange))
        && (!next || video.currentTime < this.timecodeToSeconds(this.getStartTime(next.timerange)));
    });
    this.selectedChapterIndex = Math.max(0, index);
  }

  get playerDuration() {
    return this.videoDuration || this.timecodeToSeconds(chapters[chapters.length - 1].timerange.split(' - ')[1]);
  }

  toggleVideoPlayback() {
    const video = this._video;
    if (!video) return;
    if (video.paused) video.play()?.catch(() => {});
    else video.pause();
  }

  seekVideo(time) {
    if (!this._video) return;
    this._video.currentTime = Math.max(0, Math.min(this.playerDuration, time));
    this.handleVideoTimeUpdate({ currentTarget: this._video });
  }

  handleProgressPointer(event) {
    const progress = event.currentTarget;
    if (event.type === 'pointerdown') progress.setPointerCapture(event.pointerId);
    if (event.type === 'pointermove' && !progress.hasPointerCapture(event.pointerId)) return;
    const rect = progress.getBoundingClientRect();
    if (rect.width) {
      this.seekVideo(((event.clientX - rect.left) / rect.width) * this.playerDuration);
    }
    if (event.type === 'pointerup' && progress.hasPointerCapture(event.pointerId)) {
      progress.releasePointerCapture(event.pointerId);
    }
  }

  handlePlayerKeydown(event) {
    if (event.target.closest('button, input, select')) return;
    const actions = {
      ArrowLeft: () => this.seekVideo(this.currentTime - 5),
      ArrowRight: () => this.seekVideo(this.currentTime + 5),
      Home: () => this.seekVideo(0),
      End: () => this.seekVideo(this.playerDuration),
      ' ': () => this.toggleVideoPlayback(),
      Escape: () => {
        this.settingsMenuOpen = false;
      },
    };
    if (actions[event.key]) {
      event.preventDefault();
      actions[event.key]();
    }
  }

  handleVolumeChange() {
    this.videoVolume = this._video.volume;
    this.videoMuted = this._video.muted;
  }

  async toggleVideoFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await this.querySelector('.video-holder').requestFullscreen();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unable to change video fullscreen:', error);
    }
  }

  formatTimecode(timecode) {
    const totalSeconds = Math.floor(this.timecodeToSeconds(timecode));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  createChapterUrl(index) {
    const url = new URL(window.location.href);

    url.searchParams.set('chapter', String(index + 1));
    url.searchParams.set(
      't',
      String(this.timecodeToSeconds(this.getStartTime(chapters[index].timerange))),
    );

    return url.toString();
  }

  markChapterShared(index) {
    clearTimeout(this.shareResetTimer);
    this.sharedChapterIndex = index;
    this.shareResetTimer = setTimeout(() => {
      this.sharedChapterIndex = -1;
      this.shareResetTimer = null;
    }, 2000);
  }

  async shareChapter(index, event) {
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(this.createChapterUrl(index));
      this.markChapterShared(index);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy chapter URL:', error);
    }
  }

  restoreChapterFromUrl() {
    const params = new URL(window.location.href).searchParams;
    const chapterIndex = Number(params.get('chapter')) - 1;
    const timestamp = params.has('t') && params.get('t').trim() !== ''
      ? Number(params.get('t')) : NaN;
    const timestampIndex = chapters.findIndex((chapter) => {
      const [start, end] = chapter.timerange.split(' - ').map((time) => this.timecodeToSeconds(time));
      return Number.isFinite(timestamp) && timestamp >= start && timestamp < end;
    });
    const index = Number.isInteger(chapterIndex) && chapters[chapterIndex]
      ? chapterIndex : timestampIndex;
    if (index < 0) return;

    this.selectedChapterIndex = index;
    const [start, end] = chapters[index].timerange.split(' - ').map((time) => this.timecodeToSeconds(time));
    this.currentTime = Number.isFinite(timestamp) && timestamp >= start && timestamp < end
      ? timestamp : start;
  }

  handleVideoLoadedMetadata(event) {
    event.currentTarget.currentTime = this.currentTime;
    this.videoDuration = Number.isFinite(event.currentTarget.duration)
      ? event.currentTarget.duration : 0;
    const track = event.currentTarget.querySelector('track[kind="chapters"]');
    if (track) track.track.mode = 'hidden';
  }

  createChaptersTrackUrl() {
    if (!this.chaptersTrackUrl) {
      const cues = chapters.map((chapter, index) => {
        const [start, end] = chapter.timerange.split(' - ');
        return `${index + 1}\n${start} --> ${end}\n${chapter.title}\n`;
      });
      this.chaptersTrackUrl = URL.createObjectURL(
        new Blob([`WEBVTT\n\n${cues.join('\n')}`], { type: 'text/vtt' }),
      );
    }
    return this.chaptersTrackUrl;
  }

  // eslint-disable-next-line class-methods-use-this
  formatVideoTime(time) {
    const total = Number.isFinite(time) ? Math.max(0, Math.floor(time)) : 0;
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }

  setPlaybackSpeed(speed) {
    if (!this._video) return;
    this._video.playbackRate = speed;
    this.playbackSpeed = speed;
    this.settingsMenuOpen = false;
  }

  // eslint-disable-next-line class-methods-use-this
  renderPlayerIcon(name) {
    const paths = {
      play: 'M8 5l11 7-11 7z',
      pause: 'M8 5v14M16 5v14',
      back: 'M3 10a9 9 0 1 1 1 9M3 4v6h6',
      forward: 'M21 10a9 9 0 1 0-1 9M21 4v6h-6',
      volume: 'M3 9h4l5-4v14l-5-4H3zM16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14',
      muted: 'M3 9h4l5-4v14l-5-4H3zM17 9l5 6M22 9l-5 6',
      next: 'M5 5l11 7-11 7zM19 5v14',
      chapters: 'M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1',
      fullscreen: 'M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5',
      settings: 'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1',
    };
    return html`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="${paths[name]}" />
      ${name === 'settings' ? html`<circle cx="12" cy="12" r="3" />` : ''}
      ${['back', 'forward'].includes(name)
    ? html`<text x="8" y="15" stroke="none" fill="currentColor" font-size="8">10</text>` : ''}
    </svg>`;
  }

  renderVideoControls() {
    const chapter = chapters[this.selectedChapterIndex];
    const nextIndex = (this.selectedChapterIndex + 1) % chapters.length;
    const percent = Math.max(0, Math.min(100, (this.currentTime / this.playerDuration) * 100));
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    /* eslint-disable indent */
    return html`
      <div class="video-tint"></div>
      <div class="player-chapter-pill">
        ${this.renderPlayerIcon('chapters')}
        <span>Chapter ${this.selectedChapterIndex + 1}</span>
        <strong>${chapter.title}</strong>
      </div>
      <button class="player-center-play" type="button" aria-label="Play" title="Play"
        ?hidden="${this.isVideoPlaying}" @click="${this.toggleVideoPlayback}">
        ${this.renderPlayerIcon('play')}
      </button>
      <div class="player-settings-menu" ?hidden="${!this.settingsMenuOpen}">
        <label>Playback speed
          <select aria-label="Playback speed" .value="${String(this.playbackSpeed)}"
            @change="${(event) => this.setPlaybackSpeed(Number(event.target.value))}">
            ${speeds.map((speed) => html`<option value="${speed}">${speed}x</option>`)}
          </select>
        </label>
      </div>
      <div class="player-controls">
        <div class="player-progress" role="slider" tabindex="0" aria-label="Video progress"
          aria-valuemin="0" aria-valuemax="${this.playerDuration}"
          aria-valuenow="${Math.min(this.currentTime, this.playerDuration)}"
          aria-valuetext="${this.formatVideoTime(this.currentTime)} of ${
            this.formatVideoTime(this.playerDuration)}"
          @pointerdown="${this.handleProgressPointer}" @pointermove="${this.handleProgressPointer}"
          @pointerup="${this.handleProgressPointer}">
          <div class="player-progress-track"></div>
          ${chapters.map((item) => {
            const [start, end] = item.timerange.split(' - ').map((time) => this.timecodeToSeconds(time));
            const left = Math.min(100, (start / this.playerDuration) * 100);
            const right = (Math.min(end, this.playerDuration) / this.playerDuration) * 100;
            const width = Math.max(0, right - left);
            return html`<div class="player-chapter-segment" title="${item.title}"
              style="left:${left}%;width:${width}%"></div>`;
          })}
          <div class="player-progress-played" style="width:${percent}%"></div>
          <div class="player-progress-thumb" style="left:${percent}%"></div>
        </div>
        <div class="player-bottom-row">
          <div class="player-controls-left">
            <button class="player-control-button" type="button"
              aria-label="${this.isVideoPlaying ? 'Pause' : 'Play'}"
              title="${this.isVideoPlaying ? 'Pause' : 'Play'}" @click="${this.toggleVideoPlayback}">
              ${this.renderPlayerIcon(this.isVideoPlaying ? 'pause' : 'play')}
            </button>
            <button class="player-control-button" type="button" aria-label="Rewind 10 seconds"
              title="Rewind 10 seconds" @click="${() => this.seekVideo(this.currentTime - 10)}">
              ${this.renderPlayerIcon('back')}
            </button>
            <button class="player-control-button" type="button" aria-label="Forward 10 seconds"
              title="Forward 10 seconds" @click="${() => this.seekVideo(this.currentTime + 10)}">
              ${this.renderPlayerIcon('forward')}
            </button>
            <div class="player-volume ${this.volumeExpanded ? 'expanded' : ''}"
              @mouseleave="${() => { this.volumeExpanded = false; }}"
              @focusout="${(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) this.volumeExpanded = false;
              }}">
              <button class="player-control-button" type="button"
                aria-label="${this.videoMuted ? 'Unmute' : 'Mute'}"
                title="${this.videoMuted ? 'Unmute' : 'Mute'}"
                @click="${() => {
                  this._video.muted = !this._video.muted;
                  this.volumeExpanded = true;
                  this.handleVolumeChange();
                }}">
                ${this.renderPlayerIcon(this.videoMuted || !this.videoVolume ? 'muted' : 'volume')}
              </button>
              <input type="range" min="0" max="1" step="0.01" aria-label="Volume"
                ?hidden="${!this.volumeExpanded}"
                .value="${String(this.videoMuted ? 0 : this.videoVolume)}"
                @input="${(event) => {
                  this._video.volume = Number(event.target.value);
                  this._video.muted = this._video.volume === 0;
                  this.handleVolumeChange();
                }}" />
            </div>
            <span class="player-time">${this.formatVideoTime(this.currentTime)} / ${this.formatVideoTime(this.playerDuration)}</span>
          </div>
          <button class="player-next-chapter" type="button"
            aria-label="Go to next chapter: ${chapters[nextIndex].title}"
            title="Go to next chapter: ${chapters[nextIndex].title}"
            @click="${() => this.selectChapter(nextIndex)}">
            ${this.renderPlayerIcon('next')}<span>${chapter.summary}</span>
          </button>
          <div class="player-controls-right">
            <button class="player-speed" type="button" aria-label="Playback speed"
              title="Playback speed" @click="${() => {
                const cycle = [1, 1.25, 1.5, 2, 0.75];
                const nextSpeed = (cycle.indexOf(this.playbackSpeed) + 1) % cycle.length;
                this.setPlaybackSpeed(cycle[nextSpeed]);
              }}">${this.playbackSpeed}x</button>
            <button class="player-control-button" type="button" aria-label="Settings" title="Settings"
              aria-expanded="${this.settingsMenuOpen}" @click="${() => {
                this.settingsMenuOpen = !this.settingsMenuOpen;
              }}">${this.renderPlayerIcon('settings')}</button>
            <button class="player-control-button" type="button" aria-label="Chapters" title="Chapters"
              aria-expanded="${this.chaptersVisible}" @click="${() => {
                this.chaptersVisible = !this.chaptersVisible;
                this.settingsMenuOpen = false;
              }}">${this.renderPlayerIcon('chapters')}</button>
            <button class="player-control-button" type="button" aria-label="Fullscreen" title="Fullscreen"
              @click="${this.toggleVideoFullscreen}">${this.renderPlayerIcon('fullscreen')}</button>
          </div>
        </div>
      </div>
    `;
    /* eslint-enable indent */
  }

  selectChapter(index) {
    const chapter = chapters[index];
    if (!chapter) return;

    this.selectedChapterIndex = index;
    const startTime = this.timecodeToSeconds(this.getStartTime(chapter.timerange));
    this.currentTime = startTime;

    const video = this._video;
    if (!video) return;

    if (video.readyState >= 1) video.currentTime = startTime;

    video.play().catch(() => {
      // Playback may require user interaction in some browsers.
    });
  }

  renderChapters() {
    return chapters.map((chapter, index) => {
      const [startTime, endTime] = chapter.timerange.split(' - ');

      /* eslint-disable indent */
      return html`
        <article
          class="chapter ${this.selectedChapterIndex === index ? 'is-active' : ''}"
          id="chapter-${index + 1}"
          role="button"
          tabindex="0"
          aria-current="${this.selectedChapterIndex === index ? 'true' : 'false'}"
          @click="${() => this.selectChapter(index)}"
          @keydown="${(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              this.selectChapter(index);
            }
          }}"
        >
          <div
            class="chapter-time"
            aria-label="Chapter time range ${this.formatTimecode(startTime)} - ${this.formatTimecode(endTime)}"
          >
            <span class="start-time">${this.formatTimecode(startTime)}</span>
            <span class="duration-time">${this.formatTimecode(endTime)}</span>

            <div class="chapter-actions">
              <sp-action-button
                class="share-button"
                quiet
                icon-only
                label="${this.sharedChapterIndex === index ? 'Chapter link copied' : 'Share chapter'}"
                @click="${(event) => this.shareChapter(index, event)}"
              >
                ${this.sharedChapterIndex === index ? html`
                  <svg
                    slot="icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#268e6c"
                    style="stroke: #268e6c;"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12l4 4L19 6" />
                  </svg>
                ` : html`
                  <svg
                    slot="icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#707070"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 10v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8" />
                    <path d="M12 13V3" />
                    <path d="M7.5 7.5L12 3l4.5 4.5" />
                  </svg>
                `}
              </sp-action-button>
            </div>
          </div>

          <div class="chapter-content">
            <h2 class="chapter-title">${chapter.title}</h2>
            <p class="chapter-description">${chapter.summary}</p>
            <div class="progress-track" aria-hidden="true">
              <div
                class="progress-fill"
                style="width: ${this.getChapterProgress(index)}%;"
              ></div>
            </div>
          </div>
        </article>
      `;
    });
  }

  render() {
    return html`
      <div
        class="asset-preview-block-container"
        daa-lh="Asset preview container | ${this.title}"
      >
        ${this.assetHasData && !this.isLoading ? html`
          <div class="asset-preview-block-header">
            <p>
              ${this.blockData.localizedText['{{Asset detail}}']}:
              ${unsafeHTML(this.title)}
              ${this.getFileTypeFromTag() ? `(${this.getFileTypeFromTag()})` : ''}
            </p>
          </div>

          <div class="asset-preview-block-details">
            <div class="asset-preview-block-details-left">
              ${this.createdDate ? html`
                <p>
                  <span class="asset-preview-block-details-left-label">
                    ${this.blockData.localizedText['{{Date}}']}:
                  </span>
                  ${this.createdDate}
                </p>
              ` : ''}

              ${this.getTagsTitlesString(this.audienceTags) ? html`
                <p>
                  <span class="asset-preview-block-details-left-label">
                    ${this.blockData.localizedText['{{Audience}}']}:
                  </span>
                  ${unsafeHTML(this.getTagsTitlesString(this.audienceTags))}
                </p>
              ` : ''}

              ${this.summary ? html`
                <p>
                  <span class="asset-preview-block-details-left-label">
                    ${this.blockData.localizedText['{{Summary}}']}:
                  </span>
                  ${unsafeHTML(this.summary)}
                </p>
              ` : ''}

              ${this.getTagsTitlesString(this.fileFormatTags) ? html`
                <p>
                  <span class="asset-preview-block-details-left-label">
                    ${this.blockData.localizedText['{{Type}}']}:
                  </span>
                  ${unsafeHTML(this.getTagsTitlesString(this.fileFormatTags))}
                </p>
              ` : ''}

              ${this.getTagsTitlesString(this.tags) ? html`
                <p>
                  <span class="asset-preview-block-details-left-label">
                    ${this.blockData.localizedText['{{Tags}}']}:
                  </span>
                  ${unsafeHTML(this.getTagsTitlesString(this.tags))}
                </p>
              ` : ''}

              ${this.size ? html`
                <p>
                  <span class="asset-preview-block-details-left-label">
                    ${this.blockData.localizedText['{{Size}}']}:
                  </span>
                  ${unsafeHTML(this.size)}
                </p>
              ` : ''}

              ${!this.isRestrictedAssetForUser() ? html`
                <div
                  class="asset-preview-block-actions"
                  daa-lh="Asset preview block actions"
                >
                  ${this.isPreviewEnabled(this.getFileTypeFromTag()) ? html`
                    <button class="outline">
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="${this.getDownloadUrl()}"
                        daa-ll="View"
                      >
                        View
                      </a>
                    </button>
                  ` : ''}

                  ${!this.isVideo ? html`
                    <button class="filled">
                      <a
                        download="${this.title}"
                        href="${this.getDownloadUrl()}"
                        daa-ll="${this.blockData.localizedText[`{{${this.getLabelBasedOnFileExtension(this.url)}}}`]}"
                      >
                        ${this.blockData.localizedText[`{{${this.getLabelBasedOnFileExtension(this.url)}}}`]}
                      </a>
                    </button>
                  ` : ''}

                  ${this.webinarPresentation ? html`
                    <button class="filled">
                      <a
                        download="${`${this.title}_presentation`}"
                        href="${this.getWebinarPresentationDownloadUrl()}"
                        daa-ll="${this.blockData.localizedText[`{{${this.getLabelBasedOnFileExtension(this.webinarPresentation)}}}`]}"
                      >
                        ${this.blockData.localizedText[`{{${this.getLabelBasedOnFileExtension(this.webinarPresentation)}}}`]}
                      </a>
                    </button>
                  ` : ''}

                  ${this.isVideo ? html`
                    <button
                      @click="${() => this.playVideo()}"
                      class="filled"
                      ?disabled="${this.isVideoLoading}"
                    >
                      <span>
                        ${this.blockData.localizedText['{{Watch Video}}']}
                      </span>
                    </button>
                  ` : ''}

                  ${this.backButtonUrl ? html`
                    <a
                      class="link"
                      href="${this.backButtonUrl}"
                      daa-ll="${this.blockData.localizedText[`{{${this.backButtonLabel}}}`]}"
                    >
                      ${this.blockData.localizedText[`{{${this.backButtonLabel}}}`]}
                    </a>
                  ` : ''}
                </div>
              ` : ''}
            </div>

            <div class="asset-preview-block-details-right">
              ${this.pdfPreviewUrl && !this.isRestrictedAssetForUser()
                ? html`
                  <div
                    id="${PDF_RENDER_DIV_ID}"
                    class="asset-preview-pdf-viewer"
                  ></div>
                `
                : html`
                  <img
                    src="${transformCardUrl(this.previewImage)}"
                    @error="${this._handleImgError}"
                    alt="${this.title || ''}"
                  />
                `}
            </div>
          </div>

          ${this.isVideo && !this.isRestrictedAssetForUser() ? html`
            <div class="asset-preview-block-video">
              <div class="video-container video-holder" tabindex="0"
                role="group" aria-label="Video player" @keydown="${this.handlePlayerKeydown}">
                ${this.isVideoLoading ? html`
                  <div class="video-loading-overlay">
                    <loading-spinner theme="dark"></loading-spinner>
                  </div>
                ` : ''}

                <video
                  preload="auto"
                  @play="${() => { this.isVideoPlaying = true; }}"
                  @pause="${() => { this.isVideoPlaying = false; }}"
                  @ended="${() => { this.isVideoPlaying = false; }}"
                  @timeupdate="${this.handleVideoTimeUpdate}"
                  @loadedmetadata="${this.handleVideoLoadedMetadata}"
                  @durationchange="${() => {
                    this.videoDuration = Number.isFinite(this._video.duration)
                      ? this._video.duration : 0;
                  }}"
                  @volumechange="${this.handleVolumeChange}"
                  @ratechange="${() => { this.playbackSpeed = this._video.playbackRate; }}"
                  @loadstart="${() => { this.isVideoLoading = true; }}"
                  @seeking="${() => { this.isVideoLoading = true; }}"
                  @waiting="${() => { this.isVideoLoading = true; }}"
                  @playing="${() => { this.isVideoLoading = false; }}"
                  @canplay="${() => { this.isVideoLoading = false; }}"
                  @error="${() => { this.isVideoLoading = false; }}"
                  playsinline
                  data-video-source="${this.getDownloadUrl()}"
                  oncontextmenu="return false;"
                  controlsList="nodownload"
                >
                  <source
                    src="${this.getDownloadUrl()}"
                    type="${this.fileType}"
                  />
                  <source
                    src="${this.getDownloadUrl()}"
                    type="video/mp4"
                  />
                  <track kind="chapters" label="Chapters" srclang="en" default
                    src="${this.createChaptersTrackUrl()}" />
                </video>
                ${this.renderVideoControls()}
              </div>

              ${chapters.length && this.chaptersVisible ? html`
              <div>
                <sp-theme system="express" scale="medium" color="light">
                  <section
                    class="video-chapters"
                    aria-label="Video chapters"
                  >
                    <header class="header">
                      <h1 class="header-title">In this video</h1>
                      <div class="chapter-count">
                        Chapters: ${chapters.length}
                      </div>
                    </header>

                    <div class="chapter-list">
                      ${this.renderChapters()}
                    </div>
                  </section>
                </sp-theme>
              </div>
              ` : ''}
            </div>
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
}
