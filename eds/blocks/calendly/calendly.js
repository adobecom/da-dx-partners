import { updatePartnerAccountState } from '../../scripts/partnerStateUtils.js';
import { getCurrentProgramType, getPartnerCookieObject } from '../../scripts/utils.js';

let calendlyScriptPromise;

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
async function trackCalendlyEvent(e) {
  if (!isCalendlyEvent(e)) return;
  const { event, payload } = e.data;
  // send to analytics here
  console.log('[Calendly]', event, payload);
  if (event === 'calendly.event_scheduled') {
    await updatePartnerAccountState({
      calendly: payload?.event?.uri || 'scheduled',
    });
  }
}
function getCalendlyPrefill(companyQuestionKey = 'a1') {
  const { firstName, lastName, email, accountName } = getPartnerCookieObject(getCurrentProgramType()) || {};
  const prefill = {};

  if (firstName) {
    prefill.firstName = firstName;
  }
  if (lastName) {
    prefill.lastName = lastName;
  }

  if (email) {
    prefill.email = email;
  };

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
  const calendlyEmbed = document.createElement('div');
  calendlyEmbed.className = 'calendly-embed';
  calendlyEmbed.setAttribute('style', 'min-width:320px;height:700px;');

  el.innerHTML = '';
  el.append(calendlyEmbed);

  try {
    await loadCalendlyScript();
    // validating url before init would affect performance
    initCalendly(schedulingLink, calendlyEmbed, companyQuestionKey);
    window.addEventListener('message', trackCalendlyEvent);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Calendly widget failed to load', e);
  }
}
