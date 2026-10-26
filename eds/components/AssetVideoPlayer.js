/* eslint-disable no-underscore-dangle */
import { getLibs } from '../scripts/utils.js';

const miloLibs = getLibs();
const { html, LitElement } = await import(`${miloLibs}/deps/lit-all.min.js`);
const { loadStyle } = await import(`${miloLibs}/utils/utils.js`);
await Promise.all([
  import('./LoadingSpinner.js'),
  loadStyle('/eds/components/LoadingSpinner.css'),
  loadStyle('/eds/components/AssetVideoPlayer.css'),
]);

export default class AssetVideoPlayer extends LitElement {
  static properties = {
    src: { type: String },
    fileType: { type: String },
    chapters: { type: Array },
    isVideoPlaying: { state: true },
    isVideoLoading: { state: true },
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
    progressHover: { state: true },
  };

  constructor() {
    super();
    this.src = '';
    this.fileType = '';
    this.chapters = [];
    this.isVideoPlaying = false;
    this.isVideoLoading = false;
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
    this.progressHover = null;
    this.scrollToRestoredChapter = false;
  }

  createRenderRoot() {
    return this;
  }

  get _video() {
    return this.querySelector('video');
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('src') || changedProperties.has('chapters')) {
      clearTimeout(this.shareResetTimer);
      this.shareResetTimer = null;
      this.sharedChapterIndex = -1;
      this.releaseChaptersTrack();
      this.selectedChapterIndex = 0;
      this.currentTime = 0;
      this.progressHover = null;
      this.scrollToRestoredChapter = false;
      this.restoreChapterFromUrl();
      if (changedProperties.has('src')) {
        this.videoDuration = 0;
        this.isVideoPlaying = false;
        this.isVideoLoading = false;
        this.settingsMenuOpen = false;
        this.volumeExpanded = false;
      }
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('src')) this._video.load();
    if (changedProperties.has('chapters') && !changedProperties.has('src')
      && this._video.readyState >= 1) {
      this._video.currentTime = Math.min(this.currentTime, this.playerDuration);
    }
    if (this.scrollToRestoredChapter) {
      this.scrollToRestoredChapter = false;
      this.scrollSelectedChapterIntoView('start');
      this.querySelector('.video-container').scrollIntoView({ block: 'start' });
    } else if (changedProperties.has('selectedChapterIndex')
      || changedProperties.has('chaptersVisible')) {
      this.scrollSelectedChapterIntoView();
    }
    if (changedProperties.has('isVideoLoading')) {
      this.dispatchEvent(new CustomEvent('loading-change', {
        detail: { loading: this.isVideoLoading },
        bubbles: true,
        composed: true,
      }));
    }
  }

  releaseChaptersTrack() {
    if (this.chaptersTrackUrl) URL.revokeObjectURL(this.chaptersTrackUrl);
    this.chaptersTrackUrl = null;
  }

  scrollSelectedChapterIntoView(block = 'nearest') {
    const chapterList = this.querySelector('.chapter-list');
    const selectedChapter = chapterList?.querySelector('.chapter.is-active');
    if (!selectedChapter || !this.chaptersVisible) return;

    const chapterBounds = selectedChapter.getBoundingClientRect();
    const listTop = chapterList.getBoundingClientRect().top + chapterList.clientTop;
    const offset = chapterBounds.top - listTop;
    const overflow = chapterBounds.bottom - (listTop + chapterList.clientHeight);

    if (block === 'start' || offset < 0) {
      chapterList.scrollTop += offset;
    } else if (overflow > 0) {
      chapterList.scrollTop += Math.min(offset, overflow);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.shareResetTimer);
    this.releaseChaptersTrack();
  }

  connectedCallback() {
    super.connectedCallback();
    this.requestUpdate();
  }

  async play() {
    if (this._video) await this._video.play();
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
    this.scrollToRestoredChapter = true;
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
      this.play().catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to play video:', error);
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

  updateProgressTooltip(event) {
    if (event.pointerType === 'touch') {
      this.progressHover = null;
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const duration = this.playerDuration;

    if (bounds.width <= 0 || duration <= 0) {
      this.progressHover = null;
      return;
    }

    const fraction = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const time = fraction * duration;
    let chapter = this.chapters[0];

    this.chapters.forEach((item) => {
      const start = this.timecodeToSeconds(this.getStartTime(item.timerange));
      if (start <= time) chapter = item;
    });

    const width = Math.min(220, bounds.width);
    const halfWidth = width / 2;
    const left = Math.max(
      halfWidth,
      Math.min(bounds.width - halfWidth, fraction * bounds.width),
    );

    this.progressHover = {
      time,
      title: chapter?.title || '',
      left,
      width,
    };
  }

  handleProgressPointer(event) {
    this.updateProgressTooltip(event);
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

      if (event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom) {
        this.progressHover = null;
      }
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

  // eslint-disable-next-line class-methods-use-this
  renderPlayerIcon(name) {
    const icons = ['play', 'pause', 'volume', 'muted', 'next', 'chapters', 'fullscreen', 'back', 'forward'];
    if (!icons.includes(name)) return '';
    const isSkip = name === 'back' || name === 'forward';

    return html`
      <svg class="${isSkip ? 'skip-svg' : ''}" viewBox="${isSkip ? '0 0 24 24' : '0 0 20 20'}"
        width="${isSkip ? 20 : 24}" height="${isSkip ? 20 : 24}" aria-hidden="true" focusable="false"
        style="fill: currentColor; stroke: none;">
        <use href="/eds/img/icons/player-${name}.svg#icon"></use>
      </svg>
    `;
  }

  renderVideoControls() {
    if (!this.chapters.length) return '';

    const nextIndex = this.selectedChapterIndex + 1;
    const nextChapter = this.chapters[nextIndex];
    const duration = this.playerDuration;
    const percent = duration > 0
      ? Math.max(0, Math.min(100, (this.currentTime / duration) * 100)) : 0;
    const speeds = [0.75, 1, 1.25, 1.5, 2];

    /* eslint-disable indent */
    return html`
      <div class="video-tint"></div>
      <button class="player-center-play" type="button"
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
          style="position: relative; overflow: visible;"
          aria-valuemin="0" aria-valuemax="${duration}"
          aria-valuenow="${Math.min(this.currentTime, duration)}"
          aria-valuetext="${this.formatVideoTime(this.currentTime)} of ${
            this.formatVideoTime(duration)}"
          @pointerenter="${this.updateProgressTooltip}"
          @pointerleave="${() => { this.progressHover = null; }}"
          @pointercancel="${() => { this.progressHover = null; }}"
          @pointerdown="${this.handleProgressPointer}"
          @pointermove="${this.handleProgressPointer}"
          @pointerup="${this.handleProgressPointer}">
          ${duration > 0 && this.chapters.length ? this.chapters.map((item, index) => {
            const followingChapter = this.chapters[index + 1];
            const start = index === 0
              ? 0
              : Math.max(0, Math.min(
                duration,
                this.timecodeToSeconds(this.getStartTime(item.timerange)),
              ));
            const end = followingChapter
              ? Math.max(start, Math.min(
                duration,
                this.timecodeToSeconds(this.getStartTime(followingChapter.timerange)),
              ))
              : duration;
            const left = (start / duration) * 100;
            const width = Math.max(0, ((end - start) / duration) * 100);
            const gap = followingChapter ? 3 : 0;
            const played = end > start
              ? Math.max(0, Math.min(
                100,
                ((this.currentTime - start) / (end - start)) * 100,
              ))
              : 0;

            return html`
              <div class="player-chapter-segment"
                style="
                  position: absolute;
                  left: ${left}%;
                  width: max(0px, calc(${width}% - ${gap}px));
                  border-radius: 2px;
                  overflow: hidden;
                  padding: 0;
                  background: linear-gradient(
                    to right,
                    #1473e6 0%,
                    #1473e6 ${played}%,
                    rgba(255, 255, 255, 0.35) ${played}%,
                    rgba(255, 255, 255, 0.35) 100%
                  );
                ">
              </div>
            `;
          }) : html`
            <div class="player-progress-track"></div>
            <div class="player-progress-played" style="width:${percent}%"></div>
          `}
          <div class="player-progress-thumb" style="left:${percent}%"></div>
          ${this.progressHover ? html`
            <div class="player-progress-tooltip" role="tooltip"
              style="
                position: absolute;
                bottom: calc(100% + 10px);
                left: ${this.progressHover.left}px;
                width: ${this.progressHover.width}px;
                transform: translateX(-50%);
                box-sizing: border-box;
                padding: 8px 10px;
                border-radius: 4px;
                background: rgba(0, 0, 0, 0.9);
                color: #fff;
                text-align: center;
                font-size: 12px;
                line-height: 1.4;
                white-space: normal;
                overflow-wrap: anywhere;
                pointer-events: none;
                z-index: 10;
              ">
              <div class="player-progress-tooltip-time"
                style="font-weight: 700; font-variant-numeric: tabular-nums;">
                ${this.formatVideoTime(this.progressHover.time)}
              </div>
              ${this.progressHover.title ? html`
                <div class="player-progress-tooltip-chapter">
                  ${this.progressHover.title}
                </div>
              ` : ''}
            </div>
          ` : ''}
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
              aria-label="Up next: ${nextChapter.title}"
              title="Up next: ${nextChapter.title}"
              @click="${() => this.selectChapter(nextIndex)}">
              ${this.renderPlayerIcon('next')}<span>${nextChapter.title}</span>
            </button>
          ` : ''}
          <div class="player-controls-right">
            ${this.chapters.length ? html`
              <button class="player-control-button" type="button"
                aria-expanded="${this.chaptersVisible}" @click="${() => {
                  this.chaptersVisible = !this.chaptersVisible;
                  this.settingsMenuOpen = false;
                }}">${this.renderPlayerIcon('chapters')}</button>
            ` : ''}
            <button class="player-control-button" type="button"
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

    this.play().catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Failed to play video:', error);
    });
  }

  renderChapters() {
    return this.chapters.map((chapter, index) => {
      const [startTime, endTime] = chapter.timerange.split(' - ');
      const shareLabel = this.sharedChapterIndex === index ? 'Link copied' : 'Copy link to this chapter';

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
                label="${shareLabel}"
                aria-describedby="chapter-share-tooltip-${index + 1}"
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
                    <use href="/eds/img/icons/player-check.svg#icon"></use>
                  </svg>
                ` : html`
                  <svg
                    class="copy-icon"
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
                    <use href="/eds/img/icons/player-share.svg#icon"></use>
                  </svg>
                `}
              </sp-action-button>
              <span class="chapter-share-tooltip" id="chapter-share-tooltip-${index + 1}" role="tooltip">
                ${shareLabel}
              </span>
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
    /* eslint-disable indent */
    return html`
      <div class="video-player-layout ${this.chapters.length && this.chaptersVisible ? 'chapters-open' : 'chapters-collapsed'}">
        <div class="video-container video-holder" tabindex="0"
          role="group" aria-label="Video player">
          ${this.isVideoLoading ? html`
            <div class="video-loading-overlay">
              <loading-spinner theme="dark"></loading-spinner>
            </div>
          ` : ''}

          <video
            preload="auto"
            ?controls="${!this.chapters.length}"
            @click="${(event) => {
              const video = event.currentTarget;
              if (this.chapters.length && !video.paused) video.pause();
            }}"
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
            data-video-source="${this.src}"
            oncontextmenu="return false;"
            controlsList="nodownload"
          >
            <source
              src="${this.src}"
              type="${this.fileType}"
            />
            <source
              src="${this.src}"
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
    `;
    /* eslint-enable indent */
  }
}

if (!customElements.get('asset-video-player')) {
  customElements.define('asset-video-player', AssetVideoPlayer);
}
