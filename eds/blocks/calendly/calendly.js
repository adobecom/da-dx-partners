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
    initCalendly(schedulingLink, calendlyEmbed);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Calendly widget failed to load', e);
  }
}
