import { getConfig } from '../blocks/utils/utils.js';
import { prodHosts } from './utils.js';

/**
 * Domain configs where the key is the production domain,
 * and the value is config object for it.
 */
const domainConfigs = {
  'partners.adobe.com': { stage: { domain: 'partners.stage.adobe.com' } },
  'solutionpartners.adobe.com': { stage: { domain: 'solutionpartners.stage2.adobe.com' } },
  'exchange.adobe.com': { stage: { domain: 'stage.exchange.adobe.com' } },
  'cbconnection.adobe.com': { stage: { domain: 'cbconnection-stage.adobe.com' } },
};

/**
 * Rewrite a link href domain based on production to stage domain mappings.
 * As well as the pathname if pathname mappings are defined and there's a match.
 * @param {URL} url - The URL object to be modified.
 * Modifies URL href, or the original if the environment is prod,
 * there was a problem processing, or there is no domain mapping defined for it.
 */
export function rewriteUrlOnNonProd(url) {
  const { env, codeRoot } = getConfig();
  const codeRootUrl = new URL(codeRoot);

  if (env.name === 'prod' || prodHosts.includes(codeRootUrl.host)) return;

  const stagePathMappings = domainConfigs[url.hostname]?.stage?.pathMappings;

  if (stagePathMappings && Object.keys(stagePathMappings).length) {
    Object.entries(stagePathMappings).forEach(([key, value]) => {
      if (url.pathname === key) {
        url.pathname = value;
      }
    });
  }

  const stageDomain = domainConfigs[url.hostname]?.stage?.domain;

  if (stageDomain) {
    url.hostname = stageDomain;
  }
}

/**
 * Takes string that represent url href,
 * updates locale, login path and domain
 * @param href
 * @returns {*|string} modified href
 */
export function getUpdatedHref(href) {
  let url;
  try {
    url = new URL(href);
  } catch {
    return href;
  }
  rewriteUrlOnNonProd(url);
  return url.toString();
}

/**
 * Iterates through all links on the page and updates their hrefs if conditions are fulfilled
 * (conditions: appropriate domain, appropriate current page locale,
 * environment and is user logged in)
 */
export function rewriteLinks(element) {
  const links = element.querySelectorAll('a[href]');
  links.forEach((link) => {
    link.href = getUpdatedHref(link.href);
  });
  return element;
}
