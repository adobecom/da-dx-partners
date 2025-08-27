import {getLocale, prodHosts, setLibs} from '../../scripts/utils.js';
import { RT_SEARCH_ACTION_PATH } from './dxConstants.js';

const miloLibs = setLibs('/libs');

const { createTag, localizeLink, getConfig } = await import(`${miloLibs}/utils/utils.js`);

export { createTag, localizeLink, getConfig };
const { replaceText } = await import(`${miloLibs}/features/placeholders.js`);
export { replaceText };

export function populateLocalizedTextFromListItems(el, localizedText) {
  const liList = Array.from(el.querySelectorAll('li'));
  liList.forEach((liEl) => {
    const liInnerText = liEl.innerText;
    if (!liInnerText) return;
    let liContent = liInnerText.trim().toLowerCase().replace(/ /g, '-');
    if (liContent.endsWith('_default')) liContent = liContent.slice(0, -8);
    localizedText[`{{${liContent}}}`] = liContent;
  });
}
export async function localizationPromises(localizedText, config) {
  return Promise.all(Object.keys(localizedText).map(async (key) => {
    const value = await replaceText(key, config);
    if (value.length) {
      localizedText[key] = value;
    }
  }));
}

export function getRuntimeActionUrl(action) {
  const { env } = getConfig();
  let domain = 'https://io-partners-dx.stage.adobe.com';
  if (env.name === 'prod') {
    domain = 'https://io-partners-dx.adobe.com';
  }
  return new URL(
    `${domain}${action}`,
  );
}

export function generateRequestForSearchAPI(pageOptions, body) {
  const { locales } = getConfig();
  const url = getRuntimeActionUrl(RT_SEARCH_ACTION_PATH);
  const localesData = getLocale(locales);
  const queryParams = new URLSearchParams(url.search);
  queryParams.append('geo', localesData.prefix && localesData.region);
  queryParams.append('language', localesData.ietf);

  // eslint-disable-next-line array-callback-return
  Object.keys(pageOptions).map((option) => {
    queryParams.append(option, pageOptions[option]);
  });

  const headers = new Headers();
  headers.append('Content-Type', 'application/json');

  return fetch(url + queryParams, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    credentials: 'include',
  });
}

// eslint-disable-next-line class-methods-use-this
export function setDownloadParam(url) {
  try {
    if (!url) return '';
    const urlWithParam = new URL(url);
    urlWithParam.search = 'download';
    // eslint-disable-next-line consistent-return
    return urlWithParam;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Invalid URL provided:', url, error.message);
    return '';
  }
}
const PARTNERS_PREVIEW_DOMAIN = 'partnerspreview.adobe.com';
export const PARTNERS_STAGE_DOMAIN = 'partners.stage.adobe.com';
export const PARTNERS_PROD_DOMAIN = 'partners.adobe.com';

// eslint-disable-next-line class-methods-use-this
export function transformCardUrl(url) {
  if (!url) {
    // eslint-disable-next-line no-console
    console.error('URL is null or undefined');
    return '';
  }
  const isProd = prodHosts.includes(window.location.host);
  if(url.startsWith("/")){
    url = `https://${PARTNERS_STAGE_DOMAIN}${url}`;
  }
  const newUrl = new URL(url);
  newUrl.protocol = window.location.protocol;
  if(!newUrl.host || newUrl.host === PARTNERS_PREVIEW_DOMAIN || newUrl.host === PARTNERS_STAGE_DOMAIN|| newUrl.host === PARTNERS_PROD_DOMAIN ) {
    newUrl.host = isProd ? PARTNERS_PROD_DOMAIN : PARTNERS_STAGE_DOMAIN;
  }
  return newUrl;
}
