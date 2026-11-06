import { getLocale, prodHosts, setLibs } from '../../scripts/utils.js';
import { RT_SEARCH_ACTION_PATH } from './dxConstants.js';

const miloLibs = setLibs('/libs');

const { createTag, localizeLink, getConfig } = await import(`${miloLibs}/utils/utils.js`);

export { createTag, localizeLink, getConfig };
const { replaceText } = await import(`${miloLibs}/features/placeholders.js`);
export { replaceText };

/**
 * TODO: This method will be deprecated and removed in a future version.
 * @see https://jira.corp.adobe.com/browse/MWPW-173470
 * @see https://jira.corp.adobe.com/browse/MWPW-174411
 */
export const shouldAllowKrTrial = (button, localePrefix) => {
  const allowKrTrialHash = '#_allow-kr-trial';
  const hasAllowKrTrial = button.href?.includes(allowKrTrialHash);
  if (hasAllowKrTrial) {
    button.href = button.href.replace(allowKrTrialHash, '');
    const modalHash = button.getAttribute('data-modal-hash');
    if (modalHash) button.setAttribute('data-modal-hash', modalHash.replace(allowKrTrialHash, ''));
  }
  return localePrefix === '/kr' && hasAllowKrTrial;
};

/**
 * TODO: This method will be deprecated and removed in a future version.
 * @see https://jira.corp.adobe.com/browse/MWPW-173470
 * @see https://jira.corp.adobe.com/browse/MWPW-174411
 */

export const shouldBlockFreeTrialLinks = ({ button, localePrefix, parent }) => {
  if (shouldAllowKrTrial(button, localePrefix) || localePrefix !== '/kr'
    || (!button.dataset?.modalPath?.includes('/kr/cc-shared/fragments/trial-modals')
      && !['free-trial', 'free trial', '무료 체험판', '무료 체험하기', '{{try-for-free}}']
        .some((pattern) => button.textContent?.toLowerCase()?.includes(pattern.toLowerCase())))) {
    return false;
  }

  if (button.dataset.wcsOsi) {
    button.classList.add('hidden-osi-trial-link');
    return false;
  }

  const elementToRemove = (parent?.tagName === 'STRONG' || parent?.tagName === 'EM') && parent?.children?.length === 1 ? parent : button;
  elementToRemove.remove();
  return true;
};

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
    const originalValue = localizedText[key];
    const replacedValue = await replaceText(key, config);

    // Only replace if we got a meaningful result that's not just lowercase of the original
    if (replacedValue.length && replacedValue !== originalValue.toLowerCase()) {
      localizedText[key] = replacedValue;
    }
  }));
}

export function getRuntimeActionUrl(action) {
  const isProdURL = prodHosts.includes(window.location.host);
  const domain = isProdURL ? 'https://partners.adobe.com' : 'https://partners.stage.adobe.com';
  return new URL(
    `${domain}${action}`,
  );
}

export function generateRequestForSearchAPI(pageOptions, body) {
  const { locales } = getConfig();
  const url = getRuntimeActionUrl(RT_SEARCH_ACTION_PATH);
  const localesData = getLocale(locales);
  const queryParams = new URLSearchParams(url.search);
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
  });
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
  const isProdURL = prodHosts.includes(window.location.host);
  const resolvedUrl = url.startsWith('/') ? `https://${PARTNERS_STAGE_DOMAIN}${url}` : url;
  const newUrl = new URL(resolvedUrl);

  newUrl.protocol = window.location.protocol;
  if (!newUrl.host || newUrl.host === PARTNERS_PREVIEW_DOMAIN
    || newUrl.host === PARTNERS_STAGE_DOMAIN
    || newUrl.host === PARTNERS_PROD_DOMAIN) {
    newUrl.host = isProdURL ? PARTNERS_PROD_DOMAIN : PARTNERS_STAGE_DOMAIN;
  }
  return newUrl;
}
export function isProd() {
  return prodHosts.includes(window.location.host);
}

export function keepInlineFragmentInDOM(tableRows, blockElement, fragmentRowTitle, hide = true) {
  tableRows.forEach((row) => {
    const cols = Array.from(row.children);
    const rowTitle = cols[0].innerText.trim().toLowerCase().replace(/ /g, '-');
    const colsContent = cols.slice(1);
    if (rowTitle === fragmentRowTitle) {
      const inlineXfContent = document.createElement('div');
      inlineXfContent.append(...colsContent[0].childNodes);

      inlineXfContent.style.display = hide ? 'none' : 'block';
      inlineXfContent.id = fragmentRowTitle;
      blockElement.appendChild(inlineXfContent);
    }
  });
}

// eslint-disable-next-line func-names
const wait = function (delay) {
  // eslint-disable-next-line arrow-parens
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
};

// Polls a function until a specified condition is met or maximum attempts are exceeded
async function poll(fn, condition, interval = 2000, maxAttempts = 60) {
  let attempts = 0;
  let result = await fn();
  while (!condition(result)) {
    // eslint-disable-next-line no-plusplus
    if (++attempts >= maxAttempts) {
      throw new Error(`Polling exceeded maximum number of (${maxAttempts}) attempts.`);
    }
    // eslint-disable-next-line no-await-in-loop
    await wait(interval);
    // eslint-disable-next-line no-await-in-loop
    result = await fn();
  }
  return result;
}

export async function sidekickListener() {
  const deps = await Promise.all([
    import(`${miloLibs}/features/spectrum-web-components/dist/toast.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/theme.js`),
  ]);
  await deps;

  const initSidekickListener = async () => {
    try {
      const sidekick = await poll(
        () => Promise.resolve(document.querySelector('aem-sidekick, helix-sidekick')),
        (el) => el !== null,
        500,
        20,
      );
      // eslint-disable-next-line no-use-before-define
      sidekick.addEventListener('custom:unpublishfromcaas', () => unpublishFromSites(false), { once: true });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Sidekick not found within timeout.', error);
    }
  };

  // eslint-disable-next-line arrow-body-style
  const showToast = async (messages, variant = 'info') => {
    return new Promise((resolve) => {
      const header = document.querySelector('header');
      const theme = document.createElement('sp-theme');
      theme.setAttribute('theme', 'spectrum');
      theme.setAttribute('color', 'light');
      theme.setAttribute('scale', 'medium');

      const toast = document.createElement('sp-toast');
      toast.variant = variant;
      toast.open = true;
      toast.dismissible = true;
      toast.setAttribute('style', 'min-width: 90%');
      // if message contains url make them <a> element
      messages.forEach((msg) => {
        if (typeof msg === 'string' && msg.startsWith('http')) {
          const linkElem = document.createElement('a');
          // if message element contains card url and id make href be just card url
          linkElem.href = msg.split(':').length > 2 ? `${msg.split(':')[0]}:${msg.split(':')[1]}` : msg;
          linkElem.textContent = msg;
          linkElem.target = '_blank';
          linkElem.rel = 'noopener noreferrer';
          linkElem.style.display = 'block';
          linkElem.style.color = 'white';
          toast.append(linkElem);
        } else {
          const divElem = document.createElement('div');
          divElem.textContent = msg;
          toast.append(divElem);
        }
      });

      theme.appendChild(toast);
      header.appendChild(theme);

      customElements.whenDefined('sp-toast').then(() => {
        requestAnimationFrame(() => {
          const shadow = toast.shadowRoot;
          if (shadow) {
            const contentEl = shadow.querySelector('.content');
            if (contentEl) {
              contentEl.style.setProperty('word-break', 'break-word');
              contentEl.style.setProperty('overflow-x', 'hidden');
              contentEl.style.setProperty('max-height', '500px');
            }
          }
        });
      });

      const cleanup = () => {
        initSidekickListener();
        toast.removeEventListener('close', cleanup);
        theme.remove();
        resolve();
      };

      toast.addEventListener('close', cleanup);
    });
  };

  const isUserAdobeSignIn = () => {
    if (!window.adobeIMS.isSignedInUser()) {
      showToast(
        ['You are not logged in with an Adobe ID. Redirecting to login, please try the Sidekick action again after signing in with your @adobe.com account.'],
        'info',
      );
      window.setTimeout(() => {
        window.adobeIMS.adobeIdData.redirect_uri = window.location.href;
        window.adobeIMS.signIn();
      }, 1000);
      return false;
    }
    return true;
  };

  const headers = new Headers();
  headers.append('Accept', 'application/json');
  headers.append('Content-Type', 'application/json');

  const unpublishFromSites = async (allSites) => {
    try {
      if (!isUserAdobeSignIn()) return;
      showToast(['Starting the CaaS unpublishing process'], 'info');

      const unpublishHeaders = new Headers(headers);
      unpublishHeaders.set('Authorization', window.adobeIMS.getAccessToken().token);
      const url = getRuntimeActionUrl('/api/v1/web/dx-partners-runtime-tooling/unpublish-cards-from-caas', 'tooling');
      const response = await fetch(url, {
        method: 'POST',
        headers: unpublishHeaders,
        body: JSON.stringify({ cardPath: window.location.pathname, allSites }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // eslint-disable-next-line no-console
        console.error('CaaS Unpublish Failed:', response.status, errorText);
        await showToast([`CaaS unpublishing failed: ${errorText}`], 'negative');
        return;
      }

      const { successfulIds, errors } = await response.json();
      const messages = ['Unpublish from CaaS:', 'The card was successfully unpublished:', ...successfulIds];
      if (errors.length > 0) {
        messages.push('The following errors occurred:', ...errors);
      }
      const errorVariant = successfulIds.length > 0 ? 'info' : 'negative';
      const variant = errors.length > 0 ? errorVariant : 'positive';
      await showToast(messages, variant);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unexpected Error:', error);
      await showToast([`Unexpected error: ${error.message || error}`], 'negative');
    }
  };

  await initSidekickListener();
}
