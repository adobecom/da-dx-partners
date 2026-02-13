import { DIGITALEXPERIENCE_PREVIEW_PATH } from '../utils/dxConstants.js';

export default async function init(el) {
  const currentAssetPath = window.location.origin + window.location.pathname;
  const redirectsMap = {};
  const assetRedirectRows = Array.from(el.children);

  assetRedirectRows.forEach((row) => {
    const cols = Array.from(row.children);
    const originalAssetURL = cols[0]?.innerText.trim().toLowerCase().replace(/ /g, '-');
    const redirectAssetURL = cols[1]?.innerText.trim().toLowerCase().replace(/ /g, '-');
    try {
      const baseURl = window.location.origin + DIGITALEXPERIENCE_PREVIEW_PATH;

      const tokensOriginal = originalAssetURL.split(DIGITALEXPERIENCE_PREVIEW_PATH);
      const pathnameOriginal = tokensOriginal[1];
      const originalUrl = new URL(pathnameOriginal, baseURl);

      const tokensRedirect = redirectAssetURL.split(DIGITALEXPERIENCE_PREVIEW_PATH);
      const pathnameRedirect = tokensRedirect[1];
      const redirectUrl = new URL(pathnameRedirect, baseURl);
      redirectsMap[originalUrl] = redirectUrl;
    } catch (error) {
      console.error('redirect url invalid:', originalAssetURL, redirectAssetURL);
    }
  });
  el.remove();
  if (Object.values(redirectsMap).some((href) => href === currentAssetPath)) {
    console.log('Skipping redirect to avoid redirect loop');
    return;
  }
  const redirectKey = Object.keys(redirectsMap).find((href) => href === currentAssetPath);
  const redirectValue = redirectsMap[redirectKey];
  if (redirectValue) window.location.replace(redirectValue);
}
