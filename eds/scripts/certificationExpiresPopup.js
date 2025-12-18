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

function dateToLocalString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function normalizeDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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
  const certificationExpiresDate = normalizeDate(new Date(certification.expirationDate));
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
  // if (!isMember()) return;
  const lastCertificationPopupShown = new Date(sessionStorage.getItem(LAST_DATE_SHOWN));
  if (new Date().getTime() - lastCertificationPopupShown.getTime() < 24 * 60 * 60 * 1000) {
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
    const { credentials } = result.credentials;
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
  const popupContent = await loadPopupFragment(certificationFragmentPath);
  if (!popupContent) {
    console.warn(`Popup fragment for ${certificationModalFragmentMeta} not found`);
    return;
  }

  const { getModal } = await import(`${miloLibs}/blocks/modal/modal.js`);
  const modal = await getModal(
    null,
    {
      id: 'portal-messaging-modal',
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
