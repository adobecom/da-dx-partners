import {
  isMember,
  getNodesByXPath,
  isRenew,
  getPartnerDataCookieObject
} from './utils.js';
import { getConfig } from '../blocks/utils/utils.js';
import {
  PERSONALIZATION_PLACEHOLDERS,
  PERSONALIZATION_MARKER,
  PROCESSED_MARKER,
  PERSONALIZATION_CONDITIONS,
  PROFILE_PERSONALIZATION_ACTIONS, LEVEL_CONDITION,
} from './personalizationConfigDX.js';
import {
  COOKIE_OBJECT,
  PERSONALIZATION_HIDE,
} from './personalizationUtils.js';
import {PROGRAM_TYPES} from "../blocks/utils/dxConstants.js";

function personalizePlaceholders(placeholders, context = document) {
  PROGRAM_TYPES.forEach((programType) => {
    const programData = getPartnerDataCookieObject(programType);
    Object.entries(placeholders).forEach(([key, value]) => {
      if (!key.startsWith(programType)) {
        return;
      }
      const transformedKey = key.replace(`${programType}-`, '')
      const placeholderValue = programData[transformedKey];
      getNodesByXPath(value, context).forEach((el) => {
        if (!placeholderValue) {
          el.remove();
          return;
        }
        el.textContent = el.textContent.replace(`$${key}`, placeholderValue);
        el.classList.add(`${transformedKey.toLowerCase()}-placeholder`);
      });
    });
  });
}

function shouldHide(conditions, conditionsConfig = PERSONALIZATION_CONDITIONS) {
  // eslint-disable-next-line max-len
  const partnerLevelConditions = conditions.filter((condition) => condition.startsWith(LEVEL_CONDITION));

  // eslint-disable-next-line max-len
  const otherConditions = conditions.filter((condition) => !condition.startsWith(LEVEL_CONDITION) && Object.keys(PERSONALIZATION_CONDITIONS).includes(condition));

  const matchesPartnerLevel = partnerLevelConditions.length === 0
    || partnerLevelConditions.some((condition) => {
      const conditionKeys = condition.split('-');
      const level = conditionKeys.pop();
      const program = conditionKeys.pop();
      return conditionsConfig[LEVEL_CONDITION]?.(level, program);
    });

  const matchesOtherConditions = otherConditions.every((condition) => conditionsConfig[condition]);

  return !(matchesPartnerLevel && matchesOtherConditions);
}

// eslint-disable-next-line max-len
function hideElement(element, conditions, conditionsConfig = PERSONALIZATION_CONDITIONS, remove = false) {
  if (!element || !conditions?.length) return;
  if (shouldHide(conditions, conditionsConfig)) {
    if (remove) {
      element.remove();
    } else {
      element.classList.add(PERSONALIZATION_HIDE);
    }
  }
}

function hideSections(page) {
  const sections = Array.from(page.getElementsByClassName('section-metadata'));
  sections.forEach((section) => {
    let hide = false;
    Array.from(section.children).forEach((child) => {
      const col1 = child.firstElementChild;
      const col2 = child.lastElementChild;
      if (col1?.textContent !== 'style' || !col2?.textContent.includes(PERSONALIZATION_MARKER)) return;
      const conditions = col2?.textContent?.split(',').map((text) => text.trim());
      hide = shouldHide(conditions);
    });
    if (!hide) return;
    const parent = section.parentElement;
    Array.from(parent.children).forEach((el) => {
      el.remove();
    });
  });
}

function personalizePage(page) {
  const blocks = Array.from(page.getElementsByClassName(PERSONALIZATION_MARKER));
  blocks.forEach((el) => {
    const conditions = Object.values(el.classList);
    hideElement(el, conditions);
    el.classList.remove(PERSONALIZATION_MARKER);
    el.classList.add(`${PERSONALIZATION_MARKER}${PROCESSED_MARKER}`);
  });
  hideSections(page);
}

export function applyPagePersonalization() {
  const main = document.querySelector('main') ?? document;
  personalizePlaceholders(PERSONALIZATION_PLACEHOLDERS, main);
  personalizePage(main);
}

function processRenew(profile) {
  if(!profile){
    return;
  }
  const { env } = getConfig();
  const renew = isRenew();
  const renewElements = Array.from(profile.querySelectorAll('.partner-renew'));
  renewElements.forEach((el) => {
    el.classList.add(PERSONALIZATION_HIDE);
    if (!renew) return;
    const { accountStatus } = renew;
    if (el.classList.contains(`partner-${accountStatus}`)) {
      el.classList.remove(PERSONALIZATION_HIDE);
    }
  });
}

function processGnavElements(elements) {
  const regex = /\((.*?)\)/g;
  return elements.map((el) => {
    const matches = [...el.textContent.matchAll(regex)];
    if (!matches?.length || !matches[0][1]) return {};
    const match = matches[0][1];
    el.textContent = el.textContent.replace(`(${match})`, '');
    const conditions = match.split(',').map((condition) => condition.trim());
    if (!conditions.length) return {};
    return { el, conditions };
  });
}

function personalizeDropdownElements(profile) {
  const personalizationXPath = `//*[contains(text(), "${PERSONALIZATION_MARKER}")]`;
  const elements = getNodesByXPath(personalizationXPath, profile);
  const processedElements = processGnavElements(elements);
  processedElements.forEach(({ el, conditions }) => {
    if (!el || !conditions) return;
    const action = conditions.pop();
    PROFILE_PERSONALIZATION_ACTIONS[action]?.(el);
  });
}

export function personalizeMainNav(gnav) {
  const personalizationXPath = `//*[contains(text(), "${PERSONALIZATION_MARKER}") and not(ancestor::*[contains(@class, "profile")])]`;
  const elements = getNodesByXPath(personalizationXPath, gnav);
  const processedElements = processGnavElements(elements);
  const separatorSelector = 'h5';

  processedElements.forEach(({ el, conditions }) => {
    if (!el || !conditions) return;

    if (el.tagName.toLowerCase() === separatorSelector) {
      // main nav dropdown menu group separators
      const { nextElementSibling } = el;
      const hide = shouldHide(conditions, PERSONALIZATION_CONDITIONS);
      if (nextElementSibling?.tagName.toLowerCase() !== separatorSelector && hide) {
        nextElementSibling.remove();
      }
    }

    const wrapperEl = el.closest('h2, li');
    hideElement(wrapperEl || el, conditions, PERSONALIZATION_CONDITIONS, true);
  });

  // link group blocks
  const linkGroups = gnav.querySelectorAll('.link-group.partner-personalization');
  Array.from(linkGroups).forEach((el) => {
    const conditions = Object.values(el.classList);
    hideElement(el, conditions, PERSONALIZATION_CONDITIONS, true);
  });
}

export function shouldHideLinkGroup(elem) {
  if (elem.classList.contains(PERSONALIZATION_MARKER)) {
    const conditions = Object.values(elem.classList);
    return shouldHide(conditions, PERSONALIZATION_CONDITIONS);
  }
}

function personalizeProfile(gnav) {
  const profile = gnav.querySelector('.profile');
  personalizePlaceholders(PERSONALIZATION_PLACEHOLDERS, profile);
  personalizeDropdownElements(profile);
  processRenew(profile);
}

export function applyGnavPersonalization(gnav) {
  if (!isMember()) return gnav;
  const importedGnav = document.importNode(gnav, true);
  personalizeMainNav(importedGnav);
  personalizeProfile(importedGnav);
  return importedGnav;
}
