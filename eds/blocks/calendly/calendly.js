
const DEFAULT_CALENDLY_LINK = 'https://calendly.com/d/ctvd-7ht-t6d/kd-adobe-digital-experience-partner-program-onboarding?hide_gdpr_banner=1';

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
  // addStyle('https://assets.calendly.com/assets/external/widget.css');

  return calendlyScriptPromise;
}

function getSchedulingLinkFromRow(row) {
  const columns = Array.from(row.children);
  if (columns.length < 2) return '';

  const key = columns[0].textContent.trim().toLowerCase().replace(/\s+/g, '-');
  if (key !== 'scheduling-link') return '';

  const authoredAnchor = columns[1].querySelector('a[href]');
  if (authoredAnchor) return authoredAnchor.href;

  return columns[1].textContent.trim();
}

function getCalendlyLink(el) {
  const rows = Array.from(el.children);
  const authoredRowLink = rows
    .map((row) => getSchedulingLinkFromRow(row))
    .find((value) => value);

  if (authoredRowLink) return authoredRowLink;

  const authoredAnchorLink = el.querySelector('a[href*="calendly.com"]')?.href;
  return authoredAnchorLink || DEFAULT_CALENDLY_LINK;
}

function initCalendly(link, parentElement) {
  window.Calendly.initInlineWidget({
    url: link,
    parentElement,
    resize: true,
  });
}

export default async function init(el) {
  const calendlyLink = getCalendlyLink(el);
  const calendlyEmbed = document.createElement('div');
  calendlyEmbed.className = 'calendly-embed';
  calendlyEmbed.setAttribute('style', 'min-width:320px;height:700px;');

  el.innerHTML = '';
  el.append(calendlyEmbed);

  try {
    await loadCalendlyScript();
    initCalendly(calendlyLink, calendlyEmbed);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Calendly widget failed to load', e);
  }
}
