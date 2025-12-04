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

import {
  prodHosts,
  setLibs,
  preloadResources,
  redirectLoggedinPartner,
  updateNavigation,
  updateFooter, updateIMSConfig, PARTNER_LOGIN_QUERY, setFeedback
} from './utils.js';
import { applyPagePersonalization } from './personalization.js';
import { rewriteLinks } from './rewriteLinks.js';
import {partnerAgreement} from "./partnerAgreement.js";
import {portalMessaging} from "./portalMessaging.js";
// import PartnerNews  from '../blocks/partner-news/PartnerNews.js';

// Add project-wide style path here.
const STYLES = '/eds/styles/styles.css';

// Use 'https://milo.adobe.com/libs' if you cannot map '/libs' to milo's origin.
const LIBS = '/libs';

const isProd = prodHosts.includes(window.location.host);
// required for react-include component: react-app may need different ims client ids.
let imsClientId = document.querySelector(`meta[name=${isProd? 'ims_client_id' : 'ims_client_id_stage' }]`)?.content
imsClientId = imsClientId || (isProd ? 'MILO_PARTNERS_PROD' : 'MILO_PARTNERS_STAGE');

// Add any config options.
const CONFIG = {
  codeRoot: '/eds',
  contentRoot: '/eds/partners-shared',
  imsClientId,
  clientEnv: isProd ? 'prod' : null,
  // geoRouting: 'off',
  // fallbackRouting: 'off',
  locales: {
    '': { ietf: 'en-US', tk: 'hah7vzn.css' },
  },
  local: { edgeConfigId: '04688385-4eb5-41af-9875-91f21eea9a5e' },
  stage: { edgeConfigId: '04688385-4eb5-41af-9875-91f21eea9a5e' },
  prod: { },
};

(function removePartnerLoginQuery() {
  const url = new URL(window.location.href);
  const { searchParams } = url;
  if (searchParams.has(PARTNER_LOGIN_QUERY)) {
    searchParams.delete(PARTNER_LOGIN_QUERY);
    window.history.replaceState({}, '', url.toString());

    // reset portal messaging popup after login
    sessionStorage.removeItem('portal-messaging-popup-closed');
  }
}());

(function removeAccessToken() {
  window.location.hash = decodeURIComponent(window.location.hash);
  if (window.location.hash.startsWith('#access_token')) {
    window.location.hash = '';
  }
}());

// Load LCP image immediately
(function loadLCPImage() {
  const lcpImg = document.querySelector('img');
  lcpImg?.removeAttribute('loading');
}());

/*
 * ------------------------------------------------------------
 * Edit below at your own risk
 * ------------------------------------------------------------
 */

const miloLibs = setLibs(LIBS);

(function loadStyles() {
  const paths = [`${miloLibs}/styles/styles.css`];
  if (STYLES) { paths.push(STYLES); }
  paths.forEach((path) => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', path);
    document.head.appendChild(link);
  });
}());

function setUpPage() {
  updateNavigation();
  updateFooter();
}
async function loadPage() {
  applyPagePersonalization();
  setUpPage();
  redirectLoggedinPartner();
  updateIMSConfig();
  await preloadResources(CONFIG.locales, miloLibs);
  const { loadArea, setConfig, getConfig } = await import(`${miloLibs}/utils/utils.js`);

  setConfig({ ...CONFIG, miloLibs });
  await setFeedback(getConfig);
  await loadArea();
  applyPagePersonalization();
  rewriteLinks(document);
  const partnerAgreementDisplayed = await partnerAgreement(miloLibs);
  await portalMessaging(miloLibs, partnerAgreementDisplayed);
}
loadPage();

(async function loadDa() {
  if (!new URL(window.location.href).searchParams.get('dapreview')) return;
  // eslint-disable-next-line import/no-unresolved
  import('https://da.live/scripts/dapreview.js').then(({ default: daPreview }) => daPreview(loadPage));
}());
