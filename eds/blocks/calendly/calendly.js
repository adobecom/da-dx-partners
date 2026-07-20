import { updatePartnerAccountState } from '../../scripts/partnerStateUtils.js';

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
function initCalendly(link, parentElement) {
  window.Calendly.initInlineWidget({
    url: link,
    parentElement,
    resize: true,
  });
}
function setBlockData(tableRows) {
  const blockData = { schedulingLink: '' };
  Array.from(tableRows).forEach((row) => {
    const columns = row.children;
    if (getPropertyName(columns) === 'scheduling-link') {
      blockData.schedulingLink = getLinkValue(columns);
    }
  });
  return blockData;
}
export default async function init(el) {
  const { schedulingLink } = setBlockData(el.children);
  const calendlyEmbed = document.createElement('div');
  calendlyEmbed.className = 'calendly-embed';
  calendlyEmbed.setAttribute('style', 'min-width:320px;height:700px;');

  el.innerHTML = '';
  el.append(calendlyEmbed);

  try {
    await loadCalendlyScript();
    // todo if calendly link is invalid, it will show calendly not found page ... is that acceptable ?
    // validating url before init would affect performance
    initCalendly(schedulingLink, calendlyEmbed);
    window.addEventListener('message', trackCalendlyEvent);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Calendly widget failed to load', e);
  }
}
