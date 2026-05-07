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
function trackCalendlyEvent(e) {
  if (!isCalendlyEvent(e)) return;
  const { event, payload } = e.data;
  // send to analytics here
  console.log('[Calendly]', event, payload);
  // todo send req to runtime to update crm data that event is scheduled, example:
  // Calendly Event: calendly.event_scheduled
  //
  // {
  //   "event": {
  //   "uri": "https://api.calendly.com/scheduled_events/ef8c7e60-6055-407b-9f29-c5436dcf3285"
  // },
  //   "invitee": {
  //   "uri": "https://api.calendly.com/scheduled_events/ef8c7e60-6055-407b-9f29-c5436dcf3285/invitees/7cf8da55-9460-4509-b56a-24cd9cb30ad1"
  // }
  // }
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
