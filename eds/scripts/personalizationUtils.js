import { getPartnerDataCookieObject, hasProgramData, hasSalesCenterAccess } from './utils.js';
import { PROGRAM } from '../blocks/utils/dxConstants.js';

export const PERSONALIZATION_HIDE = 'personalization-hide';
export const COOKIE_OBJECT = getPartnerDataCookieObject(PROGRAM);

export function processPrimaryContact(el) {
  const isPrimary = COOKIE_OBJECT.primaryContact;
  el.classList.add(PERSONALIZATION_HIDE);
  if (!isPrimary) return;
  const primaryContactWrapper = document.createElement('div');
  const primaryContact = document.createElement('p');
  primaryContact.textContent = el.textContent;
  primaryContactWrapper.classList.add('primary-contact-wrapper');
  primaryContactWrapper.appendChild(primaryContact);
  el.replaceWith(primaryContactWrapper);
}

export function processSalesAccess(el, programType) {
  const salesAccess = hasSalesCenterAccess();
  const element = el.parentElement;
  if (!salesAccess) {
    element.classList.add(PERSONALIZATION_HIDE);
  }
}

export function processProfileItem(el, programType) {
  if (hasProgramData(programType)) return;
  el.classList.add(PERSONALIZATION_HIDE);

  const profile = el.closest('.profile');
  if (!profile) return;

  const profileItems = profile.querySelectorAll('h5, p, a, hr');
  const firstElement = Array.from(profileItems).find(item => !item.classList.contains(PERSONALIZATION_HIDE));
  if (firstElement) {
    firstElement.classList.add('no-section-title');
  }

  const sectionTitles = profile.querySelectorAll('h5');
  sectionTitles.forEach((sectionTitle) => {
    sectionTitle.classList.add(PERSONALIZATION_HIDE);
  });

  const divider = profile.querySelector('hr');
  if (!divider) return;
  divider.classList.add(PERSONALIZATION_HIDE);
}
