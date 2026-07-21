import showToast from '../../components/Toast.js';
import { refreshPartnerAccountState, updatePartnerAccountState } from '../../scripts/partnerStateUtils.js';
import {
  getCurrentProgramType,
  getLibs,
  getPartnerAccountState,
  getPartnerCookieObject,
} from '../../scripts/utils.js';

const miloLibs = getLibs();
const { loadStyle } = await import(`${miloLibs}/utils/utils.js`);

const CALENDLY_RETRY_DELAY_MS = 200;

let calendlyScriptPromise;
let toastStyleLoaded = false;

const CALENDLY_ERROR_TOAST = { toastNegative: 'Unable to save your booking. Please contact support if the issue persists.' };

const CALENDLY_ALREADY_BOOKED_MESSAGE = 'Calendly already booked by another admin.';

const CALENDLY_DOUBLE_BOOKING_TOAST = { toastNegative: CALENDLY_ALREADY_BOOKED_MESSAGE };

const delay = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

function getCalendlyEventId(eventUri) {
  if (!eventUri || typeof eventUri !== 'string') return null;
  const match = eventUri.match(/scheduled_events\/([^/?]+)/);
  if (match) return match[1];
  if (!eventUri.includes('/')) return eventUri;
  return null;
}

function hasCalendlyBooked() {
  return !!getPartnerAccountState()?.calendly;
}

function showCalendlyBookedMessage(container) {
  container.classList.add('con-block');

  const foreground = document.createElement('div');
  foreground.className = 'foreground';

  const message = document.createElement('div');
  message.className = 'calendly-booked-message';
  message.textContent = CALENDLY_ALREADY_BOOKED_MESSAGE;

  foreground.append(message);
  container.append(foreground);
}

function loadCalendlyScript() {
  if (window.Calendly) return Promise.resolve();
  if (calendlyScriptPromise) return calendlyScriptPromise;

  calendlyScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });

  return calendlyScriptPromise;
}

async function ensureToastStyle() {
  if (toastStyleLoaded) return;
  await loadStyle('/eds/components/Toast.css');
  toastStyleLoaded = true;
}

function getPropertyName(columns) {
  return columns[0].textContent.trim().toLowerCase().replace(/\s+/g, '-');
}

function getLinkValue(columns) {
  const authoredAnchor = columns[1].querySelector('a[href]');
  if (authoredAnchor) return authoredAnchor.href;
  return columns[1].textContent.trim();
}

function isCalendlyEvent(e) {
  return e.origin === 'https://calendly.com' && e.data?.event?.startsWith('calendly.');
}

async function showCalendlyErrorToast() {
  await ensureToastStyle();
  showToast('calendly', false, null, CALENDLY_ERROR_TOAST);
}

async function showDoubleBookingToast() {
  await ensureToastStyle();
  showToast('calendly', false, null, CALENDLY_DOUBLE_BOOKING_TOAST);
}

async function updateCalendlyState(eventId, isRetry = false) {
  const result = await updatePartnerAccountState({ calendly: eventId });

  if (result.success) return;

  if (result.status === 400 || result.status === 409) {
    if (hasCalendlyBooked()) {
      await showDoubleBookingToast();
      return;
    }

    if (!isRetry) {
      await delay(CALENDLY_RETRY_DELAY_MS);
      await updateCalendlyState(eventId, true);
      return;
    }

    await showCalendlyErrorToast();
    return;
  }

  await showCalendlyErrorToast();
}

async function handleCalendlyStateUpdate(eventId) {
  if (hasCalendlyBooked()) {
    await showDoubleBookingToast();
    return;
  }
  await updateCalendlyState(eventId);
}

async function trackCalendlyEvent(e) {
  if (!isCalendlyEvent(e)) return;
  const { event, payload } = e.data;
  // eslint-disable-next-line no-console
  console.log('[Calendly]', event, payload);
  if (event === 'calendly.event_scheduled') {
    const eventId = getCalendlyEventId(payload?.event?.uri);
    if (eventId) {
      await handleCalendlyStateUpdate(eventId);
    }
  }
}

function getCalendlyPrefill(companyQuestionKey = 'a1') {
  const { firstName, lastName, email, accountName } = getPartnerCookieObject(
    getCurrentProgramType(),
  ) || {};
  const prefill = {};

  if (firstName) prefill.firstName = firstName;
  if (lastName) prefill.lastName = lastName;
  if (email) prefill.email = email;

  if (accountName && /^a(?:[1-9]|10)$/.test(companyQuestionKey)) {
    prefill.customAnswers = { [companyQuestionKey]: accountName };
  }

  return prefill;
}

function initCalendly(link, parentElement, companyQuestionKey) {
  const prefill = getCalendlyPrefill(companyQuestionKey);
  window.Calendly.initInlineWidget({
    url: link,
    parentElement,
    resize: true,
    ...(Object.keys(prefill).length && { prefill }),
  });
}

function setBlockData(tableRows) {
  const blockData = { schedulingLink: '', companyQuestionKey: 'a1' };
  Array.from(tableRows).forEach((row) => {
    const columns = row.children;
    const propertyName = getPropertyName(columns);
    if (propertyName === 'scheduling-link') {
      blockData.schedulingLink = getLinkValue(columns);
    }
    if (propertyName === 'company-question-key') {
      blockData.companyQuestionKey = columns[1].textContent.trim().toLowerCase();
    }
  });
  return blockData;
}
export default async function init(el) {
  const { schedulingLink, companyQuestionKey } = setBlockData(el.children);

  try {
    await loadStyle('/eds/blocks/calendly/calendly.css');
    await refreshPartnerAccountState();

    el.innerHTML = '';

    if (hasCalendlyBooked()) {
      showCalendlyBookedMessage(el);
      return;
    }

    const calendlyEmbed = document.createElement('div');
    calendlyEmbed.className = 'calendly-embed';

    el.classList.add('con-block');
    const foreground = document.createElement('div');
    foreground.className = 'foreground';
    foreground.append(calendlyEmbed);
    el.append(foreground);

    await loadCalendlyScript();
    initCalendly(schedulingLink, calendlyEmbed, companyQuestionKey);
    window.addEventListener('message', trackCalendlyEvent);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Calendly widget failed to load', e);
  }
}
