import { getLibs } from '../../scripts/utils.js';
import showToast from '../../components/Toast.js';

const miloLibs = getLibs();
const { decorateButtons } = await import(`${miloLibs}/utils/decorate.js`);

async function handleClick(e, link) {
  if (link.classList.contains('disabled')) return;

  e.preventDefault();

  const toastMsg = {
    toastNegative: 'Unsuccessful request.',
    toastPositive: 'Successful request.',
    tryAgain: 'Try again',
  };

  try {
    const response = await fetch(link.href, {
      method: 'GET',
      credentials: 'include',
    });

    link.classList.add('disabled');

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (!data?.success) {
      throw new Error('API returned success=false');
    }

    showToast('submit', true, null, toastMsg);
  } catch (err) {
    showToast('submit', false, (event) => handleClick(event, link), toastMsg);
  } finally {
    link.classList.remove('disabled');
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

  // Use <em> to achieve a specific button style
  const em = document.createElement('em');
  em.append(link);
  foreground.append(em);
  decorateButtons(em);
  el.replaceChildren(foreground);

  link.addEventListener('click', (e) => handleClick(e, link));
}
