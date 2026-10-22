import { getLibs } from '../../scripts/utils.js';

const miloLibs = getLibs();

const { loadStyle } = await import(`${miloLibs}/utils/utils.js`);

const {
  applyHoverPlay,
  decorateBlockBg,
  decorateBlockHrs,
  decorateBlockText, decorateTextOverrides
} = await import(`${miloLibs}/utils/decorate.js`);

const decorateForeground = async (el, rows) => {
  let isForegroundEmpty = true;

  rows.forEach((row, i) => {
    if (!row.textContent.trim()) {
      row.remove();
      return;
    }

    isForegroundEmpty = false;
    if (i === 0) {
      row.classList.add('foreground');
      // decorateLockupFromContent(row);
    } else if (i === (rows.length - 1)) {
      row.classList.add('card-footer');
      if (!row.textContent.trim()) row.classList.add('empty');
    } else {
      row.classList.add('extra-row');
    }
    decorateBlockText(row, ['m', 'm', 'm']); // heading, body, detail
    decorateBlockHrs(row);
  });

  if (isForegroundEmpty) el.classList.add('no-foreground');
};

function handleClickableCard(el) {
  const links = el.querySelectorAll('a');
  if (el.classList.contains('click') && links) {
    el.addEventListener('click', (e) => {
      /* c8 ignore next 2 */
      if (e.target.tagName === 'A') return;
      (() => (links[0].target === '_blank' ? window.open(links[0].href) : window.location.assign(links[0].href)))();
    });
  }
}
const decorateMedia = (el, media) => {
  if (!media) return;
  media.classList.add('media-area');
  const mediaVideo = media.querySelector('video');
  if (mediaVideo) {
    applyHoverPlay(mediaVideo);
  }
  if (media.children.length > 1) decorateBlockBg(el, media, { className: 'vp-media' });
};
const decorateBgRow = (el, background, remove = false) => {
  const rows = background.querySelectorAll(':scope > div');
  const bgRowsEmpty = [...rows].every((row) => row.innerHTML.trim() === '');
  if (bgRowsEmpty || remove) {
    el.classList.add('no-bg');
    background.remove();
    return;
  }
  decorateBlockBg(el, background);
};

function initData(el) {
  const rows = el.querySelectorAll(':scope > div');
  const id = rows[4]?.innerText;
  const displayAlways = rows[5]?.innerText;

  Array.from(rows).slice(displayAlways ? -2 : -1).forEach((row) => row.remove());
  console.log('id', id);
  console.log('displayAlways', displayAlways);
}

export default async function init(el) {
  initData(el);
  el.classList.add('con-block');
  // const hasOpenClass = el.className.includes('open');
  // handleOpenClasses(el, hasOpenClass);

  if (el.className.includes('rounded-corners')) loadStyle(`${miloLibs}/styles/rounded-corners.css`);
  let rows = el.querySelectorAll(':scope > div');
  const [head, middle, ...tail] = rows;
  // check would it work well for head, middle, ...tail) than in tail we should probably have id etc
  // or just remove rows before this
  if (rows.length === 4) el.classList.add('equal-height');
  if (rows.length >= 1) {
    const count = rows.length >= 4 ? 'four-plus' : rows.length;
    switch (count) {
      case 'four-plus':
        // 4+ rows (0:bg, 1:media, 2:copy, ...3:static, last:card-footer)
        // 4+ rows.open (0:bg[removed], 1:media, 2:copy, ...3:static, last:card-footer)
        decorateBgRow(el, head, false);
        rows = tail;
        decorateMedia(el, middle);
        await decorateForeground(el, rows);
        break;
      case 3:
        // 3 rows (0:bg, 1:media, last:copy)
        // 3 rows.open (0:media, 1:copy, last:card-footer)
        rows = tail;
        decorateBgRow(el, head);
        decorateMedia(el, middle);
        await decorateForeground(el, rows);
        break;
      case 2:
        // 2 rows (0:media, 1:copy)
        rows = [middle];
        decorateMedia(el, head);
        el.classList.add('no-bg');
        await decorateForeground(el, rows);
        break;
      case 1:
        // 1 row  (0:copy)
        rows = [head];
        el.classList.add('no-bg', 'no-media');
        await decorateForeground(el, rows);
        break;
      default:
    }
  }
  // extendDeviceContent(el);
  decorateTextOverrides(el);
  handleClickableCard(el);
}
