import { getCurrentProgramType, getMetadataContent, isMember } from './utils.js';
import { loadPopupFragment } from './portalMessaging.js';
import { isProd } from '../blocks/utils/utils.js';
import { rewriteLinks } from './rewriteLinks.js';
import { personalizePage, personalizePlaceholders } from './personalization.js';
import { PERSONALIZATION_PLACEHOLDERS } from './personalizationConfigDX.js';

const LAST_DATE_SHOWN = 'last-certification-popup-shown';
const partnerDirectoryStage = 'https://partner-directory-stage.adobe.io/v1/dxp/contact/credentials';
const partnerDirectoryProd = 'https://partner-directory.adobe.io/v1/dxp/contact/credentials';
const partnerDirectoryUrl = isProd() ? partnerDirectoryProd : partnerDirectoryStage;

// Convert date to YYYY-MM-DD string in local timezone
function dateToLocalString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
// Normalize date to local midnight (removes time component)
function normalizeDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
// Parse date string to local midnight
// Handles "DD/MM/YYYY", "YYYY-MM-DD", or any date format
function parseLocalDate(dateString) {
  if (!dateString) return null;

  // Check if it's DD/MM/YYYY format (from API)
  const slashFormat = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateString.match(slashFormat);

  if (match) {
    // DD/MM/YYYY format - parse as local date
    const [, day, month, year] = match;
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  }

  // Check if it's YYYY-MM-DD format (from storage)
  const dashFormat = /^(\d{4})-(\d{2})-(\d{2})$/;
  const dashMatch = dateString.match(dashFormat);

  if (dashMatch) {
    // YYYY-MM-DD format - parse as local date
    const [, year, month, day] = dashMatch;
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  }

  // For other formats, parse and normalize to local midnight
  const parsedDate = new Date(dateString);
  if (Number.isNaN(parsedDate.getTime())) return null; // Invalid date

  return normalizeDate(parsedDate);
}
function getLastMilestone(certificationExpiresDate) {
  const milestones = [
    180, 150, 120, 90,
    75, 60,
    50, 40, 30,
    28, 26, 24, 22, 20, 18, 16,
    14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
  ];
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const today = normalizeDate(new Date());

  const milestonesDates = milestones.map(
    (milestone) => normalizeDate(
      new Date(certificationExpiresDate.getTime() - milestone * MS_PER_DAY),
    ),
  );
  const milestoneDatesFiltered = milestonesDates.filter((d) => d <= today);
  const closestPastDateSorted = milestoneDatesFiltered.sort((a, b) => b - a);
  return closestPastDateSorted[0];
}
function isMilestoneReached(certification, lastCertificationPopupShown) {
  const currentDate = normalizeDate(new Date());
  const certificationExpiresDate = parseLocalDate(certification.expirationDate);
  if (!certificationExpiresDate) return false;
  const certificationExpiresInDays = Math.round(
    (certificationExpiresDate - currentDate) / (24 * 60 * 60 * 1000),
  );
  if (certificationExpiresInDays < 0) {
    return false;
  }
  if (certificationExpiresInDays > 180) return false;
  const lastMilestone = getLastMilestone(certificationExpiresDate);

  return lastMilestone.getTime() > lastCertificationPopupShown.getTime();
}

// eslint-disable-next-line import/prefer-default-export,max-len
export async function certificationExpiresPopup(miloLibs, portalMessagingOpen, partnerAgreementDisplayed, imsClientId) {
  if (partnerAgreementDisplayed) return;
  if (portalMessagingOpen) return;
  if (!isMember()) return;
  const lastCertificationPopupShown = parseLocalDate(
    sessionStorage.getItem(LAST_DATE_SHOWN),
  ) || new Date(1970, 0, 1); // Jan 1, 1970 at midnight local time
  const today = normalizeDate(new Date());
  // Check if popup was already shown today (compare local calendar days, not time difference)
  if (lastCertificationPopupShown.getTime() >= today.getTime()) {
    return;
  }

  const imsToken = window.adobeIMS.getAccessToken().token;
  let shoulDisplayCertificationModal = false;

  try {
    const response = await fetch(partnerDirectoryUrl, {
      headers: {
        Authorization: `Bearer ${imsToken}`,
        'x-api-key': imsClientId,
      },
    });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    const { credentials } = result;
    shoulDisplayCertificationModal = credentials.some(
      (c) => isMilestoneReached(c, lastCertificationPopupShown),
    );
  } catch (error) {
    console.error(error.message);
  }
  if (!shoulDisplayCertificationModal) return;

  const CERTIFICATION_META = 'certification-modal';
  const certificationModalFragmentMeta = getMetadataContent(CERTIFICATION_META);
  if (!certificationModalFragmentMeta) {
    console.warn(`${CERTIFICATION_META} should be displayed but popup fragment path is not found`);
    return;
  }

  const certificationFragmentPath = certificationModalFragmentMeta || '/digitalexperience/fragments/modals/certification-modal';
  const popupContent = await loadPopupFragment(certificationFragmentPath, 'certification modal');
  if (!popupContent) {
    console.warn(`Popup fragment for ${certificationModalFragmentMeta} not found`);
    return;
  }

  const { getModal } = await import(`${miloLibs}/blocks/modal/modal.js`);
  const modal = await getModal(
    null,
    {
      id: 'certification-popup-modal',
      class: 's-size',
      content: popupContent,
      closeCallback: () => {
        sessionStorage.setItem(LAST_DATE_SHOWN, dateToLocalString(normalizeDate(new Date())));
      },
    },
  );
  if (!modal) return;
  const { loadArea } = await import(`${miloLibs}/utils/utils.js`);
  await loadArea(modal);
  personalizePlaceholders(PERSONALIZATION_PLACEHOLDERS, modal, getCurrentProgramType());
  personalizePage(modal);
  rewriteLinks(modal);
}
