import {
  isMember,
  getNodesByXPath,
  getPartnerDataCookieObject, getCurrentProgramType
} from './utils.js';
import {
  PERSONALIZATION_PLACEHOLDERS,
  PERSONALIZATION_MARKER,
  PROCESSED_MARKER,
  PERSONALIZATION_CONDITIONS,
  PROFILE_PERSONALIZATION_ACTIONS, LEVEL_CONDITION, NEGATION_PREFIX,
} from './personalizationConfigDX.js';
import {
  PERSONALIZATION_HIDE,
} from './personalizationUtils.js';
import {DX_PROGRAM_TYPE} from "../blocks/utils/dxConstants.js";

export function personalizePlaceholders(placeholders, context = document, programType) {
  Object.entries(placeholders).forEach(([key, value]) => {
    const programData = getPartnerDataCookieObject(programType);
    const placeholderValue = programData[key];
    getNodesByXPath(value, context).forEach((el) => {
      if (!placeholderValue) {
        el.remove();
        return;
      }
      el.textContent = el.textContent.replace(`$${key}`, placeholderValue);
      el.classList.add(`${key.toLowerCase()}-placeholder`);
    });
  });
}

function isNegatedCondition(condition) {
  return condition.startsWith(NEGATION_PREFIX);
}

function getBaseConditionName(condition) {
  if (!isNegatedCondition(condition)) return condition;
  return condition.replace(NEGATION_PREFIX, 'partner-');
}

function shouldHide(conditions, conditionsConfig = PERSONALIZATION_CONDITIONS) {
  // eslint-disable-next-line max-len
  const partnerLevelConditions = conditions.filter((condition) => condition.startsWith(LEVEL_CONDITION));

  const otherConditions = conditions.filter((condition) => {
    if (condition.startsWith(LEVEL_CONDITION)) return false;
    const baseCondition = getBaseConditionName(condition);
    return Object.prototype.hasOwnProperty.call(conditionsConfig, baseCondition);
  });

  const matchesPartnerLevel = partnerLevelConditions.length === 0
    || partnerLevelConditions.some((condition) => {
      const level = condition.replace(`${LEVEL_CONDITION}-`, '');
      return conditionsConfig[LEVEL_CONDITION]?.(level);
    });

  const matchesOtherConditions = otherConditions.every((condition) => {
    const baseCondition = getBaseConditionName(condition);
    let value = conditionsConfig[baseCondition];
    return isNegatedCondition(condition) ? !value : value;
  });

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

export function personalizePage(page) {
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
  personalizePlaceholders(PERSONALIZATION_PLACEHOLDERS, main, getCurrentProgramType());
  personalizePage(main);
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
  personalizePlaceholders(PERSONALIZATION_PLACEHOLDERS, profile, DX_PROGRAM_TYPE);
  personalizeDropdownElements(profile);
}

export function applyGnavPersonalization(gnav) {
  if (!isMember()) return gnav;
  const importedGnav = document.importNode(gnav, true);
  personalizeMainNav(importedGnav);
  personalizeProfile(importedGnav);
  return importedGnav;
}
