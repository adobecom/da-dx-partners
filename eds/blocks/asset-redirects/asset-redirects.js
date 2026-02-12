import { DIGITALEXPERIENCE_PREVIEW_PATH } from '../utils/dxConstants.js';

export default async function init(el) {
  console.log('el', el);
  const currentAsset = window.location.origin + window.location.pathname;
  const redirectsMap = {};
  const assetRedirectRows = Array.from(el.children);

  assetRedirectRows.forEach((row) => {
    const cols = Array.from(row.children);
    const originalAssetURL = cols[0].innerText.trim().toLowerCase().replace(/ /g, '-');
    const redirectAssetURL = cols[1].textContent.trim();
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
    el.remove();
  });
console.log(Object.values(redirectsMap));
console.log(Object.keys(redirectsMap));

  if (Object.values(redirectsMap).some((href) => href === currentAsset)) {
    console.log('Skipping redirect to avoid redirect loop, since current url is already used in redirect column');
    return;
  }
  const redirectValue = Object.keys(redirectsMap).find((href) => href === currentAsset);
  if (redirectValue) window.location.replace(redirectValue);
}
