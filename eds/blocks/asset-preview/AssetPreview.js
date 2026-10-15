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
    chapters: { type: Array },
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
    this.chapters = [];
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
    this.chaptersTrackUrl = null;
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

  get playerDuration() {
    if (Number.isFinite(this.videoDuration) && this.videoDuration > 0) {
      return this.videoDuration;
    }

    const lastChapter = this.chapters[this.chapters.length - 1];
    if (!lastChapter) return 0;

    const [, endTime] = lastChapter.timerange.split(' - ');
    const duration = this.timecodeToSeconds(endTime);
    return Number.isFinite(duration) && duration > 0 ? duration : 0;
  }

  playVideo() {
    const video = this._video;
    if (!video) return;

    const videoContainer = video.closest('.asset-preview-block-video');
    if (videoContainer) {
      window.scrollTo({ top: videoContainer.offsetTop, behavior: 'smooth' });
    }

    video.play().catch(() => {
      // Playback may require user interaction in some browsers.
    });
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

    if (this.chaptersTrackUrl) URL.revokeObjectURL(this.chaptersTrackUrl);
    this.chaptersTrackUrl = null;
    this.selectedChapterIndex = 0;
    this.currentTime = 0;
    this.videoDuration = 0;

    if (this.chapters.length) this.restoreChapterFromUrl();

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
    if (index < this.selectedChapterIndex) return 100;
    if (index !== this.selectedChapterIndex) return 0;

    const chapter = this.chapters[index];
    if (!chapter) return 0;

    const [startTime, endTime] = chapter.timerange.split(' - ');
    const start = this.timecodeToSeconds(startTime);
    const end = this.timecodeToSeconds(endTime);
    if (end <= start) return 0;

    const progress = ((this.currentTime - start) / (end - start)) * 100;
    return Math.max(0, Math.min(100, progress));
  }

  handleVideoTimeUpdate(event) {
    const video = event.currentTarget;
    this.currentTime = video.currentTime;
    this.videoDuration = Number.isFinite(video.duration) ? video.duration : 0;

    if (!this.chapters.length) return;

    const index = this.chapters.findIndex((chapter, chapterIndex) => {
      const next = this.chapters[chapterIndex + 1];
      const start = this.timecodeToSeconds(this.getStartTime(chapter.timerange));
      const nextStart = next
        ? this.timecodeToSeconds(this.getStartTime(next.timerange)) : Infinity;

      return video.currentTime >= start && video.currentTime < nextStart;
    });
    this.selectedChapterIndex = Math.max(0, index);

    if (video.paused || this.selectedChapterIndex >= this.chapters.length - 1) return;

    const [, endTime] = this.chapters[this.selectedChapterIndex].timerange.split(' - ');
    if (video.currentTime >= this.timecodeToSeconds(endTime)) {
      this.selectChapter(this.selectedChapterIndex + 1);
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
      String(this.timecodeToSeconds(this.getStartTime(this.chapters[index].timerange))),
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
    const timestampIndex = this.chapters.findIndex((chapter) => {
      const [start, end] = chapter.timerange.split(' - ').map((time) => this.timecodeToSeconds(time));
      return Number.isFinite(timestamp) && timestamp >= start && timestamp < end;
    });
    const index = Number.isInteger(chapterIndex) && this.chapters[chapterIndex]
      ? chapterIndex : timestampIndex;
    if (index < 0) return;

    this.selectedChapterIndex = index;
    const [start, end] = this.chapters[index].timerange.split(' - ').map((time) => this.timecodeToSeconds(time));
    this.currentTime = Number.isFinite(timestamp) && timestamp >= start && timestamp < end
      ? timestamp : start;
  }

  handleVideoLoadedMetadata(event) {
    const video = event.currentTarget;
    this.videoDuration = Number.isFinite(video.duration) ? video.duration : 0;
    video.currentTime = this.videoDuration > 0
      ? Math.min(this.currentTime, this.videoDuration) : this.currentTime;
    this.videoVolume = video.volume;
    this.videoMuted = video.muted;
    this.playbackSpeed = video.playbackRate;

    const track = video.querySelector('track[kind="chapters"]');
    if (track) track.track.mode = 'hidden';
  }

  createChaptersTrackUrl() {
    if (!this.chaptersTrackUrl) {
      const cues = this.chapters.map((chapter, index) => {
        const [start, end] = chapter.timerange.split(' - ').map((time) => (
          time.includes('.') ? time : `${time}.000`
        ));
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

  toggleVideoPlayback() {
    const video = this._video;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {
        // Playback may require user interaction in some browsers.
      });
    } else {
      video.pause();
    }
  }

  seekVideo(time) {
    const video = this._video;
    if (!video || video.readyState < 1 || !Number.isFinite(time)) return;

    const duration = this.playerDuration;
    if (duration <= 0) return;

    const target = Math.max(0, Math.min(duration, time));
    video.currentTime = target;
    this.currentTime = target;
  }

  handleProgressPointer(event) {
    const progress = event.currentTarget;

    if (event.type === 'pointerdown') {
      if (event.button !== 0) return;
      event.preventDefault();
      progress.focus();
      progress.setPointerCapture(event.pointerId);
    } else if (!progress.hasPointerCapture(event.pointerId)) {
      return;
    }

    const bounds = progress.getBoundingClientRect();
    if (bounds.width > 0) {
      const fraction = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      this.seekVideo(fraction * this.playerDuration);
    }

    if (event.type === 'pointerup') {
      progress.releasePointerCapture(event.pointerId);
    }
  }

  handleVolumeChange() {
    const video = this._video;
    if (!video) return;

    this.videoVolume = video.volume;
    this.videoMuted = video.muted;
  }

  setPlaybackSpeed(speed) {
    const video = this._video;
    if (!video || !Number.isFinite(speed) || speed <= 0) return;

    video.playbackRate = speed;
    this.playbackSpeed = speed;
    this.settingsMenuOpen = false;
  }

  async toggleVideoFullscreen() {
    const container = this._video?.closest('.video-container');
    if (!container) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if (this._video.webkitEnterFullscreen) {
        this._video.webkitEnterFullscreen();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to toggle fullscreen:', error);
    }
  }

  handlePlayerKeydown(event) {
    const target = event.target;
    if (target.closest('input, select, textarea, button, a, sp-action-button')
      || target.isContentEditable
      || event.altKey || event.ctrlKey || event.metaKey) return;

    const video = this._video;
    if (!video) return;

    switch (event.key) {
      case ' ':
      case 'k':
      case 'K':
        event.preventDefault();
        this.toggleVideoPlayback();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.seekVideo(this.currentTime - 10);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.seekVideo(this.currentTime + 10);
        break;
      case 'Home':
        event.preventDefault();
        this.seekVideo(0);
        break;
      case 'End':
        event.preventDefault();
        this.seekVideo(this.playerDuration);
        break;
      case 'ArrowUp':
        event.preventDefault();
        video.volume = Math.min(1, video.volume + 0.05);
        video.muted = false;
        this.handleVolumeChange();
        break;
      case 'ArrowDown':
        event.preventDefault();
        video.volume = Math.max(0, video.volume - 0.05);
        this.handleVolumeChange();
        break;
      case 'm':
      case 'M':
        event.preventDefault();
        video.muted = !video.muted;
        this.handleVolumeChange();
        break;
      case 'f':
      case 'F':
        event.preventDefault();
        this.toggleVideoFullscreen();
        break;
      case 'Escape':
        this.settingsMenuOpen = false;
        this.volumeExpanded = false;
        break;
      default:
        break;
    }
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
    const chapter = this.chapters[this.selectedChapterIndex];
    const nextIndex = this.chapters.length
      ? (this.selectedChapterIndex + 1) % this.chapters.length : -1;
    const nextChapter = this.chapters[nextIndex];
    const duration = this.playerDuration;
    const percent = duration > 0
      ? Math.max(0, Math.min(100, (this.currentTime / duration) * 100)) : 0;
    const speeds = [0.75, 1, 1.25, 1.5, 2];

    /* eslint-disable indent */
    return html`
      <div class="video-tint"></div>
      ${chapter ? html`
        <div class="player-chapter-pill">
          ${this.renderPlayerIcon('chapters')}
          <span>Chapter ${this.selectedChapterIndex + 1}</span>
          <strong>${chapter.title}</strong>
        </div>
      ` : ''}
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
          aria-valuemin="0" aria-valuemax="${duration}"
          aria-valuenow="${Math.min(this.currentTime, duration)}"
          aria-valuetext="${this.formatVideoTime(this.currentTime)} of ${
            this.formatVideoTime(duration)}"
          @pointerdown="${this.handleProgressPointer}" @pointermove="${this.handleProgressPointer}"
          @pointerup="${this.handleProgressPointer}">
          <div class="player-progress-track"></div>
          ${duration > 0 ? this.chapters.map((item) => {
            const [start, end] = item.timerange.split(' - ').map((time) => this.timecodeToSeconds(time));
            const left = Math.max(0, Math.min(100, (start / duration) * 100));
            const right = (Math.min(end, duration) / duration) * 100;
            const width = Math.max(0, right - left);
            return html`<div class="player-chapter-segment" title="${item.title}"
              style="left:${left}%;width:${width}%"></div>`;
          }) : ''}
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
                  const video = this._video;
                  if (!video) return;
                  video.muted = !video.muted;
                  this.volumeExpanded = true;
                  this.handleVolumeChange();
                }}">
                ${this.renderPlayerIcon(this.videoMuted || !this.videoVolume ? 'muted' : 'volume')}
              </button>
              <input type="range" min="0" max="1" step="0.01" aria-label="Volume"
                ?hidden="${!this.volumeExpanded}"
                .value="${String(this.videoMuted ? 0 : this.videoVolume)}"
                @input="${(event) => {
                  const video = this._video;
                  if (!video) return;
                  video.volume = Number(event.target.value);
                  video.muted = video.volume === 0;
                  this.handleVolumeChange();
                }}" />
            </div>
            <span class="player-time">${this.formatVideoTime(this.currentTime)} / ${this.formatVideoTime(duration)}</span>
          </div>
          ${nextChapter ? html`
            <button class="player-next-chapter" type="button"
              aria-label="Go to next chapter: ${nextChapter.title}"
              title="Go to next chapter: ${nextChapter.title}"
              @click="${() => this.selectChapter(nextIndex)}">
              ${this.renderPlayerIcon('next')}<span>${nextChapter.summary || nextChapter.title}</span>
            </button>
          ` : ''}
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
            ${this.chapters.length ? html`
              <button class="player-control-button" type="button" aria-label="Chapters" title="Chapters"
                aria-expanded="${this.chaptersVisible}" @click="${() => {
                  this.chaptersVisible = !this.chaptersVisible;
                  this.settingsMenuOpen = false;
                }}">${this.renderPlayerIcon('chapters')}</button>
            ` : ''}
            <button class="player-control-button" type="button" aria-label="Fullscreen" title="Fullscreen"
              @click="${this.toggleVideoFullscreen}">${this.renderPlayerIcon('fullscreen')}</button>
          </div>
        </div>
      </div>
    `;
    /* eslint-enable indent */
  }

  selectChapter(index) {
    const chapter = this.chapters[index];
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
    return this.chapters.map((chapter, index) => {
      const [startTime, endTime] = chapter.timerange.split(' - ');

      /* eslint-disable indent */
      return html`
        <article
          class="chapter ${this.selectedChapterIndex === index ? 'is-active' : ''}"
          id="chapter-${index + 1}"
          role="button"
          tabindex="0"
          @click="${() => this.selectChapter(index)}"
          @keydown="${(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              this.selectChapter(index);
            }
          }}"
        >
          <div class="chapter-time">
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
      /* eslint-enable indent */
    });
  }

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
                  @durationchange="${(event) => {
                    this.videoDuration = Number.isFinite(event.currentTarget.duration)
                      ? event.currentTarget.duration : 0;
                  }}"
                  @volumechange="${this.handleVolumeChange}"
                  @ratechange="${(event) => {
                    this.playbackSpeed = event.currentTarget.playbackRate;
                  }}"
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
                  ${this.chapters.length ? html`
                    <track kind="chapters" label="Chapters" srclang="en" default
                      src="${this.createChaptersTrackUrl()}" />
                  ` : ''}
                </video>
                ${this.renderVideoControls()}
              </div>

              ${this.chapters.length ? html`
              <div ?hidden="${!this.chaptersVisible}">
                <sp-theme system="express" scale="medium" color="light">
                  <section
                    class="video-chapters"
                    aria-label="Video chapters"
                  >
                    <header class="header">
                      <h1 class="header-title">In this video</h1>
                      <div class="chapter-count">
                        Chapters: ${this.chapters.length}
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
