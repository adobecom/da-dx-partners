import { getConfig } from './utils.js';

const PARTNERSHIP_PROGRESS_API = 'https://partner-registration-stage.adobe.io/api/v1/dxp/partner/membership/level-requirements';

let dataPromise = null;

async function fetchPartnershipData() {
  const token = window.adobeIMS?.getAccessToken?.().token;
  if (!token) throw new Error('[partnershipDataService] Missing IMS access token');

  const { env } = getConfig();
  const url = env?.name === 'prod' ? PARTNERSHIP_PROGRESS_API.replace('-stage', '') : PARTNERSHIP_PROGRESS_API;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Api-Key': token,
    },
  });

  if (!res.ok) throw new Error(`[partnershipDataService] Fetch failed: ${res.status}`);
  return res.json();
}

// eslint-disable-next-line import/prefer-default-export
export function getPartnershipData() {
  if (!dataPromise) dataPromise = fetchPartnershipData();
  return dataPromise;
}
