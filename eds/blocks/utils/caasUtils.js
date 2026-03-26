import { getLibs } from '../../scripts/utils.js';

const miloLibs = getLibs();
const { getConfig } = await import(`${miloLibs}/utils/utils.js`);

/**
 * Hash returned in base 36 (highest possible) to encode in as few bytes as possible
 * https://en.wikipedia.org/wiki/Rolling_hash
 * @param {string} s to hash
 * @param {int} l length that hash should be
 * @returns {string} the hashed string
 */
export function rollingHash(s, l = 6) {
  if (!s) {
    return '';
  }
  const BASE = 53;
  const MOD = 10 ** l + 7;
  let hash = 0;
  let basePower = 1;
  /* eslint-disable-next-line no-plusplus */
  for (let i = 0; i < s.length; i++) {
    hash = (hash + (s.charCodeAt(i) - 97 + 1) * basePower) % MOD;
    basePower = (basePower * BASE) % MOD;
  }
  return ((hash + MOD) % MOD).toString(36);
}
function getTagTitleLocalized(tag) {
  const { locale } = getConfig();
  const localeToTagTranslationLocaleDiffs = { cn: 'zh_cn' };
  const mappedLocale = localeToTagTranslationLocaleDiffs[locale?.region] || locale?.region;
  const value = tag[`title.${mappedLocale}`] || tag.title;
  return new DOMParser().parseFromString(value, 'text/html').body.textContent;
}

function getParentChild(id) {
  let i = id.length;
  while (id[i] !== '/' && i >= 0) {
    // eslint-disable-next-line no-plusplus
    i--;
  }
  return [id.substring(0, i), id.substring(i + 1)];
}

function getHash(tagID) {
  const [parent, child] = getParentChild(tagID);
  return `${rollingHash(parent)}/${rollingHash(child)}`;
}
export function extractFilterData(tagPath, caasTags) {
  const pathParts = tagPath.replace('caas:', '').split('/'); // Remove prefix and split by hierarchy
  let currentLevel = caasTags.namespaces.caas.tags; // Start from the root tags
  let foundTag;
  // eslint-disable-next-line no-restricted-syntax
  for (const part of pathParts) {
    foundTag = currentLevel[part];
    if (!foundTag) return null;
    currentLevel = foundTag.tags || [];
  }
  if (!foundTag) return null;
  return {
    key: foundTag.tagID.replace('caas:', ''),
    value: getTagTitleLocalized(foundTag),
    tags: Object.entries(currentLevel)
      .map(([, value]) => ({
        key: value.tagID.replace(`${foundTag.tagID}/`, '').replace('-&-', '-and-'),
        parentKey: foundTag.tagID.replace('caas:', ''),
        checked: false,
        value: getTagTitleLocalized(value),
        hash: getHash(value.tagID),
      })),
  };
}
