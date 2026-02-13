import { DIGITALEXPERIENCE_PREVIEW_PATH } from '../utils/dxConstants.js';

/**
 * Calculates the redirect URL based on the current URL and redirect rules
 * @param {string} currentAssetPath - The current full URL path (origin + pathname)
 * @param {Array<Array<string>>} redirectRules - Array of [originalURL, redirectURL] pairs
 * @returns {Object} - { redirectUrl: string | null, hasLoop: boolean }
 */
export function calculateRedirect(currentAssetPath, redirectRules) {
  const baseURL = new URL(currentAssetPath).origin + DIGITALEXPERIENCE_PREVIEW_PATH;
  let redirectValue = null;
  let hasLoop = false;

  for (const [originalAssetURL, redirectAssetURL] of redirectRules) {
    if (!originalAssetURL || !redirectAssetURL) continue;

    try {
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

  return { redirectUrl: redirectValue, hasLoop };
}

