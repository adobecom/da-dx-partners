/* eslint-disable no-underscore-dangle */
import { getLibs } from '../scripts/utils.js';

const miloLibs = getLibs();
const { html, svg, LitElement } = await import(`${miloLibs}/deps/lit-all.min.js`);
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

  handlePlayerKeydown(event) {
    if (!this.chapters.length) return;

    const { target } = event;
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
        this.progressHover = null;
        break;
      default:
        break;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  renderPlayerIcon(name) {
    const paths = {
      play: [
        'M4.74902,18.00391c-.39795,0-.79541-.10742-1.15332-.32129-.68604-.41016-1.0957-1.13281-1.0957-1.93164V4.24902c0-.79883.40967-1.52148,1.0957-1.93164.68555-.40918,1.51514-.42969,2.21924-.0498l10.70117,5.75098c.73047.39258,1.18408,1.15234,1.18408,1.98145s-.45361,1.58887-1.18408,1.98145l-10.70117,5.75098c-.33643.18164-.70166.27148-1.06592.27148ZM4.75244,3.49609c-.17822,0-.31836.06836-.38721.10938-.10986.06543-.36523.25977-.36523.64355v11.50195c0,.38379.25537.57812.36523.64355s.40137.19824.73975.01758l10.70068-5.75098c.35596-.19238.39453-.52637.39453-.66113s-.03857-.46875-.39453-.66113L5.10498,3.58789c-.12646-.06738-.24609-.0918-.35254-.0918Z',
      ],
      pause: [
        'm6.75,18h-2.5c-1.24072,0-2.25-1.00977-2.25-2.25V4.25c0-1.24023,1.00928-2.25,2.25-2.25h2.5c1.24072,0,2.25,1.00977,2.25,2.25v11.5c0,1.24023-1.00928,2.25-2.25,2.25ZM4.25,3.5c-.41357,0-.75.33691-.75.75v11.5c0,.41309.33643.75.75.75h2.5c.41357,0,.75-.33691.75-.75V4.25c0-.41309-.33643-.75-.75-.75h-2.5Z',
        'm15.75,18h-2.5c-1.24072,0-2.25-1.00977-2.25-2.25V4.25c0-1.24023,1.00928-2.25,2.25-2.25h2.5c1.24072,0,2.25,1.00977,2.25,2.25v11.5c0,1.24023-1.00928,2.25-2.25,2.25Zm-2.5-14.5c-.41357,0-.75.33691-.75.75v11.5c0,.41309.33643.75.75.75h2.5c.41357,0,.75-.33691.75-.75V4.25c0-.41309-.33643-.75-.75-.75h-2.5Z',
      ],
      volume: [
        'm13.00098,12.74707c-.24219,0-.48047-.11719-.625-.33398-.22949-.34473-.13672-.80957.20801-1.04004.41113-.27441.66602-.80176.66602-1.37598s-.25488-1.10156-.66602-1.37598c-.34473-.23047-.4375-.69531-.20801-1.04004s.69434-.43652,1.04004-.20801c.83496.55762,1.33398,1.53809,1.33398,2.62402s-.49902,2.06641-1.33398,2.62402c-.12793.08496-.27246.12598-.41504.12598Z',
        'm16.25098,14.24707c-.24219,0-.48047-.11719-.625-.33301-.22949-.34473-.13672-.81055.20703-1.04102.87402-.58301,1.41699-1.68555,1.41699-2.87598,0-1.19141-.54297-2.29297-1.41602-2.87598-.34473-.22949-.4375-.69531-.20801-1.04004s.69531-.4375,1.04004-.20801c1.28516.85742,2.08398,2.4375,2.08398,4.12402,0,1.68555-.79785,3.26562-2.08301,4.12402-.12793.08496-.27344.12598-.41602.12598Z',
        'm9.24805,18.33691c-.4541,0-.89941-.17773-1.23535-.51367l-2.60352-2.60352c-.13965-.13965-.33301-.21973-.53027-.21973h-1.62891c-1.24023,0-2.25-1.00977-2.25-2.25v-5.5c0-1.24023,1.00977-2.25,2.25-2.25h1.62891c.19727,0,.39062-.08008.53027-.21973l2.60352-2.60352c.50195-.50293,1.25195-.65234,1.90723-.37891.65625.27148,1.08008.90625,1.08008,1.61621v13.17188c0,.70996-.42383,1.34473-1.08008,1.61621-.21777.09082-.44629.13477-.67188.13477ZM3.25,6.5c-.41309,0-.75.33691-.75.75v5.5c0,.41309.33691.75.75.75h1.62891c.5918,0,1.17188.24023,1.59082.65918l2.60352,2.60352c.10254.10156.21484.0791.27246.05371.05762-.02344.1543-.08496.1543-.23047V3.41406c0-.14551-.09668-.20703-.1543-.23047-.05762-.02539-.16992-.04785-.27246.05371l-2.60352,2.60352c-.41895.41895-.99902.65918-1.59082.65918h-1.62891Z',
      ],
      muted: [
        'm18.78027,17.73926L2.28027,1.23926c-.29297-.29297-.76758-.29297-1.06055,0s-.29297.76758,0,1.06055l2.72168,2.72168h-.69141c-1.24023,0-2.25,1.00977-2.25,2.25v5.5c0,1.24023,1.00977,2.25,2.25,2.25h1.62891c.19824,0,.3916.08008.53027.21875l2.60352,2.60449c.33594.33594.78125.51367,1.23535.51367.22559,0,.45312-.04395.6709-.13477.65723-.27148,1.08105-.90625,1.08105-1.61719v-4.52637l6.71973,6.71973c.14648.14648.33789.21973.53027.21973s.38379-.07324.53027-.21973c.29297-.29297.29297-.76758,0-1.06055Zm-9.28027-1.13281c0,.14551-.09668.20801-.1543.23145-.05859.02441-.1709.04688-.27246-.05371l-2.60352-2.60449c-.4248-.4248-.98926-.6582-1.59082-.6582h-1.62891c-.41309,0-.75-.33691-.75-.75v-5.5c0-.41309.33691-.75.75-.75h2.19141l4.05859,4.05859v6.02637Z',
        'm8.25879,4.07324l.81445-.81445c.10449-.10254.21582-.07617.27246-.05469.07031.0293.1543.09277.1543.23145v2.59082c0,.41406.33594.75.75.75s.75-.33594.75-.75v-2.59082c0-.70996-.42383-1.34473-1.08008-1.61719-.65723-.27051-1.4043-.12207-1.90723.37988l-.81445.81445c-.29297.29297-.29297.76758,0,1.06055s.76758.29297,1.06055,0Z',
        'm13.22266,9.8252c.04004.38574.36523.67285.74512.67285.02539,0,.05176-.00098.07812-.00391.41211-.04297.71191-.41113.66895-.82324-.09961-.96289-.57324-1.79395-1.29883-2.27734-.34473-.22852-.81055-.13574-1.04004.20801-.22949.34473-.13672.81055.20801,1.04004.34766.23145.58594.67383.63867,1.18359Z',
        'm17.25,10.01758c0,.86621-.28418,1.68652-.80078,2.30957-.26367.31934-.21875.79199.09961,1.05664.14062.11523.30957.17188.47852.17188.21484,0,.42969-.09277.57812-.27148.73828-.89258,1.14453-2.05273,1.14453-3.2666,0-1.68555-.79785-3.26562-2.08301-4.12402-.34766-.22949-.81152-.13672-1.04102.20703-.22949.34473-.13672.81055.20703,1.04102.87402.58301,1.41699,1.68555,1.41699,2.87598Z',
      ],
      next: [
        'm10.25098,15.95508c-.38281,0-.76562-.10059-1.11572-.2998-.71094-.40625-1.13525-1.13574-1.13525-1.9541v-7.40234c0-.81836.42432-1.54785,1.13525-1.9541.71143-.40332,1.55615-.39746,2.26025.01758l6.25439,3.70117c.69189.40918,1.10449,1.13281,1.10449,1.93652s-.4126,1.52734-1.10449,1.93652l-6.25439,3.70117c-.35742.21094-.75098.31738-1.14453.31738Zm.00391-10.40918c-.17139,0-.30811.0625-.37646.10156-.11377.06543-.37842.25879-.37842.65137v7.40234c0,.39258.26465.58594.37842.65137.11377.06445.41406.19141.75342-.00586l6.25439-3.70117c.33252-.19629.36816-.5166.36816-.64551s-.03564-.44922-.36816-.64551l-6.25439-3.70117c-.13477-.08008-.26367-.10742-.37695-.10742Z',
        'm3.75,16h-.5c-1.24072,0-2.25-1.00977-2.25-2.25v-7.5c0-1.24023,1.00928-2.25,2.25-2.25h.5c1.24072,0,2.25,1.00977,2.25,2.25v7.5c0,1.24023-1.00928,2.25-2.25,2.25Zm-.5-10.5c-.41357,0-.75.33691-.75.75v7.5c0,.41309.33643.75.75.75h.5c.41357,0,.75-.33691.75-.75v-7.5c0-.41309-.33643-.75-.75-.75h-.5Z',
      ],
      chapters: [
        'm17.25,16.52148H7.25c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h10c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z',
        'm17.25,10.52148H7.25c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h10c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z',
        'm17.25,4.52148H7.25c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h10c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z',
        'm3.10986,5.51953v-2.625h-.02344l-.44824.31055c-.10547.07324-.17285.09668-.29004.09668-.23145,0-.41016-.17285-.41016-.41895,0-.17285.07031-.31348.23438-.4248l.76758-.5127c.24609-.16406.45996-.1875.7002-.1875.44824,0,.71191.26953.71191.69434v3.06738c0,.37207-.24902.6123-.62109.6123s-.62109-.24023-.62109-.6123Z',
        'm1.70508,11.52246c0-.22852.10547-.4043.33984-.60059l1.16309-.99609c.47461-.40723.60938-.5918.60938-.84375,0-.2666-.20508-.45117-.50684-.45117-.22266,0-.375.10254-.5332.33105-.16406.24023-.31348.32812-.55078.32812-.31641,0-.50977-.18457-.50977-.4834,0-.09668.01758-.1875.05566-.27539.22266-.50391.81738-.81738,1.55566-.81738,1.02832,0,1.68457.51855,1.68457,1.28613,0,.56836-.29297.86426-.94922,1.43262l-.77051.66504v.02344h1.3418c.31055,0,.48633.18457.48633.46875,0,.27832-.17578.46875-.48633.46875h-2.34961c-.4043,0-.58008-.22559-.58008-.53613Z',
        'm1.67871,17.30566c-.02637-.07324-.03809-.15527-.03809-.21973,0-.30762.20508-.49805.53906-.49805.23145,0,.38379.07617.50684.25488.1582.23145.31348.36914.68262.36914.31055,0,.5332-.1875.5332-.44824,0-.30176-.23145-.46289-.66211-.46289h-.0293c-.29004,0-.43652-.16113-.43652-.41016,0-.2373.14648-.40723.43652-.40723h.0293c.38379,0,.60645-.16699.60645-.43945,0-.26074-.19336-.4248-.50684-.4248-.25195,0-.43066.10254-.55078.31348-.14062.24902-.29297.33984-.5625.33984-.33984,0-.50684-.19922-.50684-.47461,0-.08203.01172-.14648.04102-.22852.14941-.40723.66504-.85547,1.57324-.85547.94043,0,1.65527.39844,1.65527,1.15137,0,.54785-.40137.8877-.86719.98145v.02344c.64453.06738,1.04297.42188,1.04297.98438,0,.80859-.69434,1.32129-1.8252,1.32129-.98438,0-1.51758-.46875-1.66113-.87012Z',
      ],
      fullscreen: [
        'M12.75,14.93652h-5.5c-1.24072,0-2.25-1.00928-2.25-2.25v-5.5c0-1.24072,1.00928-2.25,2.25-2.25h5.5c1.24072,0,2.25,1.00928,2.25,2.25v5.5c0,1.24072-1.00928,2.25-2.25,2.25ZM7.25,6.43652c-.41357,0-.75.33643-.75.75v5.5c0,.41357.33643.75.75.75h5.5c.41357,0,.75-.33643.75-.75v-5.5c0-.41357-.33643-.75-.75-.75h-5.5Z',
        'M4.5,19h-2.25c-.68945,0-1.25-.56055-1.25-1.25v-2.25c0-.41406.33594-.75.75-.75s.75.33594.75.75v2h2c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z',
        'M17.75,19h-2.25c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h2v-2c0-.41406.33594-.75.75-.75s.75.33594.75.75v2.25c0,.68945-.56055,1.25-1.25,1.25Z',
        'M18.25,5.25c-.41406,0-.75-.33594-.75-.75v-2h-2c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h2.25c.68945,0,1.25.56055,1.25,1.25v2.25c0,.41406-.33594.75-.75.75ZM17.75,2.5h.00977-.00977Z',
        'M1.75,5.25c-.41406,0-.75-.33594-.75-.75v-2.25c0-.68945.56055-1.25,1.25-1.25h2.25c.41406,0,.75.33594.75.75s-.33594.75-.75.75h-2v2c0,.41406-.33594.75-.75.75Z',
      ],
    };

    if (name === 'back' || name === 'forward') {
      return html`
        <svg class="skip-svg" viewBox="0 0 24 24"
          width="20" height="20" aria-hidden="true" focusable="false"
          style="fill: currentColor; stroke: none;">
          <g transform="${name === 'forward' ? 'translate(24,0) scale(-1,1)' : ''}">
            <path style="fill: currentColor; stroke: none;"
              d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </g>
          <text x="12" y="16" font-size="8.5" font-weight="700"
            text-anchor="middle" style="fill: currentColor; stroke: none;">10</text>
        </svg>
      `;
    }

    if (!Object.hasOwn(paths, name)) return '';

    return html`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
        width="24" height="24" aria-hidden="true" focusable="false"
        style="fill: currentColor; stroke: none;">
        ${paths[name].map((path) => svg`
          <path d="${path}" style="fill: currentColor; stroke: none;" />
        `)}
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
                    <path d="M5 12l4 4L19 6" />
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
                    <path d="M3 10v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8" />
                    <path d="M12 13V3" />
                    <path d="M7.5 7.5L12 3l4.5 4.5" />
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
          role="group" aria-label="Video player" @keydown="${this.handlePlayerKeydown}">
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

if (!customElements.get('video-player')) {
  customElements.define('video-player', AssetVideoPlayer);
}
