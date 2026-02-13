import { calculateRedirect } from './calculateRedirect.js';

/**
 * Extracts redirect rules from DOM element
 */
function extractRedirectRules(el) {
  const assetRedirectRows = Array.from(el.children);
  const redirectRules = [];

  for (const row of assetRedirectRows) {
    const cols = Array.from(row.children);
    const originalAssetURL = cols[0]?.innerText?.trim().replace(/ /g, '-');
    const redirectAssetURL = cols[1]?.innerText?.trim().replace(/ /g, '-');

    if (originalAssetURL && redirectAssetURL) {
      redirectRules.push([originalAssetURL, redirectAssetURL]);
    }
  }

  return redirectRules;
}

export default async function init(el) {
  const currentAssetPath = window.location.origin + window.location.pathname;
  const redirectRules = extractRedirectRules(el);
  const { redirectUrl, hasLoop } = calculateRedirect(currentAssetPath, redirectRules);

  el.remove();

  if (hasLoop) {
    console.log('Skipping redirect to avoid redirect loop');
    return;
  }

  if (redirectUrl) {
    window.location.replace(redirectUrl);
  }
}
