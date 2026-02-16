import { DIGITALEXPERIENCE_PREVIEW_PATH } from '../utils/dxConstants.js';

function getFqUrl(url) {
  return url.startsWith('http') ? url : window.location.origin + url;
}

/**
 * Calculates the redirect URL based on the current URL (window.location) and redirect rules
 * @param {Array<Array<string>>} redirectRules - Array of [originalURL, redirectURL] pairs
 * @returns {URL|null} - Redirect URL, or null if no match or redirect would loop
 */
export function calculateRedirect(redirectRules) {

  for (const [originalAssetURL, redirectAssetURL] of redirectRules) {
    if (!originalAssetURL || !redirectAssetURL) continue;

    const fqRedirectSource = getFqUrl(originalAssetURL);
    const fqRedirectTarget = getFqUrl(redirectAssetURL);


    try {
      const originalUrl = new URL(fqRedirectSource);
      const redirectUrl = new URL(fqRedirectTarget);

      // Check for redirect match and loop prevention in same iteration
      if (originalUrl.origin === window.location.origin && originalUrl.pathname === window.location.pathname) {
        //check if the target is the same as the current URL
        if (!(redirectUrl.origin === window.location.origin && redirectUrl.pathname === window.location.pathname)) {
          return redirectUrl;
        }
      }
    } catch (error) {
      console.error('redirect url invalid:', originalAssetURL, redirectAssetURL);
    }
  }
  return null;
}

