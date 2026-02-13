import { DIGITALEXPERIENCE_PREVIEW_PATH } from '../utils/dxConstants.js';

export default async function init(el) {
  const currentAssetPath = window.location.origin + window.location.pathname;
  const baseURL = window.location.origin + DIGITALEXPERIENCE_PREVIEW_PATH;
  let redirectValue = null;
  let hasLoop = false;

  const assetRedirectRows = Array.from(el.children);

  for (const row of assetRedirectRows) {
    const cols = Array.from(row.children);
    const originalAssetURL = cols[0]?.innerText?.trim().toLowerCase().replace(/ /g, '-');
    const redirectAssetURL = cols[1]?.innerText?.trim().toLowerCase().replace(/ /g, '-');

    if (!originalAssetURL || !redirectAssetURL) continue;

    try {
      // Parse URLs without lowercasing (URLs are case-sensitive in paths)
      const tokensOriginal = originalAssetURL.split(DIGITALEXPERIENCE_PREVIEW_PATH);
      const pathnameOriginal = tokensOriginal[1];
      if (!pathnameOriginal) continue;

      const tokensRedirect = redirectAssetURL.split(DIGITALEXPERIENCE_PREVIEW_PATH);
      const pathnameRedirect = tokensRedirect[1];
      if (!pathnameRedirect) continue;

      const originalUrl = new URL(pathnameOriginal, baseURL).href;
      const redirectUrl = new URL(pathnameRedirect, baseURL).href;

      // Check for redirect match and loop prevention in same iteration
      if (originalUrl === currentAssetPath) {
        redirectValue = redirectUrl;
      }
      if (redirectUrl === currentAssetPath) {
        hasLoop = true;
        break; // Early exit if loop detected
      }
    } catch (error) {
      console.error('redirect url invalid:', originalAssetURL, redirectAssetURL);
    }
  }

  el.remove();

  if (hasLoop) {
    console.log('Skipping redirect to avoid redirect loop');
    return;
  }

  if (redirectValue) {
    window.location.replace(redirectValue);
  }
}
