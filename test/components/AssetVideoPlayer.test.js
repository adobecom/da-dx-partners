import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../eds/scripts/utils.js';

const miloLibs = setLibs('/libs');
const { default: AssetVideoPlayer } = await import('../../eds/components/AssetVideoPlayer.js');
const { render } = await import(`${miloLibs}/deps/lit-all.min.js`);

afterEach(() => {
  document.body.replaceChildren();
  sinon.restore();
});

function makeInstance() {
  const el = new AssetVideoPlayer();
  el.chapters = [
    {
      title: 'Welcome And Speaker Introductions',
      summary: 'Welcome and introductions.',
      timerange: '00:00:01.001 - 00:01:31.625',
    },
    {
      title: 'Agenda And Session Goals',
      summary: 'Session agenda and goals.',
      timerange: '00:01:31.625 - 00:02:22.906',
    },
    {
      title: 'Why Partners Should Be Excited',
      summary: 'Partner opportunities.',
      timerange: '00:02:22.906 - 00:05:22.223',
    },
    {
      title: 'Market Headwinds And Loyalty Importance',
      summary: 'Market trends.',
      timerange: '00:05:22.959 - 00:07:12.258',
    },
  ];
  el.restoreChapterFromUrl();
  return el;
}

describe('AssetVideoPlayer - shareChapter()', () => {
  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('styles the chapter tooltip for hover, copy and keyboard focus', async () => {
    sinon.stub(navigator.clipboard, 'writeText').resolves();
    const el = makeInstance();
    const styles = document.createElement('style');
    const css = await readFile({ path: '../../eds/components/AssetVideoPlayer.css' });
    // Model pointer and keyboard states without native mouse commands across concurrent test tabs.
    styles.textContent = css.replaceAll(':hover', '[data-test-hover]')
      .replaceAll(':focus-visible', '[data-test-focus-visible]');
    document.body.append(styles, el);
    await el.updateComplete;
    const button = el.querySelector('.share-button');
    const tooltip = el.querySelector('.chapter-share-tooltip');
    const icon = button.querySelector('svg');
    button.setAttribute('tabindex', '0');

    expect(button.getAttribute('label')).to.equal('Copy link to this chapter');
    expect(button.getAttribute('aria-describedby')).to.equal(tooltip.id);
    expect(tooltip.textContent.trim()).to.equal('Copy link to this chapter');
    expect(getComputedStyle(tooltip).visibility).to.equal('hidden');
    expect(getComputedStyle(icon).stroke).to.equal('rgb(112, 112, 112)');

    const { x, y, width, height } = icon.getBoundingClientRect();
    button.setAttribute('data-test-hover', '');

    expect(getComputedStyle(icon).stroke).to.equal('rgb(20, 115, 230)');
    expect(getComputedStyle(tooltip).visibility).to.equal('visible');
    const tooltipBounds = tooltip.getBoundingClientRect();
    expect(tooltipBounds.top).to.be.greaterThan(y + height);
    expect(tooltipBounds.left).to.be.at.least(x + width / 2);

    button.focus();
    button.click();
    await Promise.resolve();
    await el.updateComplete;
    expect(document.activeElement).to.equal(button);
    expect(tooltip.textContent.trim()).to.equal('Link copied');
    expect(getComputedStyle(tooltip).visibility).to.equal('visible');

    button.blur();
    button.removeAttribute('data-test-hover');
    expect(getComputedStyle(tooltip).visibility).to.equal('hidden');
    button.setAttribute('data-test-focus-visible', '');
    expect(getComputedStyle(tooltip).visibility).to.equal('visible');
    button.removeAttribute('data-test-focus-visible');
    expect(getComputedStyle(tooltip).visibility).to.equal('hidden');
    clearTimeout(el.shareResetTimer);
  });

  it('replaces the clicked share icon with a green check for two seconds', async () => {
    const clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const writeText = sinon.stub(navigator.clipboard, 'writeText').resolves();
    const el = makeInstance();
    const container = document.createElement('div');
    const iconStyles = document.createElement('style');
    iconStyles.textContent = '.share-button svg { stroke: #707070; }';
    document.body.append(iconStyles, container);
    render(el.renderChapters(), container);
    const button = container.querySelector('.share-button');
    const shareHref = '/eds/img/icons/player-share.svg#icon';
    expect(button.querySelector('use').getAttribute('href')).to.equal(shareHref);
    expect(button.querySelector('svg').getAttribute('slot')).to.equal('icon');
    expect(button.querySelector('use').namespaceURI).to.equal('http://www.w3.org/2000/svg');

    button.click();
    await Promise.resolve();
    render(el.renderChapters(), container);

    expect(writeText.calledOnceWithExactly(el.createChapterUrl(0))).to.be.true;
    expect(button.getAttribute('label')).to.equal('Link copied');
    expect(container.querySelector('[role="tooltip"]').textContent.trim()).to.equal('Link copied');
    expect(container.querySelectorAll('[role="tooltip"]')[1].textContent.trim()).to.equal('Copy link to this chapter');
    expect(button.querySelector('svg').getAttribute('stroke')).to.equal('#268e6c');
    expect(getComputedStyle(button.querySelector('svg')).stroke).to.equal('rgb(38, 142, 108)');
    expect(button.querySelector('use').getAttribute('href')).to.equal('/eds/img/icons/player-check.svg#icon');
    expect(button.querySelector('svg').getAttribute('slot')).to.equal('icon');
    expect(button.querySelector('use').namespaceURI).to.equal('http://www.w3.org/2000/svg');
    expect(container.querySelectorAll('.share-button')[1].querySelector('svg').getAttribute('stroke')).to.equal('#707070');
    expect(container.querySelectorAll('.share-button')[1].querySelector('use').getAttribute('href')).to.equal(shareHref);

    clock.tick(1999);
    expect(el.sharedChapterIndex).to.equal(0);
    clock.tick(1);
    render(el.renderChapters(), container);

    expect(button.getAttribute('label')).to.equal('Copy link to this chapter');
    expect(container.querySelector('[role="tooltip"]').textContent.trim()).to.equal('Copy link to this chapter');
    expect(button.querySelector('svg').getAttribute('stroke')).to.equal('#707070');
    expect(getComputedStyle(button.querySelector('svg')).stroke).to.equal('rgb(112, 112, 112)');
    expect(button.querySelector('use').getAttribute('href')).to.equal(shareHref);
  });

  it('stops propagation and leaves the selected chapter unchanged when sharing', async () => {
    const el = makeInstance();
    const writeText = sinon.stub(navigator.clipboard, 'writeText').resolves();
    const markShared = sinon.stub(el, 'markChapterShared');
    const stopPropagation = sinon.spy();

    await el.shareChapter(2, { stopPropagation });

    expect(stopPropagation.calledOnce).to.be.true;
    expect(writeText.calledOnceWithExactly(el.createChapterUrl(2))).to.be.true;
    expect(markShared.calledOnceWithExactly(2)).to.be.true;
    expect(el.selectedChapterIndex).to.equal(0);
  });

  it('logs clipboard failures without showing a copied state', async () => {
    const el = makeInstance();
    const error = new Error('Clipboard permission denied');
    sinon.stub(navigator.clipboard, 'writeText').rejects(error);
    const logError = sinon.stub(console, 'error');
    const markShared = sinon.stub(el, 'markChapterShared');

    await el.shareChapter(2, { stopPropagation: sinon.spy() });

    expect(logError.calledOnceWithExactly('Failed to copy chapter URL:', error)).to.be.true;
    expect(markShared.called).to.be.false;
    expect(el.sharedChapterIndex).to.equal(-1);
    expect(el.shareResetTimer).to.equal(null);
  });
});

describe('AssetVideoPlayer - external icons', () => {
  const names = ['play', 'pause', 'volume', 'muted', 'next', 'chapters', 'fullscreen', 'back', 'forward'];

  names.forEach((name) => {
    it(`renders the external ${name} icon with the original viewport`, () => {
      const container = document.createElement('div');
      render(makeInstance().renderPlayerIcon(name), container);
      const icon = container.querySelector('svg');
      const isSkip = name === 'back' || name === 'forward';

      expect(icon.getAttribute('viewBox')).to.equal(isSkip ? '0 0 24 24' : '0 0 20 20');
      expect(icon.getAttribute('aria-hidden')).to.equal('true');
      expect(icon.getAttribute('focusable')).to.equal('false');
      expect(icon.style.fill).to.equal('currentcolor');
      expect(icon.querySelector('use').getAttribute('href')).to.equal(`/eds/img/icons/player-${name}.svg#icon`);
      expect(icon.querySelector('use').namespaceURI).to.equal('http://www.w3.org/2000/svg');
      expect(icon.querySelector('path')).to.equal(null);
    });
  });

  [...names, 'share', 'check'].forEach((name) => {
    it(`loads the ${name} SVG asset and its referenced artwork`, async () => {
      const response = await fetch(`/eds/img/icons/player-${name}.svg`);
      expect(response.ok).to.be.true;
      const document = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');

      expect(document.querySelector('parsererror')).to.equal(null);
      expect(document.documentElement.namespaceURI).to.equal('http://www.w3.org/2000/svg');
      expect(document.querySelector('#icon path')).not.to.equal(null);
    });
  });

  it('does not render unsupported icons', () => {
    expect(makeInstance().renderPlayerIcon('unknown')).to.equal('');
  });
});

describe('AssetVideoPlayer - chapter time helpers', () => {
  it('converts hours, minutes and fractional seconds to seconds', () => {
    expect(makeInstance().timecodeToSeconds('01:02:03.456')).to.be.closeTo(3723.456, 0.001);
  });

  it('extracts the unchanged start time from a chapter range', () => {
    expect(makeInstance().getStartTime('00:01:31.625 - 00:02:22.906')).to.equal('00:01:31.625');
  });

  it('formats timecodes with zero padding and discards fractional seconds', () => {
    const el = makeInstance();
    expect(el.formatTimecode('00:00:01.999')).to.equal('00:01');
    expect(el.formatTimecode('00:05:09.123')).to.equal('05:09');
    expect(el.formatTimecode('01:02:03.456')).to.equal('62:03');
  });
});

describe('AssetVideoPlayer - markChapterShared() and disconnectedCallback()', () => {
  afterEach(() => sinon.restore());

  it('restarts the copied-state timer when another chapter is shared', () => {
    const clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const el = makeInstance();
    el.markChapterShared(0);
    clock.tick(1000);
    el.markChapterShared(2);

    clock.tick(1000);
    expect(el.sharedChapterIndex).to.equal(2);
    clock.tick(999);
    expect(el.sharedChapterIndex).to.equal(2);
    clock.tick(1);
    expect(el.sharedChapterIndex).to.equal(-1);
    expect(el.shareResetTimer).to.equal(null);
  });

  it('cancels the pending copied-state timer when disconnected', () => {
    const clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const el = makeInstance();
    el.markChapterShared(2);

    el.disconnectedCallback();
    clock.tick(2000);

    expect(el.sharedChapterIndex).to.equal(2);
    expect(clock.countTimers()).to.equal(0);
  });
});

describe('AssetVideoPlayer - handleVideoTimeUpdate()', () => {
  afterEach(() => sinon.restore());

  it('updates playback time without advancing before the chapter ends', () => {
    const el = makeInstance();
    const selectChapter = sinon.stub(el, 'selectChapter');

    el.handleVideoTimeUpdate({ currentTarget: { currentTime: 91.624, paused: false } });

    expect(el.currentTime).to.equal(91.624);
    expect(selectChapter.called).to.be.false;
  });

  it('advances to the next chapter at or after the end time', () => {
    const el = makeInstance();
    const selectChapter = sinon.stub(el, 'selectChapter');

    [322.223, 322.5].forEach((currentTime) => {
      el.handleVideoTimeUpdate({ currentTarget: { currentTime, paused: false } });
    });

    expect(selectChapter.calledTwice).to.be.true;
    expect(selectChapter.alwaysCalledWithExactly(3)).to.be.true;
    expect(el.currentTime).to.equal(322.5);
  });

  it('updates time but does not advance while paused', () => {
    const el = makeInstance();
    const selectChapter = sinon.stub(el, 'selectChapter');

    el.handleVideoTimeUpdate({ currentTarget: { currentTime: 100, paused: true } });

    expect(el.currentTime).to.equal(100);
    expect(selectChapter.called).to.be.false;
  });

  it('does not advance beyond the final chapter', () => {
    const el = makeInstance();
    const container = document.createElement('div');
    render(el.renderChapters(), container);
    el.selectedChapterIndex = container.querySelectorAll('.chapter').length - 1;
    const selectChapter = sinon.stub(el, 'selectChapter');

    el.handleVideoTimeUpdate({ currentTarget: { currentTime: 4000, paused: false } });

    expect(el.currentTime).to.equal(4000);
    expect(selectChapter.called).to.be.false;
  });

  it('updates playback time without selecting a chapter when chapters are absent', () => {
    const el = makeInstance();
    el.chapters = [];
    const selectChapter = sinon.stub(el, 'selectChapter');

    el.handleVideoTimeUpdate({ currentTarget: { currentTime: 100, paused: false } });

    expect(el.currentTime).to.equal(100);
    expect(selectChapter.called).to.be.false;
  });
});

describe('AssetVideoPlayer - chapter progress', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('fills earlier tracks blue when clicking the third chapter', async () => {
    const el = makeInstance();
    const container = document.createElement('div');
    const styles = document.createElement('style');
    styles.textContent = await readFile({ path: '../../eds/components/AssetVideoPlayer.css' });
    el.appendChild(container);
    document.body.append(styles, el);
    render(el.renderChapters(), container);

    container.querySelector('#chapter-3').click();
    render(el.renderChapters(), container);

    const fills = container.querySelectorAll('.progress-fill');
    [fills[0], fills[1]].forEach((fill) => {
      expect(fill.style.width).to.equal('100%');
      expect(getComputedStyle(fill).backgroundColor).to.equal('rgb(20, 115, 230)');
    });
    Array.from(fills).slice(2).forEach((fill) => {
      expect(fill.style.width).to.equal('0%');
    });
  });

  it('preserves partial progress for the active chapter and empty future tracks', () => {
    const el = makeInstance();
    el.selectChapter(2);
    el.currentTime = (142.906 + 322.223) / 2;

    expect(el.getChapterProgress(0)).to.equal(100);
    expect(el.getChapterProgress(1)).to.equal(100);
    expect(el.getChapterProgress(2)).to.be.closeTo(50, 0.001);
    expect(el.getChapterProgress(3)).to.equal(0);
  });

  it('clamps active chapter progress between zero and one hundred percent', () => {
    const el = makeInstance();
    el.selectChapter(2);
    el.currentTime = 0;
    expect(el.getChapterProgress(2)).to.equal(0);
    el.currentTime = 4000;
    expect(el.getChapterProgress(2)).to.equal(100);
  });
});

describe('AssetVideoPlayer - chapter URLs', () => {
  let originalUrl;

  beforeEach(() => {
    originalUrl = window.location.href;
  });

  afterEach(() => {
    window.history.replaceState(null, '', originalUrl);
    document.body.innerHTML = '';
  });

  it('restores the copied chapter and seeks after metadata loads', () => {
    const url = makeInstance().createChapterUrl(2);
    expect(new URL(url).searchParams.get('t')).to.equal('142.906');
    window.history.replaceState(null, '', url);

    const el = makeInstance();
    const container = document.createElement('div');
    document.body.appendChild(container);
    render(el.renderChapters(), container);
    expect(el.selectedChapterIndex).to.equal(2);
    expect(container.querySelector('.is-active').id).to.equal('chapter-3');
    expect(container.querySelector('#chapter-1 .progress-fill').style.width).to.equal('100%');
    expect(container.querySelector('#chapter-2 .progress-fill').style.width).to.equal('100%');

    const video = document.createElement('video');
    el.handleVideoLoadedMetadata({ currentTarget: video });
    expect(video.currentTime).to.equal(142.906);
  });

  it('selects a chapter from a timestamp-only URL', () => {
    window.history.replaceState(null, '', '?t=100');
    const el = makeInstance();
    expect(el.selectedChapterIndex).to.equal(1);
    expect(el.currentTime).to.equal(100);
  });

  it('preserves unrelated URL parameters and the hash when creating a chapter link', () => {
    window.history.replaceState(null, '', '?asset=example&chapter=1&t=0#details');
    const url = new URL(makeInstance().createChapterUrl(2));

    expect(url.searchParams.get('asset')).to.equal('example');
    expect(url.searchParams.get('chapter')).to.equal('3');
    expect(url.searchParams.get('t')).to.equal('142.906');
    expect(url.hash).to.equal('#details');
  });

  it('restores an in-range timestamp for an explicitly selected chapter', () => {
    window.history.replaceState(null, '', '?chapter=3&t=200');
    const el = makeInstance();
    expect(el.selectedChapterIndex).to.equal(2);
    expect(el.currentTime).to.equal(200);
  });

  it('uses the next chapter at a shared timestamp boundary', () => {
    window.history.replaceState(null, '', '?t=91.625');
    const el = makeInstance();
    expect(el.selectedChapterIndex).to.equal(1);
    expect(el.currentTime).to.equal(91.625);
  });

  it('falls back to a valid timestamp when the chapter parameter is invalid', () => {
    window.history.replaceState(null, '', '?chapter=999&t=100');
    const el = makeInstance();
    expect(el.selectedChapterIndex).to.equal(1);
    expect(el.currentTime).to.equal(100);
  });

  it('uses the selected chapter start for an out-of-range timestamp', () => {
    window.history.replaceState(null, '', '?chapter=3&t=100');
    const el = makeInstance();
    expect(el.selectedChapterIndex).to.equal(2);
    expect(el.currentTime).to.equal(142.906);
  });

  it('falls back to the chapter start for an invalid timestamp', () => {
    window.history.replaceState(null, '', '?chapter=2&t=invalid');
    const el = makeInstance();
    expect(el.selectedChapterIndex).to.equal(1);
    expect(el.currentTime).to.equal(91.625);
  });

  it('restores a chapter at its start when the timestamp is missing or blank', () => {
    ['?chapter=3', '?chapter=3&t=', '?chapter=3&t=%20%20'].forEach((query) => {
      window.history.replaceState(null, '', query);
      const el = makeInstance();

      expect(el.selectedChapterIndex).to.equal(2);
      expect(el.currentTime).to.equal(142.906);
    });
  });

  it('keeps the explicit chapter when the timestamp is exactly its end', () => {
    window.history.replaceState(null, '', '?chapter=2&t=142.906');
    const el = makeInstance();

    expect(el.selectedChapterIndex).to.equal(1);
    expect(el.currentTime).to.equal(91.625);
  });

  it('restores the chapter start when the timestamp is exactly its start', () => {
    window.history.replaceState(null, '', '?chapter=3&t=142.906');
    const el = makeInstance();

    expect(el.selectedChapterIndex).to.equal(2);
    expect(el.currentTime).to.equal(142.906);
  });

  it('falls back to a timestamp for non-integer and non-positive chapter values', () => {
    ['1.5', '0', '-1', 'invalid'].forEach((chapter) => {
      window.history.replaceState(null, '', `?chapter=${chapter}&t=200`);
      const el = makeInstance();

      expect(el.selectedChapterIndex).to.equal(2);
      expect(el.currentTime).to.equal(200);
    });
  });

  it('leaves the selection unchanged for timestamps outside all chapter ranges', () => {
    ['0', '322.5', '432.258', '500'].forEach((timestamp) => {
      window.history.replaceState(null, '', `?t=${timestamp}`);
      const el = makeInstance();
      el.selectedChapterIndex = 1;
      el.currentTime = 100;

      el.restoreChapterFromUrl();

      expect(el.selectedChapterIndex).to.equal(1);
      expect(el.currentTime).to.equal(100);
    });
  });

  it('ignores chapter links when no chapter metadata is available', () => {
    window.history.replaceState(null, '', '?chapter=2&t=100');
    const el = new AssetVideoPlayer();

    el.restoreChapterFromUrl();

    expect(el.chapters).to.deep.equal([]);
    expect(el.selectedChapterIndex).to.equal(0);
    expect(el.currentTime).to.equal(0);
  });

  it('keeps the default chapter for invalid URL values', () => {
    ['?chapter=999&t=-1', '?chapter=1.5&t=Infinity', '?chapter=invalid&t='].forEach((query) => {
      window.history.replaceState(null, '', query);
      const el = makeInstance();
      expect(el.selectedChapterIndex).to.equal(0);
      expect(el.currentTime).to.equal(0);
    });
  });
});

describe('AssetVideoPlayer - chapter scrolling', () => {
  let originalUrl;
  let scrollIntoView;

  beforeEach(() => {
    originalUrl = window.location.href;
    scrollIntoView = sinon.stub(Element.prototype, 'scrollIntoView');
    const styles = document.createElement('style');
    styles.textContent = `
      asset-video-player .chapter-list { max-height: 120px; }
      asset-video-player .chapter { min-height: 100px; }
    `;
    document.body.appendChild(styles);
  });

  afterEach(() => {
    window.history.replaceState(null, '', originalUrl);
  });

  it('scrolls to the rendered player for chapter and timestamp links without autoplay', async () => {
    const play = sinon.stub(HTMLMediaElement.prototype, 'play').resolves();
    for (const query of ['?chapter=3&t=200', '?chapter=3', '?t=200']) {
      window.history.replaceState(null, '', query);
      const player = makeInstance();
      expect(scrollIntoView.called).to.be.false;

      document.body.appendChild(player);
      await player.updateComplete;

      expect(scrollIntoView.calledOnceWithExactly({ block: 'start' })).to.be.true;
      expect(scrollIntoView.firstCall.thisValue).to.equal(player.querySelector('.video-container'));
      expect(player.selectedChapterIndex).to.equal(2);
      expect(player.currentTime).to.equal(query === '?chapter=3' ? 142.906 : 200);
      expect(play.called).to.be.false;
      const chapterList = player.querySelector('.chapter-list');
      const selectedChapter = player.querySelector('.chapter.is-active');
      expect(chapterList.scrollTop).to.be.greaterThan(0);
      expect(selectedChapter.getBoundingClientRect().top)
        .to.be.closeTo(chapterList.getBoundingClientRect().top, 1);
      const { scrollTop } = chapterList;

      player.currentTime += 1;
      await player.updateComplete;
      expect(scrollIntoView.calledOnce).to.be.true;
      expect(chapterList.scrollTop).to.equal(scrollTop);
      player.remove();
      scrollIntoView.resetHistory();
    }
  });

  it('waits for asynchronously supplied chapters before scrolling', async () => {
    window.history.replaceState(null, '', '?chapter=2&t=100');
    const player = new AssetVideoPlayer();
    document.body.appendChild(player);
    await player.updateComplete;
    expect(scrollIntoView.called).to.be.false;

    player.chapters = makeInstance().chapters;
    await player.updateComplete;

    expect(scrollIntoView.calledOnce).to.be.true;
    expect(scrollIntoView.firstCall.thisValue).to.equal(player.querySelector('.video-container'));
    expect(player.selectedChapterIndex).to.equal(1);
    expect(player.currentTime).to.equal(100);
    const chapterList = player.querySelector('.chapter-list');
    expect(chapterList.scrollTop).to.be.greaterThan(0);
    expect(player.querySelector('.chapter.is-active').getBoundingClientRect().top)
      .to.be.closeTo(chapterList.getBoundingClientRect().top, 1);
  });

  it('keeps the final linked chapter visible when the list reaches its scroll limit', async () => {
    window.history.replaceState(null, '', '?chapter=4');
    const player = makeInstance();
    document.body.appendChild(player);
    await player.updateComplete;

    const chapterList = player.querySelector('.chapter-list');
    const selectedChapter = player.querySelector('.chapter.is-active');
    expect(chapterList.scrollTop).to.be.greaterThan(0);
    expect(selectedChapter.getBoundingClientRect().top)
      .to.be.at.least(chapterList.getBoundingClientRect().top - 1);
    expect(selectedChapter.getBoundingClientRect().bottom)
      .to.be.at.most(chapterList.getBoundingClientRect().bottom + 1);
    expect(scrollIntoView.calledOnce).to.be.true;
    expect(scrollIntoView.firstCall.thisValue).to.equal(player.querySelector('.video-container'));
  });

  it('reveals chapters selected on the video timeline without scrolling the page', async () => {
    window.history.replaceState(null, '', '?asset=example');
    const player = makeInstance();
    document.body.appendChild(player);
    await player.updateComplete;
    const video = player.querySelector('video');
    sinon.stub(video, 'readyState').get(() => 1);
    sinon.stub(video, 'duration').get(() => 400);
    player.videoDuration = 400;
    await player.updateComplete;
    const progress = player.querySelector('.player-progress');
    sinon.stub(progress, 'getBoundingClientRect').returns({ left: 0, right: 400, top: 0, bottom: 22, width: 400 });
    sinon.stub(progress, 'setPointerCapture');
    const chapterList = player.querySelector('.chapter-list');

    for (const time of [380, 10]) {
      progress.dispatchEvent(new PointerEvent('pointerdown', { clientX: time, button: 0, pointerId: 1 }));
      video.dispatchEvent(new Event('timeupdate'));
      await player.updateComplete;

      expect(video.currentTime).to.equal(time);
      expect(player.selectedChapterIndex).to.equal(time === 380 ? 3 : 0);
      const selectedChapter = player.querySelector('.chapter.is-active');
      expect(selectedChapter.getBoundingClientRect().top)
        .to.be.at.least(chapterList.getBoundingClientRect().top - 1);
      expect(selectedChapter.getBoundingClientRect().bottom)
        .to.be.at.most(chapterList.getBoundingClientRect().bottom + 1);
      expect(scrollIntoView.called).to.be.false;
    }
  });

  it('keeps the list position when the newly selected chapter is already visible', async () => {
    window.history.replaceState(null, '', '?asset=example');
    const player = makeInstance();
    document.body.appendChild(player);
    await player.updateComplete;
    const chapterList = player.querySelector('.chapter-list');
    chapterList.style.maxHeight = '250px';
    const video = player.querySelector('video');
    video.currentTime = 100;
    video.dispatchEvent(new Event('timeupdate'));
    await player.updateComplete;

    expect(player.selectedChapterIndex).to.equal(1);
    expect(chapterList.scrollTop).to.equal(0);
    expect(scrollIntoView.called).to.be.false;
  });

  it('reveals the current chapter when reopening a collapsed chapter list', async () => {
    window.history.replaceState(null, '', '?asset=example');
    const player = makeInstance();
    document.body.appendChild(player);
    await player.updateComplete;
    player.chaptersVisible = false;
    await player.updateComplete;
    const video = player.querySelector('video');
    video.currentTime = 380;
    video.dispatchEvent(new Event('timeupdate'));
    await player.updateComplete;
    const chapterList = player.querySelector('.chapter-list');
    expect(chapterList.scrollTop).to.equal(0);

    player.chaptersVisible = true;
    await player.updateComplete;

    expect(chapterList.scrollTop).to.be.greaterThan(0);
    expect(player.querySelector('.chapter.is-active').getBoundingClientRect().bottom)
      .to.be.at.most(chapterList.getBoundingClientRect().bottom + 1);
    expect(scrollIntoView.called).to.be.false;
  });

  it('does not scroll for ordinary page visits or invalid chapter links', async () => {
    for (const query of ['?asset=example', '?chapter=999&t=-1', '?t=invalid']) {
      window.history.replaceState(null, '', query);
      const player = makeInstance();
      document.body.appendChild(player);
      await player.updateComplete;

      expect(scrollIntoView.called).to.be.false;
      expect(player.querySelector('.chapter-list').scrollTop).to.equal(0);
      player.remove();
    }
  });
});

describe('AssetVideoPlayer - selectChapter()', () => {
  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('preserves the seek time when selecting before the video exists', () => {
    const el = makeInstance();
    el.selectChapter(1);
    const video = document.createElement('video');
    el.handleVideoLoadedMetadata({ currentTarget: video });
    expect(video.currentTime).to.equal(91.625);
  });

  it('seeks and requests playback immediately when metadata is ready', () => {
    const video = document.createElement('video');
    sinon.stub(video, 'readyState').get(() => 1);
    const playStub = sinon.stub(video, 'play').resolves();
    const el = makeInstance();
    el.appendChild(video);

    el.selectChapter(1);

    expect(el.selectedChapterIndex).to.equal(1);
    expect(video.currentTime).to.equal(91.625);
    expect(playStub.calledOnce).to.be.true;
  });

  it('requests playback immediately and seeks to the latest selection once metadata loads', () => {
    const video = document.createElement('video');
    sinon.stub(video, 'readyState').get(() => 0);
    const playStub = sinon.stub(video, 'play').resolves();
    const el = makeInstance();
    el.appendChild(video);

    el.selectChapter(1);
    expect(playStub.calledOnce).to.be.true;
    expect(video.currentTime).to.equal(0);

    el.selectChapter(2);
    el.handleVideoLoadedMetadata({ currentTarget: video });

    expect(playStub.calledTwice).to.be.true;
    expect(video.currentTime).to.equal(142.906);
    expect(el.currentTime).to.equal(142.906);
  });

  it('ignores invalid chapter indices without changing playback', () => {
    const video = document.createElement('video');
    const playStub = sinon.stub(video, 'play').resolves();
    const el = makeInstance();
    el.appendChild(video);
    el.currentTime = 20;

    [-1, 999].forEach((index) => el.selectChapter(index));

    expect(el.selectedChapterIndex).to.equal(0);
    expect(el.currentTime).to.equal(20);
    expect(video.currentTime).to.equal(0);
    expect(playStub.called).to.be.false;
  });

  it('keeps the selection and seek time when playback is rejected', async () => {
    const video = document.createElement('video');
    sinon.stub(video, 'readyState').get(() => 1);
    const playStub = sinon.stub(video, 'play').rejects(new Error('Playback requires interaction'));
    const el = makeInstance();
    el.appendChild(video);

    el.selectChapter(2);
    await Promise.resolve();

    expect(playStub.calledOnce).to.be.true;
    expect(el.selectedChapterIndex).to.equal(2);
    expect(el.currentTime).to.equal(142.906);
    expect(video.currentTime).to.equal(142.906);
  });
});

describe('AssetVideoPlayer - custom video controls', () => {
  let el;
  let video;
  let holder;

  beforeEach(() => {
    el = makeInstance();
    holder = document.createElement('div');
    holder.className = 'video-holder';
    video = document.createElement('video');
    holder.appendChild(video);
    el.appendChild(holder);
    sinon.stub(video, 'play').resolves();
    sinon.stub(video, 'pause');
    sinon.stub(video, 'readyState').get(() => 1);
    sinon.stub(video, 'duration').get(() => 3491.273);
    el.videoDuration = video.duration;
    holder.addEventListener('keydown', (event) => el.handlePlayerKeydown(event));
  });

  afterEach(() => {
    if (el.chaptersTrackUrl) URL.revokeObjectURL(el.chaptersTrackUrl);
    sinon.restore();
    document.body.innerHTML = '';
  });

  function renderControls() {
    let controls = holder.querySelector('.test-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.className = 'test-controls';
      holder.appendChild(controls);
    }
    render(el.renderVideoControls(), controls, { host: el });
  }

  it('toggles playback from both play buttons and reflects playing state', () => {
    renderControls();
    holder.querySelector('.player-center-play').click();
    expect(video.play.calledOnce).to.equal(true);
    sinon.stub(video, 'paused').get(() => false);
    el.isVideoPlaying = true;
    renderControls();
    expect(holder.querySelector('.player-center-play').hidden).to.equal(true);
    holder.querySelector('[aria-label="Pause"]').click();
    expect(video.pause.calledOnce).to.equal(true);
  });

  it('clamps seeking and synchronizes the selected chapter even while paused', () => {
    el.seekVideo(200);
    el.handleVideoTimeUpdate({ currentTarget: video });
    expect(video.currentTime).to.equal(200);
    expect(el.selectedChapterIndex).to.equal(2);
    el.seekVideo(100);
    el.handleVideoTimeUpdate({ currentTarget: video });
    expect(el.selectedChapterIndex).to.equal(1);
    el.seekVideo(-10);
    expect(video.currentTime).to.equal(0);
    el.videoDuration = video.duration;
    el.seekVideo(10000);
    el.handleVideoTimeUpdate({ currentTarget: video });
    expect(video.currentTime).to.equal(3491.273);
    expect(el.selectedChapterIndex).to.equal(3);
    renderControls();
    expect(holder.querySelector('.player-progress').getAttribute('aria-valuenow'))
      .to.equal('3491.273');
  });

  it('does not seek or start playback when time enters a gap between chapters', () => {
    video.currentTime = 322.5;
    el.handleVideoTimeUpdate({ currentTarget: video });
    expect(el.selectedChapterIndex).to.equal(2);
    expect(video.currentTime).to.equal(322.5);
    expect(video.play.called).to.equal(false);
  });

  it('rewinds and forwards ten seconds and skips to the next chapter', () => {
    el.seekVideo(100);
    el.handleVideoTimeUpdate({ currentTarget: video });
    renderControls();
    holder.querySelector('[aria-label="Rewind 10 seconds"]').click();
    expect(video.currentTime).to.equal(90);
    holder.querySelector('[aria-label="Forward 10 seconds"]').click();
    expect(video.currentTime).to.equal(100);
    renderControls();
    holder.querySelector('.player-next-chapter').click();
    expect(video.currentTime).to.equal(142.906);
    expect(video.play.calledOnce).to.equal(true);
  });

  it('hides and restores the side chapter list without changing playback', () => {
    el.assetHasData = true;
    el.isLoading = false;
    el.isVideo = true;
    el.currentTime = 100;
    const container = document.createElement('div');
    document.body.appendChild(container);
    render(el.render(), container);
    const player = container.querySelector('.video-holder');
    const playerVideo = player.querySelector('video');
    expect(container.querySelectorAll('.chapter').length).to.equal(4);
    expect(player.querySelector('.player-controls-right [aria-expanded]').getAttribute('aria-expanded'))
      .to.equal('true');

    player.querySelector('.player-controls-right [aria-expanded]').click();
    render(el.render(), container);
    expect(container.querySelector('.video-chapters').parentElement.parentElement.hidden).to.equal(true);
    expect(player.querySelector('.player-controls-right [aria-expanded]').getAttribute('aria-expanded'))
      .to.equal('false');
    expect(player.querySelector('.player-chapter-menu')).to.equal(null);

    player.querySelector('.player-controls-right [aria-expanded]').click();
    render(el.render(), container);
    expect(container.querySelectorAll('.chapter').length).to.equal(4);
    expect(player.querySelector('.player-controls-right [aria-expanded]').getAttribute('aria-expanded'))
      .to.equal('true');
    expect(player.querySelector('video')).to.equal(playerVideo);
    expect(el.currentTime).to.equal(100);
    expect(video.play.called).to.equal(false);
    expect(player.querySelectorAll('.player-chapter-segment').length).to.equal(4);
  });

  it('removes the next-chapter control on the final chapter and restores it when navigating back', () => {
    el.selectedChapterIndex = el.chapters.length - 2;
    renderControls();
    const nextChapter = holder.querySelector('.player-next-chapter');
    expect(nextChapter.getAttribute('aria-label')).to.equal(`Up next: ${el.chapters[3].title}`);

    nextChapter.click();
    renderControls();

    expect(el.selectedChapterIndex).to.equal(3);
    expect(video.currentTime).to.equal(322.959);
    expect(video.play.calledOnce).to.be.true;
    expect(holder.querySelector('.player-next-chapter')).to.equal(null);

    el.selectChapter(2);
    renderControls();
    expect(holder.querySelector('.player-next-chapter')).to.exist;
  });

  it('omits the next-chapter control for a single chapter or no chapters', () => {
    el.chapters = el.chapters.slice(0, 1);
    renderControls();
    expect(holder.querySelector('.player-next-chapter')).to.equal(null);

    el.chapters = [];
    renderControls();
    expect(holder.querySelector('.player-next-chapter')).to.equal(null);
    expect(video.play.called).to.be.false;
  });

  it('mutes, changes volume, cycles speed, and applies settings', () => {
    renderControls();
    holder.querySelector('[aria-label="Mute"]').click();
    expect(video.muted).to.equal(true);
    expect(el.volumeExpanded).to.equal(true);
    renderControls();
    const volume = holder.querySelector('[aria-label="Volume"]');
    volume.value = '0.4';
    volume.dispatchEvent(new Event('input'));
    expect(video.volume).to.equal(0.4);
    expect(video.muted).to.equal(false);
    el.setPlaybackSpeed(1.25);
    expect(video.playbackRate).to.equal(1.25);
    el.settingsMenuOpen = true;
    renderControls();
    const speed = holder.querySelector('select');
    speed.value = '2';
    speed.dispatchEvent(new Event('change'));
    expect(video.playbackRate).to.equal(2);
    expect(el.settingsMenuOpen).to.equal(false);
  });

  it('seeks once per arrow key and leaves button and range keyboard actions alone', () => {
    el.seekVideo(100);
    el.handleVideoTimeUpdate({ currentTarget: video });
    renderControls();
    const progress = holder.querySelector('.player-progress');
    progress.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    expect(video.currentTime).to.equal(110);
    const volume = holder.querySelector('[aria-label="Volume"]');
    volume.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(video.currentTime).to.equal(110);
    holder.querySelector('[aria-label="Play"]').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(video.play.called).to.equal(false);
  });

  it('uses actual duration for chapter segments and progress after metadata loads', () => {
    sinon.restore();
    sinon.stub(video, 'duration').get(() => 300);
    el.handleVideoLoadedMetadata({ currentTarget: video });
    expect(el.playerDuration).to.equal(300);
    renderControls();
    const segments = holder.querySelectorAll('.player-chapter-segment');
    expect(segments[0].style.left).to.equal('0%');
    holder.style.width = '300px';
    holder.style.position = 'relative';
    document.body.appendChild(holder);
    expect(segments[3].style.left).to.equal('100%');
    expect(getComputedStyle(segments[3]).width).to.equal('0px');
    expect(holder.querySelector('.player-progress').getAttribute('aria-valuemax')).to.equal('300');
  });

  it('provides a cached WebVTT track that Chrome parses into all chapter cues', async () => {
    const url = el.createChaptersTrackUrl();
    expect(el.createChaptersTrackUrl()).to.equal(url);
    const track = document.createElement('track');
    track.kind = 'chapters';
    track.src = url;
    const loaded = new Promise((resolve, reject) => {
      track.onload = resolve;
      track.onerror = reject;
    });
    video.appendChild(track);
    track.track.mode = 'hidden';
    await loaded;
    expect(track.track.cues.length).to.equal(4);
    expect(track.track.cues[0].startTime).to.equal(1.001);
    expect(track.track.cues[3].endTime).to.equal(432.258);
  });
});

describe('AssetVideoPlayer - component lifecycle and progress', () => {
  async function mountPlayer() {
    const player = makeInstance();
    document.body.appendChild(player);
    await player.updateComplete;
    return player;
  }

  it('registers the component and renders in light DOM', async () => {
    expect(customElements.get('asset-video-player')).to.equal(AssetVideoPlayer);
    const player = document.createElement('asset-video-player');
    player.chapters = makeInstance().chapters;
    document.body.appendChild(player);
    await player.updateComplete;
    expect(player).to.be.instanceOf(AssetVideoPlayer);
    expect(player.shadowRoot).to.equal(null);
    expect(player.querySelectorAll('.chapter')).to.have.lengthOf(4);
  });

  it('keeps external playback scoped to its own video', async () => {
    const first = await mountPlayer();
    const second = await mountPlayer();
    const firstPlay = sinon.stub(first.querySelector('video'), 'play').resolves();
    const secondPlay = sinon.stub(second.querySelector('video'), 'play').resolves();

    await second.play();

    expect(firstPlay.called).to.be.false;
    expect(secondPlay.calledOnce).to.be.true;
  });

  it('pauses a playing chaptered video when clicked and restores the center play button', async () => {
    const player = await mountPlayer();
    const video = player.querySelector('video');
    sinon.stub(video, 'paused').get(() => false);
    const pause = sinon.stub(video, 'pause').callsFake(() => {
      video.dispatchEvent(new Event('pause'));
    });
    video.dispatchEvent(new Event('play'));
    await player.updateComplete;
    expect(player.querySelector('.player-center-play').hidden).to.be.true;

    player.querySelector('[aria-label="Rewind 10 seconds"]').click();
    expect(pause.called).to.be.false;

    video.click();
    await player.updateComplete;

    expect(pause.calledOnce).to.be.true;
    expect(player.isVideoPlaying).to.be.false;
    expect(player.querySelector('.player-center-play').hidden).to.be.false;
  });

  it('does not start playback when clicking a paused chaptered video', async () => {
    const player = await mountPlayer();
    const video = player.querySelector('video');
    sinon.stub(video, 'paused').get(() => true);
    const pause = sinon.stub(video, 'pause');
    const play = sinon.stub(video, 'play').resolves();

    video.click();

    expect(pause.called).to.be.false;
    expect(play.called).to.be.false;
  });

  it('leaves video clicks to native controls when there are no chapters', async () => {
    const player = new AssetVideoPlayer();
    document.body.appendChild(player);
    await player.updateComplete;
    const video = player.querySelector('video');
    sinon.stub(video, 'paused').get(() => false);
    const pause = sinon.stub(video, 'pause');

    video.click();

    expect(video.controls).to.be.true;
    expect(pause.called).to.be.false;
  });

  it('notifies consumers when loading starts and stops', async () => {
    const player = await mountPlayer();
    const changes = [];
    player.addEventListener('loading-change', (event) => {
      changes.push(event.detail.loading);
    });
    const video = player.querySelector('video');

    video.dispatchEvent(new Event('waiting'));
    await player.updateComplete;
    expect(player.querySelector('.video-loading-overlay')).to.exist;
    video.dispatchEvent(new Event('canplay'));
    await player.updateComplete;

    expect(changes).to.deep.equal([true, false]);
    expect(player.querySelector('.video-loading-overlay')).to.equal(null);
  });

  it('reloads changed sources and resets stale player state without replacing the video', async () => {
    const player = await mountPlayer();
    const video = player.querySelector('video');
    const load = sinon.stub(video, 'load');
    const oldTrack = player.chaptersTrackUrl;
    const revoke = sinon.spy(URL, 'revokeObjectURL');
    player.currentTime = 100;
    player.videoDuration = 400;
    player.isVideoPlaying = true;
    player.settingsMenuOpen = true;
    player.progressHover = { time: 100, title: 'Previous' };
    player.markChapterShared(1);
    await player.updateComplete;

    player.src = 'data:video/mp4;base64,';
    player.fileType = 'video/mp4';
    await player.updateComplete;

    expect(player.querySelector('video')).to.equal(video);
    expect(video.querySelector('source').getAttribute('src')).to.equal('data:video/mp4;base64,');
    expect(video.querySelector('source').getAttribute('type')).to.equal('video/mp4');
    expect(load.calledOnce).to.be.true;
    expect(revoke.calledWithExactly(oldTrack)).to.be.true;
    expect(player.currentTime).to.equal(0);
    expect(player.videoDuration).to.equal(0);
    expect(player.isVideoPlaying).to.be.false;
    expect(player.settingsMenuOpen).to.be.false;
    expect(player.progressHover).to.equal(null);
    expect(player.sharedChapterIndex).to.equal(-1);
    expect(player.shareResetTimer).to.equal(null);
  });

  it('rebuilds changed chapter tracks and restores chapter links after metadata arrives', async () => {
    const originalUrl = window.location.href;
    try {
      const player = await mountPlayer();
      const oldTrack = player.chaptersTrackUrl;
      const revoke = sinon.spy(URL, 'revokeObjectURL');
      window.history.replaceState(null, '', '?chapter=2&t=35');
      player.chapters = [
        { title: 'First', timerange: '00:00:00.000 - 00:00:30.000' },
        { title: 'Second', timerange: '00:00:30.000 - 00:01:00.000' },
      ];
      await player.updateComplete;

      expect(revoke.calledWithExactly(oldTrack)).to.be.true;
      expect(player.chaptersTrackUrl).not.to.equal(oldTrack);
      expect(player.querySelectorAll('.chapter')).to.have.lengthOf(2);
      expect(player.currentTime).to.equal(35);
      expect(player.selectedChapterIndex).to.equal(1);
      player.handleVideoLoadedMetadata({ currentTarget: player.querySelector('video') });
      expect(player.querySelector('video').currentTime).to.equal(35);
    } finally {
      window.history.replaceState(null, '', originalUrl);
    }
  });

  it('releases blob URLs and timers on removal and rebuilds the track on reconnect', async () => {
    const player = await mountPlayer();
    const oldTrack = player.chaptersTrackUrl;
    const revoke = sinon.spy(URL, 'revokeObjectURL');
    const clear = sinon.spy(window, 'clearTimeout');
    player.markChapterShared(1);
    const timer = player.shareResetTimer;

    player.remove();
    expect(revoke.calledWithExactly(oldTrack)).to.be.true;
    expect(clear.calledWith(timer)).to.be.true;
    expect(player.chaptersTrackUrl).to.equal(null);

    document.body.appendChild(player);
    await player.updateComplete;
    expect(player.chaptersTrackUrl).to.be.a('string');
    expect(player.chaptersTrackUrl).not.to.equal(oldTrack);
    expect(player.querySelector('track').getAttribute('src')).to.equal(player.chaptersTrackUrl);
  });

  it('shows pointer time above the chapter title without seeking on hover', async () => {
    const player = await mountPlayer();
    player.videoDuration = 400;
    await player.updateComplete;
    const progress = player.querySelector('.player-progress');
    sinon.stub(progress, 'getBoundingClientRect').returns({ left: 0, right: 400, top: 0, bottom: 22, width: 400 });
    const video = player.querySelector('video');

    progress.dispatchEvent(new PointerEvent('pointermove', { clientX: 214, pointerType: 'mouse' }));
    await player.updateComplete;

    const tooltip = player.querySelector('.player-progress-tooltip');
    expect(tooltip).to.exist;
    expect(tooltip.children[0].textContent.trim()).to.equal('3:34');
    expect(tooltip.children[1].textContent.trim()).to.equal('Why Partners Should Be Excited');
    expect(video.currentTime).to.equal(0);
    expect(player.querySelector('.player-chapter-segment').hasAttribute('title')).to.be.false;

    progress.dispatchEvent(new PointerEvent('pointerleave'));
    await player.updateComplete;
    expect(player.querySelector('.player-progress-tooltip')).to.equal(null);
    expect(player.querySelectorAll('.chapter-share-tooltip')).to.have.lengthOf(4);
  });

  it('keeps completed segments blue, rounded and separated without a leading gap', async () => {
    const player = await mountPlayer();
    player.videoDuration = 400;
    player.currentTime = 400;
    await player.updateComplete;
    const segments = player.querySelectorAll('.player-chapter-segment');

    expect(segments).to.have.lengthOf(4);
    expect(segments[0].style.left).to.equal('0%');
    expect(segments[0].style.width).to.include('- 3px');
    expect(segments[3].style.width).not.to.include('- 3px');
    segments.forEach((segment) => {
      expect(segment.style.borderRadius).to.equal('2px');
      expect(segment.style.background).to.include('rgb(20, 115, 230) 100%');
    });
    expect(player.querySelector('.player-progress-played')).to.equal(null);
  });

  it('uses native controls without custom controls or a custom play button when chapters are absent', async () => {
    const player = new AssetVideoPlayer();
    document.body.appendChild(player);
    await player.updateComplete;

    expect(player.querySelector('video').controls).to.be.true;
    expect(player.querySelector('.video-chapters')).to.equal(null);
    expect(player.querySelector('.player-controls')).to.equal(null);
    expect(player.querySelector('.player-center-play')).to.equal(null);
    expect(player.querySelector('.player-settings-menu')).to.equal(null);
    expect(player.querySelector('.video-tint')).to.equal(null);
  });

  it('switches between native and custom controls when chapters change without replacing the video', async () => {
    const player = await mountPlayer();
    const video = player.querySelector('video');
    const { chapters } = player;
    expect(video.controls).to.be.false;
    expect(player.querySelector('.player-controls')).to.exist;
    expect(player.querySelector('.player-center-play')).to.exist;

    player.chapters = [];
    await player.updateComplete;

    expect(player.querySelector('video')).to.equal(video);
    expect(video.controls).to.be.true;
    expect(player.querySelector('.video-chapters')).to.equal(null);
    expect(player.querySelector('track')).to.equal(null);
    expect(player.querySelector('.player-controls')).to.equal(null);
    expect(player.querySelector('.player-center-play')).to.equal(null);
    expect(player.querySelector('.video-tint')).to.equal(null);

    player.chapters = chapters;
    await player.updateComplete;

    expect(player.querySelector('video')).to.equal(video);
    expect(video.controls).to.be.false;
    expect(player.querySelector('.player-controls')).to.exist;
    expect(player.querySelector('.player-center-play')).to.exist;
    expect(player.querySelector('.video-chapters')).to.exist;
  });

  it('leaves native video keyboard handling alone when there are no chapters', async () => {
    const player = new AssetVideoPlayer();
    document.body.appendChild(player);
    await player.updateComplete;
    const video = player.querySelector('video');
    const play = sinon.stub(video, 'play').resolves();
    const seek = sinon.spy(player, 'seekVideo');

    for (const key of [' ', 'ArrowRight', 'ArrowUp']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      video.dispatchEvent(event);
      expect(event.defaultPrevented).to.be.false;
    }

    expect(play.called).to.be.false;
    expect(seek.called).to.be.false;
  });
});
