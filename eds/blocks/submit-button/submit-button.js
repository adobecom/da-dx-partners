import { getLibs } from '../../scripts/utils.js';
import showToast from '../../components/Toast.js';

const miloLibs = getLibs();
const { decorateButtons } = await import(`${miloLibs}/utils/decorate.js`);

async function handleClick(e, url) {
  e.preventDefault();

  const toastMsg = {
    toastNegative: 'Unable to grant access.',
    toastPositive: 'Access granted.',
    tryAgain: 'Try again',
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (!data?.success) {
      throw new Error('API returned success=false');
    }

    showToast('submit', true, null, toastMsg);
  } catch (err) {
    showToast('submit', false, (event) => handleClick(event, url), toastMsg);
  }
}

export default function init(el) {
  const link = el.querySelector('a');

  if (!link) {
    el.remove();
    return;
  }

  el.classList.add('submit-button-block', 'con-block');

  const foreground = document.createElement('div');
  foreground.classList.add('foreground');

  const em = document.createElement('em');
  em.append(link);
  foreground.append(em);
  decorateButtons(em);
  el.replaceChildren(foreground);

  link.addEventListener('click', (e) => handleClick(e, link.href));
}
