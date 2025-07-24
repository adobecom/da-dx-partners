import { getPartnerDataCookieValue, hasSalesCenterAccess } from './utils.js';

export const PERSONALIZATION_HIDE = 'personalization-hide';

export function processPrimaryContact(el) {
  const isPrimary = getPartnerDataCookieValue('primarycontact');
  el.classList.add(PERSONALIZATION_HIDE);
  if (!isPrimary) return;
  const primaryContactWrapper = document.createElement('div');
  const primaryContact = document.createElement('p');
  primaryContact.textContent = el.textContent;
  primaryContactWrapper.classList.add('primary-contact-wrapper');
  primaryContactWrapper.appendChild(primaryContact);
  el.replaceWith(primaryContactWrapper);
}

export function processSalesAccess(el) {
  const salesAccess = hasSalesCenterAccess();
  const element = el.parentElement;
  if (!salesAccess) {
    element.classList.add(PERSONALIZATION_HIDE);
  }
}
