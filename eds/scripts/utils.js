/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const PARTNER_ERROR_REDIRECTS_COUNT_COOKIE = 'partner_redirects_count';
const MAX_PARTNER_ERROR_REDIRECTS_COUNT = 3;
export const PARTNER_LOGIN_QUERY = 'partnerLogin';
export const CAAS_TAGS_URL = 'https://www.adobe.com/chimera-api/tags';
/**
 * The decision engine for where to get Milo's libs from.
 */
export const [setLibs, getLibs] = (() => {
  let libs;
  return [
    (prodLibs, location) => {
      libs = (() => {
        const { hostname, search, origin } = location || window.location;
        if (origin.endsWith('adobe.com')) {
          return origin + prodLibs;
        }
        const partnerBranch = hostname.startsWith('main') ? 'main' : 'stage';
        const branch = new URLSearchParams(search).get('milolibs') || partnerBranch;
        if (branch === 'local') return 'http://localhost:6456/libs';
        return branch.includes('--') ? `https://${branch}.aem.live/libs` : `https://${branch}--milo--adobecom.aem.live/libs`;
      })();
      return libs;
    }, () => libs,
  ];
})();

export const prodHosts = [
  'main--dx-partners--adobecom.aem.page',
  'main--dx-partners--adobecom.aem.live',
  'partners.adobe.com',
];

/*
 * ------------------------------------------------------------
 * Edit above at your own risk.
 *
 * Note: This file should have no self-invoking functions.
 * ------------------------------------------------------------
 */
export function formatDate(cardDate, locale = 'en-US') {
  if (!cardDate) return;

  const dateObject = new Date(cardDate);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  const formattedDate = dateObject.toLocaleString(locale, options);
  // eslint-disable-next-line consistent-return
  return formattedDate;
}

export function getLocale(locales, pathname = window.location.pathname) {
  if (!locales) {
    return { ietf: 'en-US', tk: 'hah7vzn.css', prefix: '' };
  }
  const LANGSTORE = 'langstore';
  const split = pathname.split('/');
  const localeString = split[1];
  const locale = locales[localeString] || locales[''];
  if (localeString === LANGSTORE) {
    locale.prefix = `/${localeString}/${split[2]}`;
    if (
      Object.values(locales)
        .find((loc) => loc.ietf?.startsWith(split[2]))?.dir === 'rtl'
    ) locale.dir = 'rtl';
    return locale;
  }
  const isUS = locale.ietf === 'en-US';
  locale.prefix = isUS ? '' : `/${localeString}`;
  locale.region = isUS ? 'us' : localeString.split('_')[0];
  return locale;
}

function preload(url) {
  const preloadLink = document.createElement('link');
  preloadLink.rel = 'preload';
  preloadLink.as = 'fetch';
  preloadLink.crossOrigin = true;
  preloadLink.href = url;
  document.head.appendChild(preloadLink);
}

function preloadPlaceholders(locale) {
  const placeholderUrl = `${locale.prefix}/eds/partners-shared/placeholders.json`;
  preload(placeholderUrl);
}

function preloadLit(miloLibs) {
  const preloadLink = document.createElement('link');
  preloadLink.rel = 'modulepreload';
  preloadLink.crossOrigin = true;
  preloadLink.href = `${miloLibs}/deps/lit-all.min.js`;
  document.head.appendChild(preloadLink);
}

export function getProgramType(path) {
  switch (true) {
    case /\/(solutionpartners|eds|directory|join|self-service-forms\/definition)\//.test(path) || /^\/(directory|join|)$/.test(path): return 'spp';
    case /technologypartners/.test(path): return 'tpp';
    case /channelpartners/.test(path): return 'cpp';
    case /digitalexperience/.test(path): return 'dx';
    case /channelpartnerassets/.test(path): return 'cpp';
    default: return '';
  }
}

export function getProgramHomePage(path) {
  const programType = getProgramType(path);
  switch (programType) {
    case 'spp':
      return '/solutionpartners/';
    case 'tpp':
      return '/technologypartners/';
    case 'dx':
      return '/digitalexperience/';
    case 'cpp':
      return '/channelpartners/';
    default:
      return '';
  }
}

export function getCurrentProgramType() {
  return getProgramType(window.location.pathname);
}
export function getCookieValue(key) {
  const cookies = document.cookie.split(';').map((cookie) => cookie.trim());
  const cookie = cookies.find((el) => el.startsWith(`${key}=`));
  return cookie?.substring((`${key}=`).length);
}
export function getPartnerDataCookieValue(programType, key) {
  try {
    const partnerDataCookie = getCookieValue('partner_data');
    if (!partnerDataCookie) return;
    const partnerDataObj = JSON.parse(decodeURIComponent(partnerDataCookie.toLowerCase()));
    const portalData = partnerDataObj?.[programType];
    // eslint-disable-next-line consistent-return
    return portalData?.[key];
  } catch (error) {
    console.error('Error parsing partner data object:', error);
    // eslint-disable-next-line consistent-return
    return '';
  }
}

function extractTableCollectionTags(el) {
  let tableCollectionTags = [];
  Array.from(el.children).forEach((row) => {
    const cols = Array.from(row.children);
    const rowTitle = cols[0].textContent.trim().toLowerCase().replace(/ /g, '-');
    const colsContent = cols.slice(1);
    if (rowTitle === 'collection-tags') {
      const [collectionTagsEl] = colsContent;
      const collectionTags = Array.from(collectionTagsEl.querySelectorAll('li'), (li) =>
        li.textContent ? `"${li.textContent.trim().toLowerCase()}"` : ''
      );
      tableCollectionTags.push(collectionTags)
    }
  });

  return tableCollectionTags;
}

function getPartnerLevelParams(portal) {
  const partnerLevel = getPartnerDataCookieValue(portal, 'level');
  const partnerTagBase = `"caas:adobe-partners/${portal}/partner-level/`;
  return partnerLevel ? `(${partnerTagBase}${partnerLevel}"+OR+${partnerTagBase}public")` : `(${partnerTagBase}public")`;
}

function checkForQaContent(el) {
  if (!el.children) return false;

  // Iterating backward because we expect 'qa-content' to be in the last rows.
  // eslint-disable-next-line no-plusplus
  for (let i = el.children.length - 1; i >= 0; i--) {
    const row = el.children[i];

    const rowTitle = row.children[0]?.innerText?.trim().toLowerCase().replace(/ /g, '-');
    if (rowTitle?.includes('qa-content')) {
      return true;
    }
  }

  return false;
}

function getComplexQueryParams(el) {
  const tableTags = extractTableCollectionTags(el);

  const groupedTagExpressions = tableTags
    .filter(group => group.length)
    .map(group => `(${group.join('+AND+')})`);

  if (!groupedTagExpressions.length) return;

  const fullQuery = `(${groupedTagExpressions.join('+OR+')})`;

  const qaContentTag = '"caas:adobe-partners/qa-content"';
  let resultStr = fullQuery;
  if (!checkForQaContent(el)) {
    resultStr += `+NOT+${qaContentTag}`;
  }

  const partnerLevelParams = getPartnerLevelParams('spp');
  if (partnerLevelParams) resultStr += `+AND+${partnerLevelParams}`;

  return resultStr;
}

export function getPartnerDataCookieObject(programType) {
  const partnerDataCookie = getCookieValue('partner_data');
  if (!partnerDataCookie) return {};
  const partnerDataObj = JSON.parse(decodeURIComponent(partnerDataCookie));
  const portalData = partnerDataObj?.[programType.toUpperCase()] ?? {};
  return portalData;
}

export function hasSalesCenterAccess() {
  const { salesCenterAccess } = getPartnerDataCookieObject(getCurrentProgramType());
  return !!salesCenterAccess;
}

export function isAdminUser() {
  const { isAdmin } = getPartnerDataCookieObject(getCurrentProgramType());
  return !!isAdmin;
}

export function isPartnerNewlyRegistered() {
  if (!isMember()) return false;
  const programType = getCurrentProgramType();

  const accountCreated = getPartnerDataCookieValue(programType, 'createddate');
  if (!accountCreated) return;

  const accountCreatedDate = new Date(accountCreated);
  const now = new Date();

  const differenceInMilliseconds = now - accountCreatedDate;
  const differenceInDays = Math.abs(differenceInMilliseconds) / (1000 * 60 * 60 * 24);

  return differenceInMilliseconds > 0 && differenceInDays < 31;
}

export function isRenew() {
  const programType = getCurrentProgramType();

  const primaryContact = getPartnerDataCookieValue(programType, 'primarycontact');
  if (!primaryContact) return;

  const partnerLevel = getPartnerDataCookieValue(programType, 'level');
  if (partnerLevel !== 'gold' && partnerLevel !== 'registered' && partnerLevel !== 'certified') return;

  const accountExpiration = getPartnerDataCookieValue(programType, 'accountanniversary');
  if (!accountExpiration) return;

  const expirationDate = new Date(accountExpiration);
  const now = new Date();

  let accountStatus;
  let daysNum;

  const differenceInMilliseconds = expirationDate - now;
  const differenceInDays = Math.abs(differenceInMilliseconds) / (1000 * 60 * 60 * 24);
  const differenceInDaysRounded = Math.floor(differenceInDays);

  if (differenceInMilliseconds > 0 && differenceInDays < 31) {
    accountStatus = 'expired';
    daysNum = differenceInDaysRounded;
  } else if (differenceInMilliseconds < 0 && differenceInDays <= 90) {
    accountStatus = 'suspended';
    daysNum = 90 - differenceInDaysRounded;
  } else {
    return;
  }
  // eslint-disable-next-line consistent-return
  return { accountStatus, daysNum };
}

export function isMember() {
  const { status } = getPartnerDataCookieObject(getCurrentProgramType());
  return status === 'MEMBER';
}

export function partnerIsSignedIn() {
  return getCookieValue('partner_data');
}

export function signedInNonMember() {
  return partnerIsSignedIn() && !isMember();
}

function getProgramTypeStatus() {
  const isSPP = getPartnerDataCookieValue('spp', 'status') === 'member';
  const isTPP = getPartnerDataCookieValue('tpp', 'status') === 'member';
  return { isSPP, isTPP };
}

const { isSPP, isTPP } = getProgramTypeStatus();

export const isSPPOnly = () => isSPP && !isTPP;
export const isTPPOnly = () => !isSPP && isTPP;
export const isSPPandTPP = () => isSPP && isTPP;

export function getNodesByXPath(query, context = document) {
  const nodes = [];
  if (!context) {
    return nodes;
  }
  const xpathResult = document.evaluate(query, context, null, XPathResult.ANY_TYPE);
  let current = xpathResult?.iterateNext();
  while (current) {
    nodes.push(current);
    current = xpathResult.iterateNext();
  }
  return nodes;
}

export function deleteCookieValue(key) {
  document.cookie = `${key}=; Path=/; Max-Age=0;`;
}

export function getMetadataContent(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content;
}

export function redirectLoggedinPartner() {
  if (!isMember()) return;
  const partnerErrorRedirectsCount = getCookieValue(PARTNER_ERROR_REDIRECTS_COUNT_COOKIE);
  if (partnerErrorRedirectsCount) {
    const count = Number(partnerErrorRedirectsCount);
    if (count && Number.isInteger(count) && count >= MAX_PARTNER_ERROR_REDIRECTS_COUNT) {
      deleteCookieValue(PARTNER_ERROR_REDIRECTS_COUNT_COOKIE);
      return;
    }
  }
  const target = getMetadataContent('adobe-target-after-login');
  if (!target || target === 'NONE') return;
  document.body.style.display = 'none';
  window.location.assign(target);
}
export function updateIMSConfig() {
  const isSignedIn = partnerIsSignedIn();
  const imsReady = setInterval(() => {
    if (!window.adobeIMS) return;
    if (isSignedIn && !window.adobeIMS.isSignedInUser()) return;
    clearInterval(imsReady);
    let target;
    const partnerLogin = !window.adobeIMS.isSignedInUser();
    if (partnerLogin) {
      target = getMetadataContent('adobe-target-after-login');
    } else {
      target = getMetadataContent('adobe-target-after-logout') ?? getProgramHomePage(window.location.pathname);
    }

    const targetUrl = new URL(window.location.href);
    // eslint-disable-next-line chai-friendly/no-unused-expressions
    partnerLogin && targetUrl.searchParams.set(PARTNER_LOGIN_QUERY, true);
    if (target && target !== 'NONE') {
      targetUrl.pathname = target;

      if (!partnerLogin) {
        targetUrl.search = '';
      }
    }

    window.adobeIMS.adobeIdData.redirect_uri = targetUrl.toString();
  }, 500);
}

export function getMetadata(name) {
  return document.querySelector(`meta[name="${name}"]`);
}

function setApiParams(api, block) {
  const { el, collectionTag, ietf } = block;
  const complexQueryParams = getComplexQueryParams(el, collectionTag);
  if (complexQueryParams) api.searchParams.set('complexQuery', complexQueryParams);

  const [language, country] = ietf.split('-');
  if (language && country) {
    api.searchParams.set('language', language);
    api.searchParams.set('country', country);
  }

  return api.toString();
}

export function getCaasUrl(block) {
  const useStageCaasEndpoint = block.name === 'knowledge-base-overview';
  const domain = `${(useStageCaasEndpoint && !prodHosts.includes(window.location.host)) ? 'https://14257-chimera-stage.adobeioruntime.net/api/v1/web/chimera-0.0.1' : 'https://www.adobe.com/chimera-api'}`;
  const api = new URL(`${domain}/collection?originSelection=dx-partners&draft=false&flatFile=false&expanded=true`);
  return setApiParams(api, block);
}

export async function preloadResources(locales, miloLibs) {
  const locale = getLocale(locales);
  const cardBlocks = {
    // 'partner-news': '"caas:adobe-partners/collections/news"',
    // 'knowledge-base-overview': '"caas:adobe-partners/collections/knowledge-base"',
    'dx-card-collection': '"caas:adobe-partners/collections/news"',
  };
  // since we are going to add search-full later
  // adding this code update now to prevent being forgotten since in search
  // block we are not aware of this logic
  const blockWithPlaceholders = ['search-full'];
  let isPreloadCalled = false;
  blockWithPlaceholders.forEach(async (item) => {
    const el = document.querySelector(`.${item}`);
    if (!el) return;
    if (!isPreloadCalled) {
      preloadPlaceholders(locale);
      isPreloadCalled = true;
    }
  });

  Object.entries(cardBlocks).forEach(async ([key, value]) => {
    const el = document.querySelector(`.${key}`);
    if (!el) return;

    preloadPlaceholders(locale);
    preloadLit(miloLibs);

    const block = {
      el,
      name: key,
      collectionTag: value,
      ietf: locale.ietf,
    };
    const caasUrl = getCaasUrl(block);
    preload(caasUrl);
    preload(CAAS_TAGS_URL);
  });
}

export async function getRenewBanner(getConfig) {
  const renew = isRenew();
  if (!renew) return;
  const { accountStatus, daysNum } = renew;
  const bannerFragments = {
    expired: 'banner-account-expires',
    suspended: 'banner-account-suspended',
  };
  const metadataKey = bannerFragments[accountStatus];

  const config = getConfig();
  const { prefix } = config.locale;
  const defaultPath = `${prefix}/edsdme/partners-shared/fragments/${metadataKey}`;
  const path = getMetadataContent(metadataKey) ?? defaultPath;
  const url = new URL(path, window.location.origin);

  try {
    const response = await fetch(`${url}.plain.html`);
    if (!response.ok) throw new Error(`Network response was not ok ${response.statusText}`);

    const data = await response.text();
    const componentData = data.replace('$daysNum', daysNum);
    const parser = new DOMParser();
    const doc = parser.parseFromString(componentData, 'text/html');
    const block = doc.querySelector('.notification');

    const div = document.createElement('div');
    div.appendChild(block);

    const main = document.querySelector('main');
    if (main) main.insertBefore(div, main.firstChild);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There has been a problem with your fetch operation:', error);
    // eslint-disable-next-line consistent-return
    return null;
  }
}

export function updateNavigation() {
  const gnavMeta = getMetadata('gnav-source');
  if (!gnavMeta) return;
  let { content } = gnavMeta;
  const programTypeStatus = getProgramTypeStatus();
  if (programTypeStatus.isSPP || programTypeStatus.isTPP) {
    content = getMetadataContent('gnav-loggedin-source') ?? '/eds/partners-shared/dx-loggedin-gnav';
  }
  gnavMeta.content = content;
}

export function updateFooter() {
  const footerMeta = getMetadata('footer-source');
  if (!footerMeta) return;
  let { content } = footerMeta;
  const programTypeStatus = getProgramTypeStatus();
  if (programTypeStatus.isSPP || programTypeStatus.isTPP) {
    content = getMetadataContent('footer-loggedin-source') ?? '/eds/partners-shared/dx-loggedin-footer';
  }
  footerMeta.content = content;
}
