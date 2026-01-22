import { portalMessaging } from './portalMessaging.js';
import { certificationExpiresPopup } from './certificationExpiresPopup.js';
import { CERTIFICATION_POPUP, isMember, PARTNER_AGREEMENT_POPUP, PORTAL_MESSAGING_POPUP} from './utils.js';
import { partnerAgreement } from './partnerAgreement.js';

export async function showNextPopup(miloLibs, imsClientId, nextPopup = '') {
  if (!isMember()) {
    return;
  }
  const partnerAgreementDisplayed = !nextPopup || nextPopup === PARTNER_AGREEMENT_POPUP
    ? await partnerAgreement(miloLibs) : false;
  const portalMessagingOpen = !nextPopup || nextPopup === PORTAL_MESSAGING_POPUP
    ? await portalMessaging(miloLibs, partnerAgreementDisplayed) : false;
  // eslint-disable-next-line no-unused-vars
  const certificationExpiresPopupOpen = !nextPopup || nextPopup === CERTIFICATION_POPUP
    ? await certificationExpiresPopup(
      miloLibs,
      portalMessagingOpen,
      partnerAgreementDisplayed,
      imsClientId,
    )
    : false;
}
