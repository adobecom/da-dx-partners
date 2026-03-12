import { getLibs } from '../../scripts/utils.js';
import showToast from '../../components/Toast.js';

const miloLibs = getLibs();
const { createTag } = await import('../utils/utils.js');
const { decorateBlockBg, decorateBlockText, getBlockSize, decorateTextOverrides } = await import(`${miloLibs}/utils/decorate.js`);

// size: [heading, body, ...detail]
const blockTypeSizes = {
  text: {
    small: ['m', 's', 's'],
    medium: ['l', 'm', 'm'],
    large: ['xl', 'm', 'l'],
    xlarge: ['xxl', 'l', 'xl'],
  },
};

function decorateMultiViewport(foreground) {
  const viewports = ['mobile-up', 'tablet-up', 'desktop-up'];
  if (foreground.childElementCount === 2 || foreground.childElementCount === 3) {
    [...foreground.children].forEach((child, index) => {
      child.className = viewports[index];
      if (foreground.childElementCount === 2 && index === 1) child.className = 'tablet-up desktop-up';
    });
  }
  return foreground;
}

async function handleClick(e, url) {
  e.preventDefault();

  const toastMsg = {
    toastNegative: 'Access granted failed.',
    toastPositive: 'Access granted.',
    tryAgain: 'Try again',
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      // headers: { 'X-Requested-With': 'MiloDxp' },
    });

    if (response.ok) {
      showToast('submit', true, null, toastMsg);
    } else {
      throw new Error(`HTTP error: ${response.status}`);
    }
  } catch (err) {
    showToast('submit', false, (event) => handleClick(event, url), toastMsg);
  }
}

export default async function init(el) {
  el.classList.add('text-with-submit-block', 'con-block');
  let rows = el.querySelectorAll(':scope > div');
  if (rows.length > 1) {
    if (rows[0].textContent !== '') el.classList.add('has-bg');
    const [head, ...tail] = rows;
    decorateBlockBg(el, head);
    rows = tail || rows;
  }
  const helperClasses = [];
  const blockType = 'text';
  const size = getBlockSize(el);

  rows.forEach((row) => {
    row.classList.add('foreground');
    [...row.children].forEach((c) => decorateBlockText(c, blockTypeSizes[blockType][size]));
    decorateMultiViewport(row);
  });

  if (el.classList.contains('full-width')) helperClasses.push('max-width-8-desktop', 'center', 'xxl-spacing');
  el.classList.add(...helperClasses);
  decorateTextOverrides(el);

  const lastActionArea = el.querySelector('.action-area:last-of-type');
  if (lastActionArea) {
    const links = lastActionArea.querySelectorAll('a');

    links.forEach((link) => {
      const url = new URL(link.href);
      const hasSubmitParam = url.searchParams.get('submit');

      if (hasSubmitParam === 'true') {
        url.searchParams.delete('submit');
        link.addEventListener('click', (e) => handleClick(e, url.href));
      }
    });

    const div = createTag('div', { class: 'cta-container' });
    lastActionArea.insertAdjacentElement('afterend', div);
    div.append(lastActionArea);
  }
}
